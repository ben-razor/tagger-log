'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {
  /**
   * The entry data for the currently active tags.
   * @type {object[]}
   */
  tl.entries = [];
  /**
   * All the tags currently stored with entries. Sorted and unique.
   * @type {string[]}
   */
  tl.allTags = [];
  /**
   * The "active" tags which limit displayed entries and are auto 
   * attached to new entries. Sorted and unique.
   * @type {string[]}
   */
  var queryTags = [];
  /**
   * Tags that are used on any entry that the queryTags are also used
   * on, includes the queryTags themselves. Sorted and unique.
   * @type {string[]}
   */
  var queryRelatedTags = [];


  /**
   * Display an alert to reflect actions carried out on entries.
   * 
   * @param {string} id 
   */
  function showAlert(id) {
    var alertText = $('#text-' + id).html();
    var $alertElem = $("#entry-alert");
    var $alertTextElem = $("#entry-alert-text");
    $alertTextElem.html(alertText);
    $alertElem.fadeTo(2000, 1000).slideUp(500, function() {
      $alertElem.slideUp(500);
    });
  }
  tl.showAlert = showAlert;

  /**
   * Adds extra tags to the tag selector pre the form being submitted.
   * @param {Object} $form JQuery form element
   */
  function createNewTag($form) {
    var $tagSelect = $form.find('[name=tag-selector]');
    let selected = $tagSelect.val();

    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr);

    let tagVerifier = new tl.TagVerifier(tl.tagErrorConfig);
    tagVerifier.verifyTags(tags);

    if(tagVerifier.errors.length == 0) {
      tl.allTags = processTagList(tl.allTags.concat(tags));
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
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;

    var $spinner = $('#add-entry-spinner');
    $spinner.show();
    var $button = $('#diary-submit');
    $button.prop('disabled', true);

    var $form = $(form);
    var entry = $form.find('textarea[name=diary-entry]').val();
    var dateStr = $form.find('[name=diary-date]').val();
    var entryText = entry;

    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr);
    tags = tags.concat(queryTags);
    tags = processTagList(tags);
    var tagString = tags.join();

    tl.allTags = tl.allTags.concat(tags);
    tl.allTags = processTagList(tl.allTags);

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

    var batch = db.batch();
    var newEntryRef = db.collection('diary-entry').doc();
    var tagsRef = db.collection('diary-tags').doc(loggedInUser.uid);
    batch.set(newEntryRef, entryData);
    batch.set(tagsRef, {tags: tl.allTags.join()})
    batch.commit().then(function() {
      entryData["id"] = newEntryRef.id;
      tl.entries.unshift(entryData);
      refreshUI(tl.entries);
      $spinner.hide();
      $button.prop('disabled', false);
      showAlert('entry-added-alert');
    })
    .catch(function(error) {
      logError("Error adding document: ", error);
      $spinner.hide();
      $button.prop('disabled', false);
      showAlert('entry-add-failed-alert');
    });
  }
  tl.diaryAddEntry = diaryAddEntry;

  function saveTags() {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;
    return new Promise((resolve, reject) => {
      console.log('in  save tags promise');
      db.collection("diary-tags").doc(loggedInUser.uid).set({tags: tl.allTags.join()})
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
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;
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
   * Also finds the tags related to the currently active tags.
   */
  function getRecentEntries() {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;

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

    tl.entries = [];
    queryRelatedTags = [];

    return new Promise(function(resolve, reject) {
      query.get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          let data = doc.data();
          data['id'] = doc.id;
          tl.entries.push(data);

          var tagList = data['tag-list'];
          var tags = tagList.join();

          var containsQueryTags = true;
          if(tagQueryActive) {
            if(!queryTags.every(r => tagList.indexOf(r) >= 0)) {
              containsQueryTags = false;
            }
          }

          if(containsQueryTags) {
            if(tagQueryActive) {
              queryRelatedTags = queryRelatedTags.concat(tags.split(','));
            }
          }
        });

        if(tagQueryActive) {
          queryRelatedTags = processTagList(queryRelatedTags); 
        }

        resolve(tl.entries);
      })
      .catch(function(error) {
          console.log("Error getting documents: ", error);
          resolve(tl.entries);
      });
    });
     
  }

  /**
   * Performs a refresh of the UI after the full entries list is
   * changed.
   */
  function refreshUI(entries) {
    refreshEntryDisplay(entries);
    refreshTagDisplay();
  }

  /**
   * Displays the entries for the currently active tags.
   * 
   * @param {object[]} entries List of entry data
   */
  function refreshEntryDisplay(entries) {
    var tableTemplate = '<div class="diary-entries">{rows}</div>';
    var defaultEntry = $('#elem-no-entries').html();
    var defaultEntryNoMatchingTags = $('#elem-no-entries-for-tags').html();
    var rowTemplate = `<div class="diary-entry" onclick="taggerlog.entryClicked('{entry-id}')">
      <div class="diary-entry-text">{entry}</div>
      <div>
        <div class="row">
          <div class="diary-entry-controls col-3"></div>
          <div class="diary-entry-tags col-9 text-truncate">{tags}</div>
        </div>
      </div>
    </div>`;
    var rows = '';

    var tagQueryActive = false;
    if(queryTags.length > 0) {
      tagQueryActive = true;
    }

    for(var i = 0; i < entries.length; i++) {
      var data = entries[i];
      var tagList = data['tag-list'];
      var tags = tagList.join();

      var containsQueryTags = true;
      if(tagQueryActive) {
        if(!queryTags.every(r => tagList.indexOf(r) >= 0)) {
          containsQueryTags = false;
        }
      }

      if(containsQueryTags) {
        let row = rowTemplate.replace('{date}', data['date']);
        row = row.replace('{entry}', postFormatEntry(cleanEntry(data['entry']))); 
        row = row.replace('{entry-id}', data['id']); 
        row = row.replace('{tags}', tags); 
        rows += row;
      }
    }

    if(rows == '') {
      if(tl.allTags.length > 0) {
        rows = defaultEntryNoMatchingTags;
      }
      else {
        rows = defaultEntry;          
      }
    }

    var tableHTML = tableTemplate.replace('{rows}', rows)        
    var $recentEntriesElem = $('#recent-entries');
    $recentEntriesElem.html(tableHTML);
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
    return entry;
  }

  /**
   * Tests if link is valid to use as a href.
   * 
   * @param {string} string 
   */
  function isValidURL(string) {
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
  };

  /**
   * Do any formatting after markdown and sanitising has been done.
   * 
   * @param {string} entry 
   */
  function postFormatEntry(entry) {
    // entry = entry.replace(/^(#+)(.*)$/gm, "<b>$2</b>");
    var linkTemplate = '<a href="{link}" target="_blank" onclick="event.stopPropagation();">{linkDisplay}</a>';
    entry = entry.replace(/^(http.*)$/gm, function(match) {
      if(isValidURL(match)) {
        var line = linkTemplate.replace("{link}", match);
        line = line.replace("{linkDisplay}", match);
        return line;
      }
      else {
        return match;
      }
    });
    entry = entry.replaceAll("*", "&bull;");
    entry = entry.replaceAll("\n", "<br />");
    return entry;
  }

  /**
   * Pops up a modal to edit an entry.
   * 
   * @param {string} id Entry ID
   */
  function editEntryStart(id) {
    var db = tl.db;
    db.collection('diary-entry').doc(id).get().then(function(doc) {
      let data = doc.data();
      var $form = $('#edit-entry-form');
      var $entry = $form.find('textarea[name=diary-entry]');
      var $date = $form.find('[name=diary-date]');
      $entry.val(data['entry'])
      var dateInfo = data['date'];
      var date = new Date(dateInfo['seconds'] * 1000);
      $date[0].valueAsNumber = date.getTime();
      $('#edit-entry-button').data('id', id);
      $('#delete-entry-button-on-popup').data('id', id);

      var tags = data['tag-list'];
      var tagDisplayTemplate = $('#elem-diary-tag-edit').html();
      var tagHTML = '';
      var tagsHTML = '';
      for(var i = 0; i < tags.length; i++) {
        tagHTML = tagDisplayTemplate.replaceAll('{tag}', tags[i]);
        tagHTML = tagHTML.replace('{selected}', 'selected');
        tagsHTML += tagHTML;
      }
      $('#diary-edit-entry-tags').html(tagsHTML);
      $form.find('[name=new-tag]').val('');
      $('#edit-entry-date').removeClass('show');
      $('#editEntryModal').modal();
    })
    .catch(function(error) {
      console.log(error);
    });
  }
  tl.editEntryStart = editEntryStart;

  /**
   * Updates an entry using information from the edit entry form.
   * 
   * @param {string} id Entry ID
   */
  function editEntry(id) {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;

    var $spinner = $('#edit-entry-spinner');
    $spinner.show();
    const $form = $('#edit-entry-form');
    const $entry = $form.find('textarea[name=diary-entry]');
    const $date = $form.find('[name=diary-date]');

    var formTags = [];
    var formTagsRemoved = [];
    var $formTags = $('#diary-edit-entry-tags').find('.diary-tag');
    $formTags.each(function() {
      var $formTag = $(this);
      if($formTag.hasClass('selected')) {
        formTags.push($formTag.data('tag'));
      }
      else {
        formTagsRemoved.push($formTag.data('tag'));
      }
    });

    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr);
    tags = tags.concat(formTags);
    tags = processTagList(tags);
    var tagString = tags.join();

    tl.allTags = tl.allTags.concat(tags);
    tl.allTags = processTagList(tl.allTags);
    var newEntry = {
      'entry': $entry.val(),
      'date': new Date($date.val()),
      'tags': tagString,
      'tag-list': tags
    };

    db.collection('diary-entry').doc(id).update(newEntry)
    .then(function() {
      for(var i = 0; i < tl.entries.length; i++) {
        var entryData = tl.entries[i];
        if(entryData["id"] == id) {
          newEntry["id"] = id;
          tl.entries[i] = newEntry;
          break;
        }
      }

      findOrphanTags(formTagsRemoved).then(function(orphans) {
        if(orphans.length) {
          tl.allTags = tl.allTags.filter(item => !orphans.includes(item));
          queryTags = queryTags.filter(item => !orphans.includes(item));
        }
        saveTags().then(() => {
          refreshTagDisplay();
        });
      });
      refreshEntryDisplay(tl.entries);

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
  tl.editEntry = editEntry;

  /**
   * Pops up a modal to delete an entry.
   * 
   * @param {string} id Entry ID
   */
  function deleteEntryStart(id) {
    var db = tl.db;
    db.collection('diary-entry').doc(id).get().then(function(doc) {
      let data = doc.data();
      console.log(data);
    })
    .catch(function(error) {
      console.log(error);
    });

    $('#delete-entry-button').data('id', id);
    $('#editEntryModal').modal('hide');
    $('#deleteEntryModal').modal();
  }
  tl.deleteEntryStart = deleteEntryStart;

  /**
   * Deletes an entry.
   * 
   * @param {string} id Entry ID
   */
  function deleteEntry(id) {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;
    var $spinner = $('#delete-entry-spinner');
    $spinner.show();
    let orphanTags = [];
    console.log('Deleting ' + id);

    db.collection('diary-entry').doc(id).get().then(function(doc) {
      let data = doc.data();
      let tagList = data['tag-list'];
      console.log(data);

      db.collection('diary-entry').doc(id).delete().then(function() {
        $spinner.hide();
        $('#deleteEntryModal').modal('hide');
        showAlert('entry-deleted-alert');
        for(var i = 0; i < tl.entries.length; i++) {
          var entryData = tl.entries[i];
          if(entryData["id"] == id) {
            tl.entries.splice(i, 1);
            break;
          }
        }
        refreshEntryDisplay(tl.entries);

        findOrphanTags(tagList).then(function(orphans) {
          if(orphans.length) {
            tl.allTags = tl.allTags.filter(item => !orphans.includes(item));
            queryTags = queryTags.filter(item => !orphans.includes(item));
            saveTags().then(() => {
              getRecentEntries().then(function() {
                refreshUI(tl.entries);
              });
            });
          }
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
  tl.deleteEntry = deleteEntry;

  /**
   * Helper function to wrap logging.
   * 
   * @param {string} error 
   */
  function logError(error) {
    console.log(error);
  }

  /**
   * Takes an array of tags, removes duplicates and empty tag and sorts.
   * 
   * @param {string[]} tagList 
   */
  function processTagList(tagList) {
    var tagSet = new Set(tagList);
    var tags = Array.from(tagSet).sort();
    for(var i = tagList.length - 1; i >= 0; i--) {
      if(tags[i] == "") {
        tags.splice(i, 1);
      }
    }
    return tags;
  }
  tl.processTagList = processTagList;

  /**
   * Gets all tags from the database and updates the tag UI.
   */
  function getTags() {
    var db = tl.db;

    return new Promise(function(resolve, reject) {
      db.collection("diary-tags").doc(tl.loggedInUser.uid)
      .get()
      .then(function(doc) {
          let data = doc.data();
          let tagString = data['tags'];
          if(tagString) {
            tl.allTags = processTagList(tagString.split(','));
          }
          else {
            tl.allTags = [];
          }
          resolve();
      });
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
    getRecentEntries().then(function() {
      refreshUI(tl.entries);
    });
  }
  tl.toggleTag = toggleTag;

  /**
   * Makes a tag active/deactivated on the entry edit form.
   * 
   * @param {string} tag 
   */
  function toggleEditTag(tag) {
    var $elem = $('#diary-tag-edit-' + tag);
    if($elem.hasClass('selected')) {
      $elem.removeClass('selected');
    }
    else {
      $elem.addClass('selected');
    }
  }
  tl.toggleEditTag = toggleEditTag;


  /**
   * Updates the displaying of tags based on currently active
   * query tags.
   */
  function refreshTagDisplay() {
    var tagTemplate = $('#elem-diary-tag').html();
    var tagDisplayTemplate = $('#elem-diary-tag-display').html();
    var tagHTML = '';
    var replacedTemplate = '';
    let tags = tl.allTags;
    if(queryRelatedTags.length) {
      tags = queryRelatedTags;
    }
    var noTagsElem = $('#elem-no-tags').html();

    var activeTagHTML = '';
    var activeTagsHTML = '';
    for(var i = 0; i < queryTags.length; i++) {
      activeTagHTML = tagDisplayTemplate.replaceAll('{tag}', queryTags[i]);
      activeTagHTML = activeTagHTML.replace('{selected}', 'selected');
      activeTagsHTML += activeTagHTML;
    }
    $('#diary-entry-active-tags').html(activeTagsHTML);

    var prevTag = '';
    var numTags = tags.length;
    if(tags.length) {
      for(var tag of tags) {
        if(numTags > 7 && prevTag && tag.charAt(0) != prevTag.charAt(0)) {
          tagHTML += '<br />';
        }
        replacedTemplate = tagTemplate.replaceAll('{tag}', tag);
        if(queryTags.indexOf(tag) == -1) {
          replacedTemplate = replacedTemplate.replaceAll('{selected}', '');
        }
        else {
          replacedTemplate = replacedTemplate.replaceAll('{selected}', 'selected');
        }
        tagHTML += replacedTemplate;
        prevTag = tag;
      }
    }
    else {
      tagHTML = noTagsElem;
    }

    $('#diary-tags').html(tagHTML);
  }

  /**
   * Management function to convert csv tags in diary-entry in the db
   * to array of tags in a field called tag-list.
   */
  function tagsToArray() {
    var db = tl.db;
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
    var db = tl.db;

    db.collection("diary-entry")
    .where('uid', '==', user.uid)
    .get()
    .then(function(querySnapshot) {
      var tagSet = new Set();
      querySnapshot.forEach(function(doc) {
        var data = doc.data();
        var docTags = data['tags'];
        var tagStrings = docTags.split(',');
        for(var tag of tagStrings) {
          let tagTrimmed = tag.trim();
          if(tagTrimmed) {
            tagSet.add(tagTrimmed);
          }
        }
      });
      var tags = Array.from(tagSet).sort();
      var tagString = tags.join(',');

      var tagData = {
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
  tl.generateTags = generateTags;

  /**
   * Hides elements on mobile html while typing in case
   * the static controls hide the form.
   */
  function hideWhenTyping() {
    $('#diary-controls-toggle').removeClass('d-none').addClass('d-flex');
    $('#diary-controls').removeClass('d-flex').addClass('d-none');
  }

  /**
   * Shows any elements hidden by hideWhenTyping.
   */
  function showWhenNotTyping() {
    $('#diary-controls-toggle').addClass('d-none').removeClass('d-flex');
    $('#diary-controls').removeClass('d-none').addClass('d-flex');
  }

  /**
   * Loads the user interface for a logged in user.
   */
  function updateLoggedInUI() {
    var loggedInUser = tl.loggedInUser;

    $('.loading-show').addClass('d-none');
    $('.loaded-show').removeClass('d-none');
    if(loggedInUser) {
      $('.logged-in-show').removeClass('d-none');
      $('.logged-out-show').addClass('d-none');
      $('#header-user-img').attr('src', loggedInUser.photoURL);
      $('#header-user-name').html(loggedInUser.displayName);
      $('#header-user-email').html(loggedInUser.email);
      $('#diary-controls').removeClass('d-none').addClass('d-flex');

      var $inputs = $('input[type=text], textarea');

      $inputs.focus(function() {
        hideWhenTyping();
      });
      $inputs.on('blur', function() {
        showWhenNotTyping();
      });
      $('#diary-controls-toggle').on('touchstart', function() {
        showWhenNotTyping();
      });

      getRecentEntries().then(function(entries) {
        refreshUI(entries);
      });
      getTags().then(function() {
        refreshTagDisplay();
      });
    }
    else {
      $('.logged-in-show').addClass('d-none');
      $('.logged-out-show').removeClass('d-none');
      $('#diary-controls').removeClass('d-flex').addClass('d-none');
    }
  }
  tl.updateLoggedInUI = updateLoggedInUI;

  /**
   * For smaller displays, shows the new entry form and hides tags display.
   */
  function toggleNewEntry() {
    var $newEntry = $('#diary-new-entry-panel');
    var $tags = $('#diary-tags-panel');
    var $entries = $('#diary-entries-panel');
    var $newEntryBtn = $('#diary-control-new-entry');
    var $tagsBtn = $('#diary-control-tags');

    if($newEntry.hasClass('collapse')) {
      $newEntry.removeClass('collapse');
      $entries.removeClass('collapse');
      $tags.addClass('collapse');
      $newEntryBtn.removeClass('inactive');
      $tagsBtn.addClass('inactive');
    }
    else {
      $newEntry.addClass('collapse');
      $entries.removeClass('collapse');
      $newEntryBtn.addClass('inactive');
    }
    window.scrollTo(0, 0);
  }
  tl.toggleNewEntry = toggleNewEntry;

  /**
   * For smaller displays, shows the tags display and hides entry form.
   */
  function toggleTags() {
    var $tags = $('#diary-tags-panel');
    var $newEntry = $('#diary-new-entry-panel');
    var $newEntryBtn = $('#diary-control-new-entry');
    var $tagsBtn = $('#diary-control-tags');

    if($tags.hasClass('collapse')) {
      $tags.removeClass('collapse');
      $newEntry.addClass('collapse');
      $newEntryBtn.addClass('inactive');
      $tagsBtn.removeClass('inactive');
    }
    else {
      $tags.addClass('collapse');
      $tagsBtn.addClass('inactive');
    }
    window.scrollTo(0, 0);
  }
  tl.toggleTags = toggleTags;

  /**
   * Handler for clicking on an entry.
   * 
   * @param {string} entryID 
   */
  function entryClicked(entryID) {
    var selection = window.getSelection();
    var selecting = selection.toString().length; 
    
    if(!selecting) {
      editEntryStart(entryID);
    }
  }
  tl.entryClicked = entryClicked;
  

})(taggerlog);
