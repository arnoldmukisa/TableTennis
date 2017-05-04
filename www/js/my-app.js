// Initialize your app
var myApp = new Framework7({
	material: true,
	modalTitle: 'Table Tenis',
	// pushState : true,// to enable back button on app
	init: false // prevent app from automatic initialization

});

// Export selectors engine
var $$ = Dom7;
// Add view
var mainView = myApp.addView('.view-main', {
	// domCache: true //enable inline pages

});
// Initialize Firebase
var config = {
	apiKey: "AIzaSyB5LRHsMRabuBJIuu2lZ78rLm90oMVQ_3E",
	authDomain: "cmupingpong.firebaseapp.com",
	databaseURL: "https://cmupingpong.firebaseio.com",
	storageBucket: "cmupingpong.appspot.com",
	messagingSenderId: "351881220973"
};

firebase.initializeApp(config);

var uiConfig = {

		credentialHelper: firebaseui.auth.CredentialHelper.NONE,
		signInSuccessUrl: 'index.html',
		signInOptions: [
			{
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            // Whether the display name should be displayed in the Sign Up page.
            requireDisplayName: true
          	}
			// firebase.auth.EmailAuthProvider.PROVIDER_ID,
			// firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			// firebase.auth.FacebookAuthProvider.PROVIDER_ID,
			// firebase.auth.TwitterAuthProvider.PROVIDER_ID
		],
		// Terms of service url.
		tosUrl: 'services.html'
		};

		// ui.reset();
	// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var database = firebase.database();
var player_ref = database.ref('PlayerProfile/');
var user = firebase.auth().currentUser;

var messaging = firebase.messaging();

function requestPermission(uid) {

	messaging.requestPermission()
	.then(function() {
	  console.log('Notification permission granted.');
	 	return messaging.getToken()
	})
	.then(function(token) {
		console.log(token);

		firebase.database().ref('PlayerProfile/' + uid + '/notificationTokens/' + token).set(true);

	})
	.catch(function(err) {
	  console.log('Unable to get permission to notify.', err);
	})

}

messaging.onMessage(function(payload) {
	// console.log(payload.notification.body);
	myApp.addNotification({
		message: payload.notification.body
	});
})



$$(document).on('page:init', function(e) {
	var user = firebase.auth().currentUser;
	var name, email, photoUrl, uid, emailVerified;
	var page = e.detail.page;
	var opponentName=page.query.opponentName;
	// if (!user) {
	// 	if (page.name==='add-game') {
	// 		loginRedirect();
	// 		return
	// 	}
	// }

	// Player Page
	if (page.name === 'index') {

		authState(page.name);
		playerContentIndex(3, 'rating');

	}
	if (page.name === 'players') {
		playerContent('rating');
		var mySearchbar = myApp.searchbar('.searchbar', {
		  	searchList: '.list-block-search',
		  	searchIn: '.item-title'
			});
		}

	if (page.name === 'login-screen') {

		// The start method will wait until the DOM is loaded.
			ui.start('#firebaseui-auth-container', uiConfig);

	}
	if (page.name === 'add-game') {
		console.log(page.name + ' initialized');//check when page is loaded from cache

		if (user != null) {

		opponentName=page.query.opponentName;
		name = user.displayName;

		loadAddGame();
		$$('.welcomeName').html('Hi' + ' ' + name);
		$$('.form-to-data').on('click', formFunction);
		keyboardScrollFix(page);//fix toolbar floating over keyboard

			if(opponentName!=null){
				$$('#autocomplete-dropdown-all').val(opponentName);
			}//Auto complete form if add game is loaded from opponnet page
		}
		else{

		$$('.welcomeName').html('No account');
		loginRedirect();

		}
	}
	if (page.name === 'timeline') {
		authState(page.name);
		player = page.query.name;
		console.log(player);
		if (player!=null) {
			name = player;
		}
		else if(player==null && user!=null){
		name	=	user.displayName;
		}
		else{
			loginRedirect();
		}

		if (name!=null) {
			gamesTimeline(name);}
		else{
			console.log(name+'No name')
		}

	}

});

myApp.init();

//Log Out function
$$('.log-out').on('click', function(e) {

	firebase.auth().signOut();
	mainView.router.loadPage('index.html');
	alert('Sign Out Successful');
});

