// Initialize your app
var myApp = new Framework7({
	material: true,
	modalTitle: 'Table Tenis',
	pushState : true,// to enable back button on app
	init: false // prevent app from automatic initialization

});
// Export selectors engine
var $$ = Dom7;
// Add view
var mainView = myApp.addView('.view-main', {
	domCache: true //enable inline pages

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
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
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

$$(document).on('page:init', function(e) {
	var user = firebase.auth().currentUser;
	var name, email, photoUrl, uid, emailVerified;
	var page = e.detail.page;

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
		console.log(page.name + ' initialized');

		if (user != null) {

		opponentName=page.query.opponentName;
		name = user.displayName;

		loadAddGame();
		$$('.welcomeName').html('Hi' + ' ' + name);
		keyboardScrollFix(page);//fix toolbar floating over keyboard
		if(opponentName!=null){
			$$('#autocomplete-dropdown-all').val(opponentName);
		}

		}
		else{

		$$('.welcomeName').html('No account');
		loginRedirect();

		}
	}
	if (page.name === 'timeline') {
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
//
// window.addEventListener('load', function() {
// 	// authState('load');
// 	// playerContentIndex(3, 'rating');
// });
// myApp.onPageReinit(pageName, callback(page))
// myApp.onPageReinit('add-game', loadAddGame());

//Log Out function
$$('.log-out').on('click', function(e) {

	firebase.auth().signOut();
	// authState('index');
	mainView.router.loadPage({
		url: 'index.html', // - in case you use Ajax pages
  // 		pageName: 'index', // - in case you use Inline Pages or domCache
		ignoreCache:true
	});
	mainView.router.back({
		//   url: 'index.html', // - in case you use Ajax pages
		  pageName: 'index', // - in case you use Inline Pages or domCache
		  force: true,
		  ignoreCache:true
});
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
					// var uid = player_snap.child("uid").val();
					var playerName = player_snap.child("displayName").val();
					if ((playerName.toLowerCase().indexOf(query.toLowerCase()) >= 0) && playerName!=user.displayName)
						results.push(playerName);
					// console.log(displayName);
				});
				render(results)
			});

		}
	});

	$$('.form-to-data').on('click', formFunction);

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


		// return true;
	}

	$$('input[type="text"]').on('keyup keydown change', function (e) {
  		console.log('input value changed');
	});


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

		$$('input[type="text"]').on('keyup keydown change', function (e) {
	  		console.log('opponent_name :::' + opponent_name);
			console.log('user_score :::' + user_score);
			console.log('opponent_score :::' + opponent_score);
		});


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

		}else {
			console.log('val failed');
			mainView.router.back({
				//   url: 'index.html', // - in case you use Ajax pages
				  pageName: 'add-game', // - in case you use Inline Pages or domCache
				  force: true,
				  ignoreCache:true
		});
			// return
		}

	function findWinner() {

		console.log('12 This is the user_score at the point ' + user_score + 'This is the opponent_score ' + opponent_score);
		if (user_score > opponent_score) {
			console.log('13 This is the user_score at the point ' + user_score + 'This is the opponent_score ' + opponent_score);

			winner_score = user_score;
			winner_uid = user_uid;
			winner_name = user_name;

			loser_score = opponent_score;
			loser_uid = opponent_uid;
			loser_name = opponent_name;
			console.log();
			('User Won with :' + winner_score + ' Opponent lost with:' + loser_score);

		} else {
			console.log('14 This is the user_score at the point ' + user_score + 'This is the opponent_score ' + opponent_score);
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
		calculateRating();
		updateMatches(user_uid);
		updateMatches(opponent_uid);

		alert("Game Added!");
		mainView.router.loadPage('#timeline');

	} //End of push Game function

	function calculateRating() {

		//Evaluate winner rating and loser rating
		database.ref('/PlayerProfile/' + user_uid).once('value').then(function(snapshot) {

			var user_rating = snapshot.val().rating;

			console.log('1 This is the user_score at the point ' + user_score + 'This is the opponent_score ' + opponent_score);

			if (user_score > opponent_score) {
				console.log(' 2 This is the user_score at the point ' + user_score + 'This is the opponent_score ' + opponent_score);

				console.log('Winner is ' + user_name + ' with as score of ' + user_score);

				winner_rating = user_rating;
				loser_rating = opponent_rating;
				// myApp.alert('user_rating:' + winner_rating + 'opponent_rating:' + loser_rating);

			} else {
				console.log(' 3 This is the user_score at the point ' + user_score + 'This is the opponent_score ' + opponent_score);
				console.log('Winner is ' + opponent_name + 'with as score of ' + opponent_score);

				winner_rating = opponent_rating;
				loser_rating = user_rating

				// myApp.alert('user_rating:' + loser_rating + 'opponent_rating:' + winner_rating);
			}

			points = (winner_score - loser_score);

			console.log('points ' + points);

			var diffInRatings = (winner_rating - loser_rating);

			console.log('diffInRating :' + diffInRatings);

			var changeInRating = ((0.000128 * (diffInRatings * diffInRatings)) - (0.064 * diffInRatings) + 8);

			console.log('changeInRating :' + changeInRating);

			if (winner_rating != loser_rating) {
				pointsAwarded = (points / 10);
				console.log(' Points Awarded  ' + pointsAwarded);

				totalPoints=Math.round10(pointsAwarded+changeInRating,-2);

				new_winner_rating = (winner_rating + changeInRating + pointsAwarded);
				console.log('old winner rating  ' + winner_rating + ' updated winner rating ' + new_winner_rating);

				new_loser_rating = (loser_rating - changeInRating);
				console.log('old loser rating  ' + loser_rating + 'updated loser rating ' + new_loser_rating);

				myApp.alert('New Rating : '+ Math.round10(new_winner_rating,-2), 'Game Stats');
				// myApp.alert('Your New Rating is :' + new_winner_rating);

			} else if (winner_rating == loser_rating) {
				pointsAwarded = (points / 10);
				console.log(' 2 pointsAwarded  ' + pointsAwarded);

				totalPoints=Math.round10(pointsAwarded,-2);

				new_winner_rating = (winner_rating + pointsAwarded);
				new_loser_rating = (loser_rating - pointsAwarded);
				myApp.alert(new_winner_rating + ': Same Rating Players ' + new_loser_rating);

			} else {
				myApp.alert('Something is wrong')
			}

			var Games = database.ref('Games/');
			var Game = Games.child('Game');
			var Stats = Games.child('Stats');
			var time_stamp =firebase.database.ServerValue.TIMESTAMP;

			Game.push().set({

				added_by:user_uid,
				user_score:user_score,
				user_name:user_name,
				opponent_uid:opponent_uid,
				opponent_name:opponent_name,
				opponent_score:opponent_score,
				status:'pending',
				date:time_stamp
			}, function(error) {
			  if (error)
			    console.log('Error has occured during saving process')
			  else
			    console.log("Data has been saved succesfully")

				var updates = {};

				updates['PlayerProfile/' + winner_uid + '/rating'] = Math.round10(new_winner_rating,-2);
				updates['PlayerProfile/' + loser_uid + '/rating'] = Math.round10(new_loser_rating,-2);

				return database.ref().update(updates);

			})

			Stats.push({

					date:time_stamp,
					winner_score: winner_score,
					winner_uid: winner_uid,
					winner_name: winner_name,
					new_winner_rating: new_winner_rating,
					loser_score: loser_score,
					loser_uid: loser_uid,
					loser_name: loser_name

			});

		});
	}

	function updateMatches(uid) {

	matches_ref = database.ref('/PlayerProfile/' + uid).once('value').then(function(snapshot) {
		var current_matches = snapshot.val().matches;

		updated_matches = current_matches + 1;

		var updates = {};
		updates['PlayerProfile/' + uid + '/matches'] = updated_matches;
		// updates['PlayerProfile/' + uid2 + '/matches'] = new_matches;
		return database.ref().update(updates);
		});
	}

	};//==========End of on-form-click====/

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
	$$('.player-list-index').find('ul').html('');
	var player_ref = database.ref('PlayerProfile/').limitToLast(list_no);
	player_ref.orderByChild(sort).once("value", function(snapshot) {
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
	var welcomeHTML=	'<div class="center card-header bg-green color-white">'+
						'<div class="left"></div>'+
						'<div class="center card-content ratingHome " style="font-size: 21px; font-weight: 100;"></div>'+
						'<div class="right"></div>'+
						'</div>';
		// Prepend new list element
		if (status=='show') {

			$$('.welcomeCard').html(welcomeHTML);
			// $$('.navTitle').html()

		}

		else if (status=='hide') {

			welcomeHTML ='';
			$$('.welcomeCard').html(welcomeHTML);
			$$('.navTitle').html('Table Tennis')
		}

	}
	displayRatingHome = function(uid,page) {
	var player_ref_uid = database.ref('PlayerProfile/'+uid);
	player_ref_uid.on("value", function(snapshot) {

	var	rating = snapshot.val().rating;
	var	matches = snapshot.val().matches;
	var displayName=snapshot.val().displayName;

		$$('.navTitle').html(displayName);
		$$('.ratingHome').html('|'+matches+'|'+' '+rating);

});
}

function createNewProfile(uid,displayName) {
	var player_ref = database.ref('PlayerProfile/');
	player_ref.once('value', function(snapshot) {

	if (snapshot.hasChild(uid)) {

		console.log('Profile Exists');

	}
	else {
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
		mainView.router.back({
				//   url: 'index.html', // - in case you use Ajax pages
				  pageName: 'index', // - in case you use Inline Pages or domCache
				  force: true,
				  ignoreCache:true
		});
        //   mainView.router.loadPage('#index');
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
	});
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
