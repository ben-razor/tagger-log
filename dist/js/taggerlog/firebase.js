'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {
  tl.loggedInUser = null;

  var firebaseConfig = {
    apiKey: 'AIzaSyBB82hE6xrDRnr7e_wnftgQwrbOWrbhgcs',
    authDomain: 'diarystore.firebaseapp.com',
    projectId: 'diarystore',
    storageBucket: 'diarystore.appspot.com',
    messagingSenderId: '719415357807',
    appId: '1:719415357807:web:9d7542eb704b4bc430f89a'
  };

  var isNewUser = false;

  function initNewUser(user) {
    var gettingStartedEntries = [
        {
            'text': 'This is an entry with some tags. Tap it to edit or delete.',
            'tags': ['getting-started', 'entries']
        },
        {
            'text': 'The tags panel has the tags from all your entries. ' +
                'Clicking a tag makes it green and ACTIVE.',
            'tags': ['getting-started', 'tags']
        },
        {
            'text': 'Only entries matching active tags are displayed.\n\n'  +
                'Active tags are automatically added to new entries.',
            'tags': ['getting-started', 'tags', 'entries']
        },
        {
            'text': 'Holding a tag turns it red, making it EXCLUDED.\n\n' +
                    'Entries tagged with excluded tags are not displayed.',
            'tags': ['getting-started', 'tags', 'entries']
        },
        {
            'text': 'This is demo application. Any entries will be lost!',
            'tags': ['warning', 'this-is-a-demo'] 
        },
    ];

    return new Promise(function(resolve) {
      var allTags = [];
      var numEntries = gettingStartedEntries.length;
      var batch = tl.db.batch();
      for(var i = 0; i < numEntries; i++) {
          var entry = gettingStartedEntries[i];
          var text = entry['text'];
          var tags = entry['tags'];
          const entryData = {
              uid: user.uid,
              entry: text,
              date: new Date(Date.now() + (numEntries - i) * 100),
              'tag-list': tags,
              'date-modified': firebase.firestore.FieldValue.serverTimestamp()
          };
          var docRef = tl.db.collection('diary-entry').doc();
          batch.set(docRef, entryData);
          allTags = allTags.concat(tags);
      }
      batch.commit().then(function() {
        allTags = tl.processTagList(allTags);
        tl.db.collection('diary-tags').doc(user.uid).set({tags: allTags.join()}).then(function() {
          resolve();
        })
      }) 
    });
  }

  
  function TLInterfaceFirebase(tl) {
    let that = this;

    /**
     * Initialize firebase and set tl.db to point at firestore.
     */
    this.init = function() {
      firebase.initializeApp(firebaseConfig);

      tl.db = firebase.firestore();
      if (location.hostname === 'localhost') {
        tl.db.useEmulator('localhost', 8080);
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

      let timerID = setTimeout(function() {
        tl.init();
      }, 2000);

      firebase.auth().onAuthStateChanged(function(user) {
        tl.loggedInUser = user;
        clearTimeout(timerID);

        if(isNewUser) {
          initNewUser(user).then(function() {
            tl.init();
          });
          isNewUser = false;
        }
        else {
          tl.init();
        }
      });
    }

    /**
     * Start sign in procedure using firebase auth ui.
     */
    this.logIn = function() {
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

    /**
     * Log out.
     */
    this.logOut = function() {
      firebase.auth().signOut();
    }

    /**
     * Delete and entry from firestore.
     * 
     * Uses findOrphanTags to find any tags that are no longer in use
     * and remove them.
     * 
     * @param {string} id 
     */
    this.deleteEntry = function(id) {
      var db = tl.db;

      db.collection('diary-entry').doc(id).get().then(function(doc) {
        let data = doc.data();
        let tagList = data['tag-list'];

        db.collection('diary-entry').doc(id)
        .update({ 
          'deleted': true,
          'date-modified': firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
        
          that.findOrphanTags(tagList).then(function(orphans) {
            if(orphans.length) {
              tl.allTags = tl.allTags.filter(item => !orphans.includes(item));
              tl.queryTags = tl.queryTags.filter(item => !orphans.includes(item));
              that.saveTags();
            }
          });

        }).catch(function(error) {
          tl.util.logError(error);
          tl.showAlert('entry-delete-failed-alert');
        });
      })
      .catch(function(error) {
        tl.util.logError(error);
      });
    }

    /**
     * Adds an entry to firestore.
     * 
     * Updates the diary-tags to contain any new tags.
     * 
     * @param {object} entryData 
     */
    this.addEntry = function(entryDataJSON) {
      let entryData = JSON.parse(entryDataJSON);
      let db = tl.db;

      entryData['date-modified'] = this.getCurrentTimestamp();
      entryData['date'] = new Date(entryData['date']);
      let batch = db.batch();
      let newEntryRef = db.collection('diary-entry').doc();
      let tagsRef = db.collection('diary-tags').doc(tl.loggedInUser.uid);
      batch.set(newEntryRef, entryData);
      batch.set(tagsRef, {tags: tl.allTags.join()})
      batch.commit().catch(function(error) {
        tl.entryFailedUpdateUI(error);
      });

      return newEntryRef.id;
    }

    /**
     * Edit an entry in the firestore.
     * 
     * @param {string} id 
     * @param {object} currentEntry 
     * @param {object} newEntry 
     */
    this.editEntry = function(id, currentEntry, newEntry) {
      let db = tl.db;

      let tagsRemoved = currentEntry['tag-list'].filter(x => !newEntry['tag-list'].includes(x));

      newEntry['date-modified'] = firebase.firestore.FieldValue.serverTimestamp();

      db.collection('diary-entry').doc(id).update(newEntry)
      .then(function() {
          that.findOrphanTags(tagsRemoved).then(function(orphans) {
          if(orphans.length) {
            tl.allTags = tl.allTags.filter(item => !orphans.includes(item));
            tl.queryTags = tl.queryTags.filter(item => !orphans.includes(item));
            that.getRecentEntries();
          }
          that.saveTags();
        });
        tl.updateQueryRelatedTags();
        tl.refreshEntryDisplay();
       
      }).catch(function(error) {
        tl.util.logError(error);
        tl.showAlert('entry-edit-failed-alert');
      });
    }

    /**
     * Save all tags to firestore.
     * 
     * @returns {Promise}
     */
    this.saveTags = function() {
      var loggedInUser = tl.loggedInUser;
      var db = tl.db;

      db.collection('diary-tags').doc(loggedInUser.uid).set({tags: tl.allTags.join()})
      .then(function(docRef) {
        tl.saveTagsRefresh();
      })
      .catch(function(error) {
        tl.util.logError(error);
      });
    }

    /**
     * Searches for any tags in the input array that are not
     * present on any entries in the database.
     *  
     * @param {string[]} tags 
     * @returns {Promise} Resolves to an array of orphaned tag strings
     */
    this.findOrphanTags = function(tags) {
      var db = tl.db;

      let storedMatchingTags = [];
      let orphans = [];

      let query = db.collection('diary-entry');
      query = query.where('uid', '==', tl.loggedInUser.uid);

      return new Promise((resolve, reject) => {
        if(tags.length > 0) {
          query = query.where('tag-list', 'array-contains-any', tags);
        }
        query.get({source: 'cache'})
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            let data = doc.data();
            if(!data['deleted']) {
              let tagList  = data['tag-list'];
              for(let tag of tagList) {
                if(!storedMatchingTags.includes(tag) && tags.includes(tag)) {
                  storedMatchingTags.push(tag);
                }
              }
            }
          })
        
          for(let tag of tags) {
            if(!storedMatchingTags.includes(tag)) {
              orphans.push(tag);
            }
          }
          resolve(orphans);
        })
        .catch(function(error) {
          reject(error);
        });
      });
    }

    /**
     * Gets entries from firestore.
     * 
     * Tries the cache first, then server for any more recently modified 
     * records.
     */
    this.getEntries = function() {
      var db = tl.db;
      var loggedInUser = tl.loggedInUser;

      let query = db.collection('diary-entry').orderBy('date', 'desc');
      query = query.where('uid', '==', loggedInUser.uid);

      if(tl.queryTags.length > 0) {
        query = query.where('tag-list', 'array-contains-any', tl.queryTags);
      }
      else {
        query = query.limit(10);
      }

      tl.entries = [];
      tl.queryRelatedTags = [];

      query.get({source: 'cache'})
      .then(function(querySnapshot) {
        var mostRecentModify = new Date(1955, 10, 21, 6, 15, 0);
        querySnapshot.forEach(function(doc) {
          let data = doc.data();
          data['id'] = doc.id;
          data['date'] = data['date'].toDate();
          data['date-modified'] = data['date-modified'].toDate();

          tl.insertEntry(data);

          if(data['date-modified'].getTime() > mostRecentModify.getTime()) {
            mostRecentModify = data['date-modified'];
          }
        });

        tl.updateQueryRelatedTags();
        tl.refreshUI();

        query = db.collection('diary-entry').orderBy('date-modified', 'desc');
        query = query.where('uid', '==', loggedInUser.uid);
        if(tl.entries.length) {
          query = query.where('date-modified', '>', mostRecentModify);
        }

        query.get({source: 'server'}).then(function(querySnapshot) {
          if(querySnapshot.size) {
            querySnapshot.forEach(function(doc) {
              let data = doc.data();
              data['id'] = doc.id;
              data['date'] = data['date'].toDate();
              data['date-modified'] = data['date-modified'].toDate();

              tl.insertEntry(data);
            });

            tl.updateQueryRelatedTags();
            tl.refreshUI();
          }
          
          tl.refreshUI();
        });
      })
      .catch(function(error) {
        tl.util.logObject(error);
      });
    }

    /**
     * Gets all tags from the database.
     */
    this.getTags = function() {
      var db = tl.db;

      db.collection('diary-tags').doc(tl.loggedInUser.uid)
      .get()
      .then(function(doc) {
          let data = doc.data();
          let tagString = data['tags'];
          tl.setAllTags(tagString);

          db.collection('diary-tag-combos').doc(tl.loggedInUser.uid)
          .get()
          .then(function(doc) {
            let data = doc.data();
            if(data) {
              tl.setTagCombos(data['tag-combos'])
            }
          });
      });
    }

    /**
     * Save the array of favourite tag combinations to the db.
     */
    this.saveTagCombos = function() {
      var loggedInUser = tl.loggedInUser;
      var db = tl.db;
      db.collection('diary-tag-combos').doc(loggedInUser.uid).set({'tag-combos': tl.tagCombos})
      .catch(function(error) {
        tl.util.logObject(error);
      });
    }

    /**
     * Function that could be modified to get realtime updates.
     */
    function listenForChanges() {
      tl.db.collection('diary-entry')
      .where('uid', '==', tl.loggedInUser.uid)
      .onSnapshot(function(snapshot) {
        snapshot.docChanges().forEach(function(change) {
          if (change.type === 'added') {
              console.log('New: ', change.doc.data());
          }
          if (change.type === 'modified') {
              console.log('Mod: ', change.doc.data());
          }
          if (change.type === 'removed') {
              console.log('Remove: ', change.doc.data());
          }
        })
      });
    }

    /**
     * Get the special serverTimestamp field for marking updated
     * and deleted records.
     * 
     * @returns {object} firebase.firestore.Timestamp
     */
    this.getCurrentTimestamp = function() {
      return firebase.firestore.FieldValue.serverTimestamp();
    }
  }

  if(window['AndroidInterface']) {
    tl.setDataStore(window['AndroidInterface']);
  }
  else {
    tl.setDataStore(new TLInterfaceFirebase(tl));
  }

})(taggerlog);