// =================Add Game Page=====================
function loadAddGame() {
//initialize fuction scope variables
	var winner_score, winner_uid, winner_name, winner_rating;
	var loser_score, loser_uid, loser_name, loser_rating, totalPoints;
	var user = firebase.auth().currentUser;

// Populating Opponents Name Field
	var autocompleteDropdownAll = myApp.autocomplete({
		input: '#autocomplete-dropdown-all',
		openIn: 'dropdown',
		cache:false,
		source: function(autocomplete, query, render) {

			var results = [];
			var player_ref = database.ref('PlayerProfile/');

			player_ref.on("value", function(snapshot) {
				snapshot.forEach(function(player_snap) {

					var playerName = player_snap.child("displayName").val();
					if ((playerName.toLowerCase().indexOf(query.toLowerCase()) >= 0) && playerName!=user.displayName)
						results.push(playerName);
				});
				render(results)
			});
		}
	});

	// $$('.form-to-data').on('click', formFunction);

}// ========================End of loadAddGame================================
		// End of Opponents Name field
	function validateScores(opponent_score,user_score,opponent_name) {

		var	diffInScore = Math.abs(user_score - opponent_score);

			if (!opponent_score) {
			myApp.alert('Opponent Score is empty...');
			return false;
			}
			if (!user_score) {
			myApp.alert('Your Score is empty...');
			return false;
			}
			if (!opponent_name) {
			myApp.alert('No Opponent selected...');
			return false;
			}
			if (user_score == opponent_score) {
			myApp.alert('You cant have equal scores...');
			return false;
			}
			if (user_score<11 && opponent_score<11) {
				myApp.alert('One of the players need to reach 11...');
			return false;
			}
			if (user_score>=11 || opponent_score>=11){

				if (diffInScore>=2) {
					return true;
				}
				else {
				myApp.alert('The difference in scores has to be greater than or equal to 2...');
				return false;
				}
			}

			$$('input[type="text"]').on('keyup keydown change', function (e) {

				var opponent_ref = database.ref('PlayerProfile/').child('displayName').equalTo(opponent_name);
				opponent_ref.on('value', function (snapshot) {

					var opponent_rating_ref = snapshot.val().rating;
					$$('opponent_rating').html(opponent_rating);
					console.log(opponent_rating);

				})
		  		console.log('input value changed');
			});
	}


	function formFunction() {
		var user = firebase.auth().currentUser;

		//Current User Data
		var UserformData = myApp.formToData('#UserScoreForm'); // formData is an Object
		var user_uid = user.uid;
		var user_name = user.displayName;
		var user_score = parseInt(UserformData["UserScore"]);

		//Opponent Data
		var OpponentformData = myApp.formToData('#OpponentScoreForm');
		var opponent_name = OpponentformData["OpponentName"];
		var opponent_score = parseInt(OpponentformData["OpponentScore"]);

		if (validateScores(opponent_score,user_score,opponent_name)) {

			player_ref.orderByChild("displayName").limitToLast(1).equalTo(opponent_name).once("child_added", function(snapshot) {

				opponent_uid = snapshot.key;
				opponent_rating = snapshot.val().rating;
				opponent_matches = snapshot.val().matches;
				pushGame();

			}, function(error) {
				  // The callback failed.
				  console.error(error);
				  console.log('error');

				}); //End of player_ref opponent_uid

		}
		else {
			console.log('val failed');
			mainView.router.back({
				  pageName: 'add-game', // - in case you use Inline Pages or domCache
				  force: true,
				  ignoreCache:true
			  });
		}

	function findWinner() {

		if (user_score > opponent_score) {

			winner_score = user_score;
			winner_uid = user_uid;
			winner_name = user_name;

			loser_score = opponent_score;
			loser_uid = opponent_uid;
			loser_name = opponent_name;
			console.log('User Won with :' + winner_score + ' Opponent lost with:' + loser_score);

		} else {

			winner_score = opponent_score;
			winner_uid = opponent_uid;
			winner_name = opponent_name;

			loser_score = user_score;
			loser_uid = user_uid;
			loser_name = user_name;
			console.log('Opponent Won with:' + winner_score + ' User lost with: ' + loser_score);
		}
	}

	function pushGame() {

		findWinner();

		if (calculate()) {

			updateMatches(user_uid);
			updateMatches(opponent_uid);
			mainView.router.loadPage('timeline.html');

		}
		else {
			myApp.alert('Something Went Wrong! Game was not added')
		}
	} //End of push Game function

	function calculate() {

		//Evaluate winner rating and loser rating
		database.ref('/PlayerProfile/' + user_uid).once('value').then(function(snapshot) {

			var user_rating = snapshot.val().rating;

			if (user_score > opponent_score) {

				winner_rating = user_rating;
				loser_rating = opponent_rating;
			}
			else {

				winner_rating = opponent_rating;
				loser_rating = user_rating
			}

			points = (winner_score - loser_score);

			var diffInRatings = (winner_rating - loser_rating);
			var changeInRating = ((0.000128 * (diffInRatings * diffInRatings)) - (0.064 * diffInRatings) + 8);

			if (winner_rating != loser_rating) {

				pointsAwarded = (points / 10);
				totalPoints=Math.round10(pointsAwarded+changeInRating,-2);
				new_winner_rating = (winner_rating + changeInRating + pointsAwarded);
				new_loser_rating = (loser_rating - changeInRating);

			}
			else if (winner_rating == loser_rating) {

				pointsAwarded = (points / 10);
				totalPoints=Math.round10(pointsAwarded,-2);
				new_winner_rating = (winner_rating + pointsAwarded);
				new_loser_rating = (loser_rating - pointsAwarded);

			}
			else {
				myApp.alert('Something is wrong')
				return false;
			}

			new_winner_rating = Math.round10(new_winner_rating,-2);
			new_loser_rating= Math.round10(new_loser_rating,-2)

				if(user_uid==winner_uid){
					new_user_rating = new_winner_rating;
					}
				else if(user_uid==loser_uid){
					new_user_rating=new_loser_rating
				}

			var game_ref = database.ref('Games/').child('Game');
			var time_stamp =firebase.database.ServerValue.TIMESTAMP;

			game_ref.push({

				added_by:user_uid,
				user_score:user_score,
				user_name:user_name,
				user_rating:new_user_rating,
				opponent_uid:opponent_uid,
				opponent_name:opponent_name,
				opponent_score:opponent_score,
				opponent_rating:new_loser_rating,
				status:'pending',
				date:time_stamp

			},
			function (error) {
			  if (error){

				console.log('Error has occured during saving process')
  				return false;
			  }
			  else{

				console.log("Data has been saved succesfully")
  				var updates = {};

  				updates['PlayerProfile/' + winner_uid + '/rating'] = new_winner_rating;
  				updates['PlayerProfile/' + loser_uid + '/rating'] = new_loser_rating;

				myApp.addNotification({
  			        message: 'Game Has been added. Your new rating is :'+ new_user_rating,
  			    });

  				return database.ref().update(updates);
			  }
			})
		});

	return true;
	}

};//==========End of on-form-click====/

