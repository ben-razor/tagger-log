var loggedInUser = null;

var firebaseConfig = {
  apiKey: "AIzaSyBB82hE6xrDRnr7e_wnftgQwrbOWrbhgcs",
  authDomain: "diarystore.firebaseapp.com",
  projectId: "diarystore",
  storageBucket: "diarystore.appspot.com",
  messagingSenderId: "719415357807",
  appId: "1:719415357807:web:9d7542eb704b4bc430f89a"
};

firebase.initializeApp(firebaseConfig);

/**
 * Display an alert to reflect actions carried out on entries.
 * 
 * @param {string} id 
 */
function showAlert(id) {
  let alertText = $('#text-' + id).html();
  $alertElem = $("#entry-alert");
  $alertTextElem = $("#entry-alert-text");
  $alertTextElem.html(alertText);
  $alertElem.fadeTo(2000, 500).slideUp(500, function() {
    $alertElem.slideUp(500);
  });
}

var tagErrorConfig = {
  "tag-format-max-length": {
    "max-length": 20
  },
  "tag-format-min-length": {
    "min-length": 1
  },
  "tag-format-max-tags": {
    "max-tags": 5
  },
  "tag-format-valid-chars": {
    "valid-extra-chars": ["-", "_"]
  },
};

/**
 * Class for communicating an errors with user entered tags.
 * 
 * @param {string} tag 
 * @param {string} reason 
 */
function TagError(tag, reason) {
  this.tag = tag;
  this.reason = reason;
}

/**
 * Class for verifying an array of tags is valid based on a
 * JSON config.
 * 
 * @param {Object} tagErrorConfig 
 */
function TagVerifier(tagErrorConfig) {
  this.tagErrorConfig = tagErrorConfig;
  /**
   * Set of reason codes for errors.
   * @type {Set<string>}
   */
  this.errorCodes = new Set();
  /**
   * Array of tag error objects
   * @type {TagError[]}
   */
  this.errors = [];
  
  /**
   * Updates the errorCodes set and errors array.
   * 
   * @param {string} tag
   * @param {string} reason 
   */
  this.addError = function(tag, reason) {
    this.errors.push(new TagError(tag, reason));
    this.errorCodes.add(reason);
  }

  /**
   * Checks each tag against the error config to make sure they are valid.
   * 
   * @param {string[]} tags 
   */
  this.verifyTags = function(tags) {
    let maxTags = this.tagErrorConfig["tag-format-max-tags"]["max-tags"];

    if(tags.length > maxTags) {
      this.addError("", "tag-format-max-tags");
    }

    for(let tag of tags) {
      this.verifyTag(tag);
    }
  }

  /**
   * Checks a tag against the error config. Records any errors found using 
   * this.addError
   * 
   * @param {string} tag 
   */
  this.verifyTag = function(tag) {
    let tagMinLength = this.tagErrorConfig["tag-format-min-length"]["min-length"];
    let tagMaxLength = this.tagErrorConfig["tag-format-max-length"]["max-length"];
    let validExtraChars = this.tagErrorConfig["tag-format-valid-chars"]["valid-extra-chars"];

    if(tag.length < tagMinLength) {
      this.addError(tag, "tag-format-min-length");
    }
    if(tag.length > tagMaxLength) {
      this.addError(tag, "tag-format-max-length");
    }
    const regex = /^[a-z0-9-]+$/i;
    if(!regex.test(tag)) {
      this.addError(tag, "tag-format-valid-chars");
    }
  }
}

/**
 * Converts csv of tags to array of lower case tags.
 * Replaces spaces and underscores with dashes.
 * @param {string} A CSV string of tags.
 * @returns {string[]}
 */
function tagCSVToTags(tagStr) {
  let tagSet = new Set();

  let tagStrings = tagStr.split(",");

  for(var tagRaw of tagStrings) {
    let tagClean = tagRaw.trim().toLowerCase().replaceAll(/[ _]/g, '-');
    tagSet.add(tagClean);
  }

  let tags = Array.from(tagSet);

  return tags;
}

/**
 * Adds extra tags to the tag selector pre the form being submitted.
 * @param {Object} $form JQuery form element
 */
function createNewTag($form) {
  $tagSelect = $form.find('[name=tag-selector]');
  let selected = $tagSelect.val();

  $elem = $form.find('[name=new-tag]');
  let tagStr = $elem.val();
  let tags = tagCSVToTags(tagStr);

  let tagVerifier = new TagVerifier(tagErrorConfig);
  tagVerifier.verifyTags(tags);

  if(tagVerifier.errors.length == 0) {
    allTags = processTagList(allTags.concat(tags));
    refreshTagSelect();
    selected = selected.concat(tags);
    $tagSelect.val(selected);
    $tagSelect.selectpicker('refresh');
    $elem.val('');
  }
  else {
    console.log(tagVerifier.errors);
  }
}

