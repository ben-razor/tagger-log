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

  var isNewUser = false;

  function initNewUser(user) {
    var gettingStartedEntries = [
        {
            "text": 'This is an entry with some tags. Tap it to edit or delete.',
            "tags": ['getting-started', 'entries']
        },
        {
            "text": "The tags panel has the tags from all your entries. " +
                "Clicking a tag makes it green and ACTIVE.",
            "tags": ['getting-started', 'tags']
        },
        {
            "text": "Only entries matching active tags are displayed.\n\n"  +
                "Active tags are automatically added to new entries.",
            "tags": ['getting-started', 'tags', 'entries']
        },
        {
            "text": "Holding a tag turns it red, making it EXCLUDED.\n\n" +
                    "Entries tagged with excluded tags are not displayed.",
            "tags": ['getting-started', 'tags', 'entries']
        },
        {
            "text": "This is demo application. Any entries will be lost!",
            "tags": ['warning', 'this-is-a-demo'] 
        },
    ];

    return new Promise(function(resolve) {
      var allTags = [];
      var numEntries = gettingStartedEntries.length;
      var batch = tl.db.batch();
      for(var i = 0; i < numEntries; i++) {
          var entry = gettingStartedEntries[i];
          var text = entry["text"];
          var tags = entry["tags"];
          const entryData = {
              uid: user.uid,
              entry: text,
              date: new Date(Date.now() + (numEntries - i) * 100),
              "tag-list": tags,
              'date-modified': firebase.firestore.FieldValue.serverTimestamp()
          };
          var docRef = tl.db.collection('diary-entry').doc();
          batch.set(docRef, entryData);
          allTags = allTags.concat(tags);
      }
      batch.commit().then(function() {
        allTags = tl.processTagList(allTags);
        tl.db.collection("diary-tags").doc(user.uid).set({tags: allTags.join()}).then(function() {
          resolve();
        })
      }) 
    });
  }

  $(function() {
    firebase.initializeApp(firebaseConfig);

    tl.db = firebase.firestore();
    if (location.hostname === "localhost") {
      tl.db.useEmulator("localhost", 8080);
      firebase.auth().useEmulator('http://localhost:9099/');
    }
    firebase.firestore().enablePersistence()
    .catch(function(err) {
      if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a a time.
          // ...
      } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          // ...
      }
      tl.util.logError(err.message);   
    });


    firebase.auth().onAuthStateChanged(function(user) {
      tl.loggedInUser = user;
      if(isNewUser) {
        initNewUser(user).then(function() {
          tl.init();
          tl.updateLoggedInUI();
        });
        isNewUser = false;
      }
      else {
        tl.init();
        tl.updateLoggedInUI();
      }
    });

    setTimeout(function() {
      tl.init();
      tl.updateLoggedInUI();
    }, 2000);
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
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    firebase.auth().signInWithPopup(provider).then(function(result) {
      if(result.additionalUserInfo.isNewUser) {
        isNewUser = true;
      }
    }).catch(function(error) {
      tl.util.logError(error);
    });
  }
  tl.logIn = logIn;

})(taggerlog);