function updateMatches(uid) {

	matches_ref = database.ref('/PlayerProfile/' + uid).once('value').then(function(snapshot) {

		var current_matches = snapshot.val().matches;
		updated_matches = current_matches + 1;

		var updates = {};
		updates['PlayerProfile/' + uid + '/matches'] = updated_matches;

		return database.ref().update(updates);
		});
}

function authState(page) {
	firebase.auth().onAuthStateChanged(function(user) {

	if (user) {
		// User is signed in.
		displayWelcomeBar('show');//Displays Rating and User Name

		var displayName = user.displayName;
		var email = user.email;
		var emailVerified = user.emailVerified;
		var photoURL = user.photoURL;
		var uid = user.uid;
		var providerData = user.providerData;

			user.getToken().then(function(accessToken) {
				document.getElementById('sign-in-status').textContent = 'Signed in';
				removeLink('a','auth');//removes logout links after sign in
				displayRatingHome(uid,page);
			});

		createNewProfile(uid,displayName);//Create Profile Table if does not exists
		requestPermission(uid);
		}
		else {// User is signed out.

		document.getElementById('sign-in-status').textContent = 'Signed out';
		addLink('div','loginLink','Sign in');//adds sign-in links after sign out
		removeLink('a','timelineLink')//removes time-line links link after sign out
		removeLink('a','log-out')//removes log-out link link after sign out
		displayWelcomeBar('hide');
		}
	},
	function(error) {
		console.log(error);
	});
};
// ============================================Generate Player List=============================
function playerContent(sort) {
	var player_ref = database.ref('PlayerProfile/');
	player_ref.orderByChild(sort).on("value", function(snapshot) {
	snapshot.forEach(function(player_snap) {
		var ratings = player_snap.child("rating").val();
		var players = player_snap.child("displayName").val();
		var matches = player_snap.child("matches").val();

		// Random image
		var picURL = './img/account_circle.svg';
		// Random song
		var player = players;
		// Random author
		var rating = ratings;

		var match = matches;
		// List item html
		var itemHTML = 	'<a href="timeline.html?name='+player+'" class="item-link">'+
						'<li class="item-content">' +
						'<div class="item-media"><img src="' + picURL + '" width="44"/></div>' +
						'<div class="item-inner">' +
						'<div class="item-title-row">' +
						'<div class="item-title">' + player + '</div>' +
						'</div>' +
						'<div class="item-subtitle">' + '|' + match + '|' + '	' + rating + '</div>' +
						'</div>' +
						'</li>'+
						'</a>';
		// Prepend new list element
		$$('.player-list').find('ul').prepend(itemHTML);
		// When loading done, we need to reset it

	});
});
};