/**
 * Adds an entry to the diary.
 * 
 * An entry has an optional header containing comma separated tags, starting with '--',
 * For example:
 *   -- dev, web, css
 * 
 * These are added into the database as a comma separated string of tags, this line
 * is stripped from the entry before adding the entry to the database.
 */
function diaryAddEntry(form) {
  var db = firebase.firestore();

  $spinner = $('#add-entry-spinner');
  $spinner.show();
  $button = $('#diary-submit');
  $button.prop('disabled', true);

  $form = $(form);
  createNewTag($form);
  const entry = $form.find('textarea[name=diary-entry]').val();
  const dateStr = $form.find('[name=diary-date]').val();
  const tagSelections = $form.find('[name=tag-selector').val();

  let tagVerifier = new TagVerifier(tagErrorConfig);
  tagVerifier.verifyTags(tagSelections);
  console.log(JSON.stringify(tagVerifier.errorCodes));
  console.log(JSON.stringify(tagVerifier.errors));

  let tags = [];
  if(tagSelections && tagSelections.length > 0) {
    tags = tagSelections;
  }

  let lines = entry.split("\n");
  let entryText = '';
  for(var line of lines) {
    if(line.startsWith("--")) {
      let lineClean = line.replace("--", "").trim();
      tags = tags.concat(tagCSVToTags(lineClean));
    }
    else {
      if(line.trim() != '') {
        entryText += line + "\n";
      }
    }
  }
  const tagString = tags.join();
  allTags = allTags.concat(tags);
  allTags = processTagList(allTags);

  let date = new Date();
  if(dateStr && dateStr !== "") {
    date = new Date(dateStr);
  }

  const entryData = {
    uid: loggedInUser.uid,
    entry: entryText,
    date: new Date(date),
    tags: tagString,
    "tag-list": tags
  }

  db.collection("diary-entry").add(entryData)
    .then(function(docRef) {

      saveTags().then(() => {
        getRecentEntries(loggedInUser);
      });
      $spinner.hide();
      $button.prop('disabled', false);
      showAlert('entry-added-alert');

      console.log("Document written with ID: ", docRef.id);
    })
    .catch(function(error) {
        console.error("Error adding document: ", error);
        $spinner.hide();
        $button.prop('disabled', false);
        showAlert('entry-add-failed-alert');
    });
}

function saveTags() {
  var db = firebase.firestore();
  return new Promise((resolve, reject) => {
    console.log('in  save tags promise');
    db.collection("diary-tags").doc(loggedInUser.uid).set({tags: allTags.join()})
    .then(function(docRef) {
      console.log("Tags written with ID: ", loggedInUser.uid);
      resolve();
    })
    .catch(function(error) {
      reject("Error adding tags: " + error.toString());
    });
  });
}

/**
 * Searches for any tags in the input array that are not
 * present on any entries in the database.
 *  
 * @param {string[]} tags 
 * @returns {Promise} Resolves to an array of orphaned tag strings
 */
