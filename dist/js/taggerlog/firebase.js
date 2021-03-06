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

    return new Promise(function(resolve) {
      var allTags = [];
      var numEntries = tl.gettingStartedEntries.length;
      var batch = tl.db.batch();
      for(var i = 0; i < numEntries; i++) {
          var entry = tl.gettingStartedEntries[i];
          var text = entry['text'];
          var tags = entry['tags'];
          const entryData = {
              uid: user.uid,
              entry: text,
              date: new Date(Date.now() + (numEntries - i) * 100),
              'tag-list': tags,
              'date-modified': firebase.firestore.FieldValue.serverTimestamp(),
              deleted: false
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

  tl.TLInterfaceFirebase = function(tl) {
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
      }, 5000);

      firebase.auth().onAuthStateChanged(function(user) {
        tl.loggedInUser = user;
        clearTimeout(timerID);

        if(isNewUser) {
          tl.init(isNewUser);
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
              tl.queryRelatedTags = tl.queryRelatedTags.filter(item => !orphans.includes(item));
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
        tl.entryFailedUpdateUI([error]);
      });

      return newEntryRef.id;
    }

    /**
     * Converts a JSON version of an entry to a javascript object.
     * 
     * @param {string} entryJSON 
     */
    this.entryFromJSON = function(entryJSON) {
      let entry = JSON.parse(entryJSON);
      entry['date'] = new Date(entry['date']);
      if(entry['date-modified']) {
        entry['date-modified'] = new Date(entry['date-modified']);
      }
      return entry;
    }

    /**
     * Edit an entry in the firestore.
     * 
     * @param {string} id 
     * @param {object} currentEntryJSON 
     * @param {object} newEntryJSON
     */
    this.editEntry = function(id, currentEntryJSON, newEntryJSON) {
      let db = tl.db;
      let currentEntry = this.entryFromJSON(currentEntryJSON);
      let newEntry = this.entryFromJSON(newEntryJSON);

      let tagsRemoved = currentEntry['tag-list'].filter(x => !newEntry['tag-list'].includes(x));

      newEntry['date-modified'] = firebase.firestore.FieldValue.serverTimestamp();

      db.collection('diary-entry').doc(id).update(newEntry)
      .then(function() {
          that.findOrphanTags(tagsRemoved).then(function(orphans) {
          if(orphans.length) {
            tl.allTags = tl.allTags.filter(item => !orphans.includes(item));
            tl.queryTags = tl.queryTags.filter(item => !orphans.includes(item));
            tl.queryRelatedTags = tl.queryRelatedTags.filter(item => !orphans.includes(item));
            that.getEntries();
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
        that.getEntries();
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
      let orphans = [];

      return new Promise((resolve, reject) => {
        if(tags.length) {
          let storedTagSet = new Set();
          let query = db.collection('diary-entry');
          query = query.where('uid', '==', tl.loggedInUser.uid);
          query = query.where('tag-list', 'array-contains-any', tags);

          query.get({source: 'cache'}).then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
              let data = doc.data();
              if(!data['deleted']) {
                for(let tag of data['tag-list']) {
                  storedTagSet.add(tag);
                }
              }
            })
            orphans = tags.filter(tag => !storedTagSet.has(tag));
            resolve(orphans);
          })
          .catch(function(error) {
            reject(error);
          });
        }
        else {
          resolve(orphans);
        }
      });
    }

    /**
     * Gets entries from firestore.
     * 
     * Tries the cache first, then server for any more recently modified 
     * records.
     * 
     * @param {boolean=} doReload Get all from server, no cache.
     */
    this.getEntries = function(doReload) {
      var db = tl.db;
      var loggedInUser = tl.loggedInUser;

      if(doReload) {
        this.getEntriesFromServer(null, tl.queryTags);
      }
      else {
        let query = db.collection('diary-entry').orderBy('date', 'desc');
        query = query.where('uid', '==', loggedInUser.uid);
        query = query.where('deleted', '==', false);

        if(tl.queryTags.length > 0) {
          query = query.where('tag-list', 'array-contains-any', tl.queryTags);
        }
        else {
          query = query.limit(10);
        }

        query.get({source: 'cache'})
        .then(function(querySnapshot) {
          var mostRecentModify = null;

          querySnapshot.forEach(function(doc) {
            let data = doc.data();
            data['id'] = doc.id;
            data['date'] = data['date'].toDate();
            
            // Records can be returned with date-modified set to null 
            // if serverTimestamp has not yet been calculated
            if(data['date-modified']) {
              data['date-modified'] = data['date-modified'].toDate();

              tl.insertEntry(data);

              if(!mostRecentModify || data['date-modified'].getTime() > mostRecentModify.getTime()) {
                mostRecentModify = data['date-modified'];
              }
            }
          });

          tl.updateQueryRelatedTags();
          tl.refreshUI();

          that.getEntriesFromServer(mostRecentModify, tl.queryTags);

        })
        .catch(function(error) {
          tl.util.logObject(error);
        });
      }
    }

    /**
     * Refresh all entries from firestore. Optionally starting from a specified
     * modification date.
     * 
     * @param {Date=} startDateTime Get records modified after this date/time.
     * @param {string[]=} queryTags Get records with these tags
     */
    this.getEntriesFromServer = function(startDateTime, queryTags) {
      var db = tl.db;
      var loggedInUser = tl.loggedInUser;
      
      let query = db.collection('diary-entry').orderBy('date-modified', 'desc');
      query = query.where('uid', '==', loggedInUser.uid);
      if(startDateTime) {
        query = query.where('date-modified', '>', startDateTime);
      }

      if(queryTags && queryTags.length > 0) {
        query = query.where('tag-list', 'array-contains-any', queryTags);
      }
      else {
        query = query.limit(10);
      }

      query.get({source: 'server'}).then(function(querySnapshot) {
        if(querySnapshot.size) {
          querySnapshot.forEach(function(doc) {
            let data = doc.data();
            data['id'] = doc.id;
            data['date'] = data['date'].toDate();

            // Records can be returned with date-modified set to null 
            // if serverTimestamp has not yet been calculated
            if(data['date-modified']) {
              data['date-modified'] = data['date-modified'].toDate();
              tl.insertEntry(data);
            }
          });

          tl.updateQueryRelatedTags();
          tl.refreshUI();
        }

        tl.refreshUI();
      });
    }

    /**
     * Calls runTagQuery to get tags and combos from cache first
     * and then get from server.
     */
    this.getTags = function() {
      this.runTagQuery('cache');
      this.runTagQuery('server');
    }

    /**
     * Runs query to get tags and tag combos from cache
     * or server.
     * 
     * @param {string} source cache|server
     */
    this.runTagQuery = function(source) {
      var db = tl.db;

      db.collection('diary-tags').doc(tl.loggedInUser.uid)
      .get({'source': source})
      .then(function(doc) {
          let data = doc.data();
          let tagString = data['tags'];
          tl.setAllTags(tagString);

          db.collection('diary-tag-combos').doc(tl.loggedInUser.uid)
          .get({'source': source})
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
})(taggerlog);
