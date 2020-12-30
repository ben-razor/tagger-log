'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {
  tl.loggedInUser = null;

  var firebaseConfig = {
    apiKey: "AIzaSyBB82hE6xrDRnr7e_wnftgQwrbOWrbhgcs",
    authDomain: "diarystore.firebaseapp.com",
    projectId: "diarystore",
    storageBucket: "diarystore.appspot.com",
    messagingSenderId: "719415357807",
    appId: "1:719415357807:web:9d7542eb704b4bc430f89a"
  };

  $(function() {
    firebase.initializeApp(firebaseConfig);

    tl.db = firebase.firestore();
    if (location.hostname === "localhost") {
      tl.db.useEmulator("localhost", 8080);
      firebase.auth().useEmulator('http://localhost:9099/');
    }
    
    firebase.auth().onAuthStateChanged(function(user) {
      tl.loggedInUser = user;
      tl.updateLoggedInUI();
    });

  });

  /**
   * Log out.
   */
  function logOut() {
    firebase.auth().signOut();
  }
  tl.logOut = logOut;

  /**
   * Start sign in procedure using firebase auth ui.
   */
  function logIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).then().catch(function(error) {
      console.log(error);
    });
  }
  tl.logIn = logIn;

})(taggerlog);