function findOrphanTags(tags) {
  var db = firebase.firestore();
  let query = db.collection("diary-entry");
  query = query.where('uid', '==', loggedInUser.uid);
  let storedMatchingTags = [];
  let orphans = [];
  return new Promise((resolve, reject) => {
    if(tags.length > 0) {
      query = query.where('tag-list', 'array-contains-any', tags);
    }
    query.get()
    .then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        let data = doc.data();
        let tagList  = data['tag-list'];
        for(let tag of tagList) {
          if(!storedMatchingTags.includes(tag) && tags.includes(tag)) {
            storedMatchingTags.push(tag);
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
 * Gets recent entries from the database and formats them for display.
 * 
 * Also calls to refresh the tag list based on the selected query tags.
 */
function getRecentEntries() {
  console.log('getRecentEntries');
    var db = firebase.firestore();

    var tableTemplate = '<div class="diary-entries">{rows}</div>';
    var defaultEntry = `<div class="diary-entry">
      <div class="diary-entry-text">There are no entries to show for your active tags.</div>
    </div>
    `;
    var rowTemplate = `<div class="diary-entry">
      <div class="diary-entry-text">{entry}</div>
      <div>
        <div class="row">
          <div class="diary-entry-controls col-3">
            {controls}
          </div>
          <div class="diary-entry-tags col-9 text-truncate">{tags}</div>
        </div>
      </div>
    </div>`;
    let editLinkTemplate = `<a href="#" onclick="editEntryStart('{entry-id}'); return false;"><i class="fa fa-edit"></i></a>`;
    let deleteLinkTemplate = `<a href="#" onclick="deleteEntryStart('{entry-id}'); return false;"> <i class="fa fa-trash-alt"></i></a>`;
    var rows = '';
    let query = db.collection("diary-entry").orderBy("date", "desc");
    query = query.where('uid', '==', loggedInUser.uid);

    let tagQueryActive = false;
    if(queryTags.length > 0) {
      query = query.where('tag-list', 'array-contains-any', queryTags);
      tagQueryActive = true;
    }
    else {
      query = query.limit(10);
    }

    queryRelatedTags = [];

    query.get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          // doc.data() is never undefined for query doc snapshots
          let data = doc.data();
          console.log(data);
          let tags = data['tags'];
          let tagList = tags.split(',');

          let containsQueryTags = true;
          if(tagQueryActive) {
            if(!queryTags.every(r => tagList.indexOf(r) >= 0)) {
              containsQueryTags = false;
            }
          }

          if(containsQueryTags) {
            if(tagQueryActive) {
              queryRelatedTags = queryRelatedTags.concat(tags.split(','));
            }
            let row = rowTemplate.replace('{date}', data['date']);
            row = row.replace('{entry}', cleanEntry(data['entry'])); 

            let editStartLink = editLinkTemplate.replace('{entry-id}', doc.id);
            let deleteStartLink = deleteLinkTemplate.replace('{entry-id}', doc.id);
            let controls = editStartLink + deleteStartLink;
            row = row.replace('{controls}', controls);
            row = row.replace('{tags}', tags); 
            rows += row;
          }
        });

        if(tagQueryActive) {
          queryRelatedTags = processTagList(queryRelatedTags); 
        }
        refreshTagDisplay();

        if(rows == '') {
          rows = defaultEntry;          
        }

        let tableHTML = tableTemplate.replace('{rows}', rows)        
        let $recentEntriesElem = $('#recent-entries');
        $recentEntriesElem.html(tableHTML);
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });

    getTags();
}

/**
 * Converts HTML special characters to enties like &entity_name;
 * 
 * @param {string} text 
 */
function htmlEntities(text) {
  text = new Option(text).innerHTML;
  return text;
}

/**
 * Replaces HTML special characters and replaces \n with <br />
 * 
 * @param {string} entry 
 */
function cleanEntry(entry) {
  entry = htmlEntities(entry);
  entry = entry.replaceAll("\n", "<br />");
  return entry;
}

/**
 * Pops up a modal to edit an entry.
 * 
 * @param {string} id Entry ID
 */
function editEntryStart(id) {
  var db = firebase.firestore();
  db.collection('diary-entry').doc(id).get().then(function(doc) {
    let data = doc.data();
    const $form = $('#edit-entry-form');
    const $entry = $form.find('textarea[name=diary-entry]');
    const $date = $form.find('[name=diary-date]');
    $entry.val(data['entry'])
    const dateInfo = data['date'];
    const date = new Date(dateInfo['seconds'] * 1000);
    console.log(date);
    console.log(date.getTime());
    $date[0].valueAsNumber = date.getTime();
    $('#edit-entry-button').data('id', id);
    $('#editEntryModal').modal();
  })
  .catch(function(error) {
    console.log(error);
  });
}

/**
 * Updates an entry using information from the edit entry form.
 * 
 * @param {string} id Entry ID
 */
function editEntry(id) {
  var db = firebase.firestore();

  $spinner = $('#edit-entry-spinner');
  $spinner.show();
  const $form = $('#edit-entry-form');
  const $entry = $form.find('textarea[name=diary-entry]');
  const $date = $form.find('[name=diary-date]');

  db.collection('diary-entry').doc(id).update({
    'entry': $entry.val(),
    'date': new Date($date.val())
  })
  .then(function() {
    getRecentEntries(loggedInUser);
    $spinner.hide();
    $('#editEntryModal').modal('hide');
    showAlert('entry-edited-alert');
    
  }).catch(function(error) {
    logError(error);
    showAlert('entry-edit-failed-alert');
    $spinner.hide();
    $('#editEntryModal').modal('hide');
  });
}

/**
 * Pops up a modal to delete an entry.
 * 
 * @param {string} id Entry ID
 */
function deleteEntryStart(id) {
  console.log('Starting delete ' + id);
  var db = firebase.firestore();
  db.collection('diary-entry').doc(id).get().then(function(doc) {
    let data = doc.data();
    console.log(data);
  })
  .catch(function(error) {
    console.log(error);
  });

  $('#delete-entry-button').data('id', id);
  $('#deleteEntryModal').modal();
}

/**
 * Deletes an entry.
 * 
 * @param {string} id Entry ID
 */
function deleteEntry(id) {
  $spinner = $('#delete-entry-spinner');
  $spinner.show();
  let orphanTags = [];
  console.log('Deleting ' + id);
  var db = firebase.firestore();

  db.collection('diary-entry').doc(id).get().then(function(doc) {
    let data = doc.data();
    let tagList = data['tag-list'];
    console.log(data);

    db.collection('diary-entry').doc(id).delete().then(function() {
      $spinner.hide();
      $('#deleteEntryModal').modal('hide');
      showAlert('entry-deleted-alert');

      findOrphanTags(tagList).then(function(orphans) {
        console.log('Finding orphans');
        if(orphans.length) {
          allTags = allTags.filter(item => !orphans.includes(item));
          queryTags = queryTags.filter(item => !orphans.includes(item));
          saveTags().then(() => {
            console.log('Saving tags');
            getRecentEntries(loggedInUser);
          });
        }
        else {
          getRecentEntries(loggedInUser);
        }
        console.log('Entry deleted');
      });

    }).catch(function(error) {
      logError(error);
      showAlert('entry-delete-failed-alert');
      $spinner.hide();
      $('#deleteEntryModal').modal('hide');
    });
  })
  .catch(function(error) {
    console.log(error);
  });
}

/**
 * Helper function to wrap logging.
 * 
 * @param {string} error 
 */
function logError(error) {
  console.log(error);
}

/**
 * All the tags currently stored with entries. Sorted and unique.
 * @type {string[]}
 */
let allTags = [];
/**
 * The "active" tags which limit displayed entries and are auto 
 * attached to new entries. Sorted and unique.
 * @type {string[]}
 */
let queryTags = [];
/**
 * Tags that are used on any entry that the queryTags are also used
 * on, includes the queryTags themselves. Sorted and unique.
 * @type {string[]}
 */
let queryRelatedTags = [];

/**
 * Takes an array of tags, removes duplicates and sorts.
 * 
 * @param {string[]} tagList 
 */
function processTagList(tagList) {
  let tagSet = new Set(tagList);
  let tags = Array.from(tagSet).sort();
  return tags;
}

/**
 * Gets all tags from the database and updates the tag UI.
 */
function getTags() {
  var db = firebase.firestore();
  db.collection("diary-tags").doc(loggedInUser.uid)
  .get()
  .then(function(doc) {
      let data = doc.data();
      let tagString = data['tags'];
      allTags = processTagList(tagString.split(','));
      refreshTagDisplay();
      refreshTagSelect();
  });
}

/**
 * Makes a tag active/deactivated.
 * 
 * @param {string} tag 
 */
function toggleTag(tag) {
  let tagIndex = queryTags.indexOf(tag);
  if(tagIndex == -1) {
    queryTags.push(tag);
  }
  else {
    queryTags.splice(tagIndex, 1);
  }
  getRecentEntries(loggedInUser);
}

/**
 * Updates the displaying of tags based on currently active
 * query tags.
 */
function refreshTagDisplay() {
  var tagTemplate = '<span class="diary-tag {selected}" onclick="toggleTag(\'{tag}\')">{tag}</span>';
  var tagHTML = '';
  var replacedTemplate = '';
  let tags = allTags;
  if(queryRelatedTags.length) {
    tags = queryRelatedTags;
  }

  $tagSelect = $('#new-entry-tag-selector');
  if(queryTags.length) {
    $tagSelect.val(queryTags);
    $tagSelect.selectpicker('refresh');
  }
  else {
    $tagSelect.val('');
    $tagSelect.selectpicker('refresh');
  }

  for(tag of tags) {
    replacedTemplate = tagTemplate.replaceAll('{tag}', tag);
    if(queryTags.indexOf(tag) == -1) {
      replacedTemplate = replacedTemplate.replaceAll('{selected}', '');
    }
    else {
      replacedTemplate = replacedTemplate.replaceAll('{selected}', 'selected');
    }
    tagHTML += replacedTemplate;
  }
  $('#diary-tags').html(tagHTML);
}

/**
 * Updates the tag selector with all available tags.
 */
function refreshTagSelect() {
  var tagOptionTemplate = '<option data-tokens="{tag}">{tag}</option>';
  var tagOptionHTML = '';
  $tagSelect = $('#new-entry-tag-selector');
  let selected = $tagSelect.val();

  for(tag of allTags) {
    tagOptionHTML += tagOptionTemplate.replaceAll('{tag}', tag);
  }
  $tagSelect.html(tagOptionHTML);
  $tagSelect.selectpicker('refresh');
  $tagSelect.val(selected);
  $tagSelect.selectpicker('refresh');
}

/**
 * Management function to convert csv tags in diary-entry in the db
 * to array of tags in a field called tag-list.
 */
function tagsToArray() {
  var db = firebase.firestore();
  let collection = db.collection("diary-entry");

  collection.get()
  .then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      let data = doc.data();
      let docTags = data['tags'];
      let tagStrings = docTags.split(',');
      let tags = [];
      for(let tag of tagStrings) {
        let tagTrimmed = tag.trim();
        if(tagTrimmed) {
          tags.push(tagTrimmed);
        }
      }

      collection.doc(doc.id).update({'tag-list': tags})
      .then(function() {
        console.log('Tag list updated for doc ' + doc.id);
      })
      .catch(function(error) {
        logError(error);
      });
    });
  });
}

