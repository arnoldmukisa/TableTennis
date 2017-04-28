'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

/**
 * Triggers when a user is added to a game and sends a notification.
 *
 * Followers add a flag to `/followers/{followedUid}/{followerUid}`.
 * Users save their device notification tokens to `/users/{followedUid}/notificationTokens/{notificationToken}`.
 */
exports.sendGameNotification = functions.database.ref('Games/Game/{game_uid}').onWrite(event => {
  // const user_uid =event.data.val().user_uid;
  const opponent_uid = event.data.child('opponent_uid').val();
  const game_uid = event.params.game_uid;
  const user_uid = event.data.child('added_by').val();


  // If game deleted we exit the function.
  if (!event.data.val()) {
    return console.log('User ', user_uid, 'failed to add', opponent_uid, 'to Games');
  }
  console.log('We have a new game added by:', user_uid, 'for opponent user:', opponent_uid);

  // Get the list of device notification tokens.
  const getDeviceTokensPromise = admin.database().ref(`/PlayerProfile/${opponent_uid}/notificationTokens`).once('value');

  // Get the user profile.
  const getUserProfilePromise = admin.auth().getUser(user_uid);

  return Promise.all([getDeviceTokensPromise, getUserProfilePromise]).then(results => {
    const tokensSnapshot = results[0];
    const user = results[1];

    // Check if there are any device tokens.
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
    console.log('Fetched user profile', user);

    // Notification details.
    const payload = {
      notification: {
        title: 'You have added to New Game!',
        body: `${user.displayName} added you to a game`,
        icon: '/firebase-logo.png'
      }
    };

    // Listing all tokens.
    const tokens = Object.keys(tokensSnapshot.val());
    console.log('There are', tokens);

    // Send notifications to all tokens.
    return admin.messaging().sendToDevice(tokens, payload).then(response => {
      // For each message check if there was an error.
      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          // Cleanup the tokens who are not registered anymore.
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
          }
        }
      });
      return Promise.all(tokensToRemove);
    });
  });
});