function playerContentIndex(list_no, sort) {

	var player_ref = database.ref('PlayerProfile/').limitToLast(list_no);
	player_ref.orderByChild(sort).on("value", function(snapshot) {
	$$('.player-list-index').find('ul').html('');
	snapshot.forEach(function(player_snap) {
		var ratings = player_snap.child("rating").val();
		var players = player_snap.child("displayName").val();
		var matches = player_snap.child("matches").val();

		// Random image
		var picURL = './img/account_circle.svg';
		// Random song
		var player = players;
		// Random author
		var rating = ratings;

		var match = matches;
		// List item html
		var itemHTML =	'<a href="timeline.html?name='+player+'" class="item-link">'+
						'<li class="item-content player-link">' +
						'<div class="item-media"><img src="' + picURL + '" width="44"/></div>' +
						'<div class="item-inner">' +
						'<div class="item-title-row">' +
						'<div class="item-title">' + player + '</div>' +
						'</div>' +
						'<div class="item-subtitle">' + '|' + match + '|' + '	' + rating + '</div>' +
						'</div>' +
						'</li>'+
						'</a>';
		// Prepend new list element
		$$('.player-list-index').find('ul').prepend(itemHTML);
	});
});
};

function displayWelcomeBar(status) {
	var welcomeHTML=	'<div class="card-header bg-green">'+
										'<div class="center chip">'+
										'<div class="chip-media bg-bluegray matchesHome"></div>'+
    								'<div class="chip-label ratingHome color-white" style="font-size: 18px; font-weight: 100;"></div>'+
										'</div>';

	var timelineHTML='<div class="center chip">'+
										'<div class="chip-media bg-bluegray matchesHome"></div>'+
    								'<div class="chip-label ratingHome color-white" style="font-size: 18px; font-weight: 100;"></div>';

	// Prepend new list element
	if (status=='show') {

		$$('.welcomeCard').html(welcomeHTML);
		// $$('.navTitle').html()
		$$('.timelineBar').html(timelineHTML)
	}
	else if (status=='hide') {

		welcomeHTML ='';
		$$('.welcomeCard').html(welcomeHTML);
		$$('.navTitle').html('Table Tennis')
	}
	else {
		console.log('status var in displayWelcomeBar() is',status);
	}

}

displayRatingHome = function(uid,page) {
	var player_ref_uid = database.ref('PlayerProfile/'+uid);
	player_ref_uid.on("value", function(snapshot) {

	var	rating = snapshot.val().rating;
	var	matches = snapshot.val().matches;
	var displayName=snapshot.val().displayName;

		$$('.navTitle').html(displayName);
		$$('.ratingHome').html(rating);
		$$('.matchesHome').html(matches);
		if (page==='timeline') {

		}

	});
}

function createNewProfile(uid,displayName) {

	var player_ref = database.ref('PlayerProfile/');
	player_ref.once('value', function(snapshot) {
		if (snapshot.hasChild(uid)) {

			console.log('Profile Exists');
		}
		else if(uniqueDisplayName()){
			var new_player_ref = database.ref('PlayerProfile/' + uid);
			new_player_ref.set({
				rating: 1000,
				matches: 0,
				displayName: displayName
			});
			alert("Profle Created!");
		}
	});
}

function uniqueDisplayName() {
	return true;
}