/**
 * Management function to regenerate tags on db from the tags
 * stored in each entry.
 */
function generateTags(user) {
  var db = firebase.firestore();
  logError('getting');

  db.collection("diary-entry")
  .where('uid', '==', user.uid)
  .get()
  .then(function(querySnapshot) {
    let tagSet = new Set();
    querySnapshot.forEach(function(doc) {
      let data = doc.data();
      let docTags = data['tags'];
      let tagStrings = docTags.split(',');
      for(let tag of tagStrings) {
        let tagTrimmed = tag.trim();
        if(tagTrimmed) {
          tagSet.add(tagTrimmed);
        }
      }
    });
    tags = Array.from(tagSet).sort();
    tagString = tags.join(',');
    console.log(tagString);

    tagData = {
      tags: tagString
    }

    db.collection("diary-tags").doc(user.uid).set(tagData)
    .then(function(docRef) {
        console.log("Tags written with ID: ", user.uid);
    })
    .catch(function(error) {
        console.error("Error adding tags: ", error);
    });
  });
}

/**
 * Loads the user interface for a logged in user.
 */
function updateLoggedInUI() {
  $('.loading-show').addClass('d-none');
  $('.loaded-show').removeClass('d-none');
  if(loggedInUser) {
    $('.logged-in-show').removeClass('d-none');
    $('.logged-out-show').addClass('d-none');
    $('#header-user-img').attr('src', loggedInUser.photoURL);
    $('#header-user-name').html(loggedInUser.displayName);
    $('#header-user-email').html(loggedInUser.email);
    $('#diary-controls').removeClass('d-none').addClass('d-flex');
    getRecentEntries(loggedInUser);
  }
  else {
    $('.logged-in-show').addClass('d-none');
    $('.logged-out-show').removeClass('d-none');
    $('#diary-controls').removeClass('d-flex').addClass('d-none');
  }
}

