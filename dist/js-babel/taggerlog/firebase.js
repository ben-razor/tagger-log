'use strict';
/** @suppress {duplicate} */

var taggerlog = taggerlog || {};

(function (tl) {
  tl.loggedInUser = null;
  var firebaseConfig = {
    apiKey: "AIzaSyBB82hE6xrDRnr7e_wnftgQwrbOWrbhgcs",
    authDomain: "diarystore.firebaseapp.com",
    projectId: "diarystore",
    storageBucket: "diarystore.appspot.com",
    messagingSenderId: "719415357807",
    appId: "1:719415357807:web:9d7542eb704b4bc430f89a"
  };
  var isNewUser = false;

  function initNewUser(user) {
    var gettingStartedEntries = [{
      "text": 'This is an entry with some tags. You can click on it to edit or delete it.',
      "tags": ['getting-started', 'entries']
    }, {
      "text": "The tags panel has the tags from all your entries. " + "Clicking them makes them active.",
      "tags": ['getting-started', 'tags']
    }, {
      "text": "Only entries matching active tags are displayed.\n\n" + "Active tags are automatically added to new entries.\n\n",
      "tags": ['getting-started', 'tags', 'entries']
    }, {
      "text": "This is demo application. Any entries will be lost!",
      "tags": ['warning', 'this-is-a-demo']
    }];
    var allTags = [];
    var numEntries = gettingStartedEntries.length;

    for (var i = 0; i < numEntries; i++) {
      var entry = gettingStartedEntries[i];
      var text = entry["text"];
      var tags = entry["tags"];
      var entryData = {
        uid: user.uid,
        entry: text,
        date: new Date(Date.now() + (numEntries - i) * 100),
        "tag-list": tags
      };
      tl.db.collection('diary-entry').add(entryData);
      allTags = allTags.concat(tags);
    }

    allTags = tl.processTagList(allTags);
    tl.db.collection("diary-tags").doc(user.uid).set({
      tags: allTags.join()
    });
  }

  $(function () {
    firebase.initializeApp(firebaseConfig);
    tl.db = firebase.firestore();

    if (location.hostname === "localhost") {
      tl.db.useEmulator("localhost", 8080);
      firebase.auth().useEmulator('http://localhost:9099/');
    }

    firebase.auth().onAuthStateChanged(function (user) {
      tl.loggedInUser = user;

      if (isNewUser) {
        initNewUser(user);
        tl.updateLoggedInUI();
        isNewUser = false;
      } else {
        tl.updateLoggedInUI();
      }
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
    firebase.auth().signInWithPopup(provider).then(function (result) {
      if (result.additionalUserInfo.isNewUser) {
        isNewUser = true;
      }
    })["catch"](function (error) {
      tl.util.logError(error);
    });
  }

  tl.logIn = logIn;
})(taggerlog);