function loginRedirect() {

    myApp.modal({
    title:  'Your Not Logged In',
    text: 'Login to be able to add game scores',
    verticalButtons: true,
    buttons: [
      {
        text: 'Login',
        onClick: function() {
          mainView.router.loadPage('#login-screen');
        }
      },
      {
        text: 'Cancel',
        onClick: function() {
		// mainView.router.back({
		// 		//   url: 'index.html', // - in case you use Ajax pages
		// 		  pageName: 'index', // - in case you use Inline Pages or domCache
		// 		  force: true,
		// 		  ignoreCache:true
		// });
		// $$('.view-main .page-on-left').remove();
		// myApp.removeFromCache('#add-game')
          mainView.router.loadPage('index.html');
        }
      },
    ]
  })

}

function gamesTimeline(name) {

	var player_ref = database.ref('PlayerProfile/');
	player_ref.orderByChild("displayName").limitToLast(1).equalTo(name).on("child_added", function(snapshot) {

	user_uid = snapshot.key;
	matches= snapshot.val().matches;
	console.log(matches);
	$$('.matches').html(matches);
	getGameData(user_uid);

}, function(error) {
	  // The callback failed.
	  if (error) {
	  	  console.error(error);
		  console.log('error');
	  }else {

	  }

	});

function getGameData(user_uid) {

	var myGamesRef = firebase.database().ref('Games/Game/').orderByChild('date');

	myGamesRef.on('value', function(snapshot) {
		snapshot.forEach(function(childSnapshot) {
		// var childKey = childSnapshot.key;
		// var childData = childSnapshot.val();
		var user_score = childSnapshot.val().user_score;
		var user_name =	childSnapshot.val().user_name;
		var added_by = childSnapshot.val().added_by;
		var opponent_score = childSnapshot.val().opponent_score;
		var opponent_uid = childSnapshot.val().opponent_uid;
		var opponent_name = childSnapshot.val().opponent_name;
		var time_stamp = childSnapshot.val().date;
		var date = new Date(time_stamp).toUTCString().slice(0, -4);

				if(added_by==user_uid||opponent_uid==user_uid){
				displayGameData(date,user_name,user_score,opponent_name,opponent_score);
				}
		});
	}

);
}

}//End of gamesTimeline

function displayGameData(date,user_name,user_score,opponent_name,opponent_score) {
	var timelineItem =	'<div class="timeline-item">'+
						'<div class="timeline-item-date">'+ '<small>'+'</small></div>'+
						'<div class="timeline-item-divider"></div>'+
						'<div class="timeline-item-content">'+
						'<div class="timeline-item-inner">'+
					    '<div class="timeline-item-time">'+date+'</div>'+
					    '<div class="timeline-item-subtitle">'+
					    '<div class="chip">'+
			            '<div class="chip-media bg-red">'+user_score+'</div>'+
			            '<div class="chip-label">'+user_name+'</div>'+
			            '</div>'+
							    '<div class="timeline-item-subtitle">'+
							    '<div class="chip">'+
			            '<div class="chip-media bg-bluegray">'+opponent_score+'</div>'+
			            '<div class="chip-label">'+opponent_name+'</div>'+
			            '</div>'+
				    	'</div>'+
						'</div>'+
						'</div>'+
						'</div>'

	$$('.timeline-loop').prepend(timelineItem);
}


function addLink(element,hasClass,action) {

	var link	= $$(element).filter(function(index, el) {
		return $$(this).hasClass(hasClass);
	});
	if (action=='Sign in') {

		link.html('Sign in');
	}
	else {
			myApp.alert('No valid action was submitted for login elements')
	}

}

function removeLink(element,hasclass) {

	var link = $$(element).filter(function(index, el) {
	return $$(this).hasClass(hasclass);
	});
	link.remove();
}

(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // If the value is negative...
    if (value < 0) {
      return -decimalAdjust(type, -value, exp);
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();
function keyboardScrollFix(page) {
	if (!myApp.device.ios) {
		$$(page.container).find('input, textarea').on('focus', function(event) {
			var container = $$(event.target).closest('.page-content');
			var elementOffset = $$(event.target).offset().top;
			var pageOffset = container.scrollTop();
			var newPageOffset = pageOffset + elementOffset - 81;
			setTimeout(function() {
				container.scrollTop(newPageOffset, 300);
			}, 700);
		});
	}

}