firebase.auth().onAuthStateChanged(function(user) {
  loggedInUser = user;

  if (user) {
    // User is signed in.
    updateLoggedInUI();
  } else {
    updateLoggedInUI();
  }
});

/**
 * Log out.
 */
function logOut() {
  firebase.auth().signOut();
}

/**
 * Start sign in procedure using firebase auth ui.
 */
function logIn() {
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then().catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    var email = error.email;
    var credential = error.credential;
    console.log(error);
  });
}

/**
 * For smaller displays, shows the new entry form and hides tags display.
 */
function toggleNewEntry() {
  $newEntry = $('#diary-new-entry-panel');
  $tags = $('#diary-tags-panel');
  $entries = $('#diary-entries-panel');

  if($newEntry.hasClass('collapse')) {
    $newEntry.removeClass('collapse');
    $entries.removeClass('collapse');
    $tags.addClass('collapse');
  }
  else {
    $newEntry.addClass('collapse');
    $entries.removeClass('collapse');
  }
  window.scrollTo(0, 0);
}

/**
 * For smaller displays, shows the tags display and hides entry form.
 */
function toggleTags() {
  $tags = $('#diary-tags-panel');
  $newEntry = $('#diary-new-entry-panel');
  $entries = $('#diary-entries-panel');

  if($tags.hasClass('collapse')) {
    $tags.removeClass('collapse');
    $newEntry.addClass('collapse');
  }
  else {
    $tags.addClass('collapse');
  }
  window.scrollTo(0, 0);
}
