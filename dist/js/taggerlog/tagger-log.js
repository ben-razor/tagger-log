'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {

  var config = {
    "max-length": 400,
    "combo-title-max-length": 30,
    "default-user-img": "img/ui/default-user-1-sm.png"
  };
  tl.config = config;

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
   * The 'active' tags which limit displayed entries and are auto 
   * attached to new entries. Sorted and unique.
   * @type {string[]}
   */
  tl.queryTags = [];
  /**
   * Entries with a tag in excludeTags will not be displayed.
   * Sorted and unique.
   * @type {string[]}
   */
  var excludeTags = [];

  /**
   * Tags that are used on any entry that the queryTags are also used
   * on, includes the queryTags themselves. Sorted and unique.
   * @type {string[]}
   */
  var queryRelatedTags = [];

  /**
   * An array of starred tag combinations with titles.
   * 
   * E.g. [
   *   { 'title': 'Web', 'tags': 'dev,web' }, 
   *   { 'title': 'Cymbals', 'tags': 'audio,drums,cymbals' }
   * ]
   * 
   * @type {string[]}
   */
  tl.tagCombos = [];

  /**
   * Search term to limit the displayed tags.
   */
  var tagSearch = '';

  function TLDataStoreWrapper(dataStore) {
    this.dataStore = dataStore;

    this.init = function() {
      if(this.dataStore) {
        this.dataStore.init();
      }
    }

    this.deleteEntry = function(id) {
      if(this.dataStore) {
        this.dataStore.deleteEntry(id);
      }
    }
  }

  /**
   * An object that provides methods to read and write data.
   */
  tl.dataStore = new TLDataStoreWrapper();

  /**
   * Sets the interface that will be used for reading and 
   * writing data.
   */
  tl.setDataStore = function(dataStore) {
    tl.dataStore = new TLDataStoreWrapper(dataStore);
  }

  $(function() {
    if(tl.dataStore) {
      tl.dataStore.init();
    }
  });

  /**
   * Perform initializations after log in.
   */
  function init() {
    tl.entries = [];
    tl.allTags = [];
    tl.tagCombos = [];
    queryRelatedTags = [];
    excludeTags = [];
    tl.queryTags = [];

    initUI();
  }
  tl.init = init;

  /**
   * Initialize UI elements.
   */
  function initUI() {
    initAutocomplete();
    initTagSearch();
  }

  /**
   * Display an alert using the message from an error object.
   * 
   * @param {Error} error 
   */
  function alertError(error) {
    var $alertElem = $('#entry-error-alert');
    var $alertTextElem = $('#entry-error-text');
    $alertTextElem.html(error.message);
    $alertElem.fadeTo(2000, 1000).delay(2000).slideUp(500);
  }

  /**
   * Display an alert to reflect actions carried out on entries.
   * 
   * @param {object} error An error object
   * @param {string} elemPrefix 
   */
  function showErrorAlert(error, elemPrefix) {
    if(elemPrefix === undefined) { elemPrefix = 'entry-error'; }

    var id = error.reason;
    var alertText = $('#text-entry-error-' + id).html();

    var tagErrorInfo = tl.tagErrorConfig[id];
    if(tagErrorInfo) {
      var replace = tagErrorInfo['data'];
      if(replace) {
        for(var string in replace) {
          alertText = alertText.replaceAll('{' + string + '}', replace[string]);
        }
      }
    }
    var $alertElem = $('#' + elemPrefix + '-alert');
    var $alertTextElem = $('#' + elemPrefix + '-text');
    $alertTextElem.html(alertText);
    $alertElem.fadeTo(2000, 1000).delay(2000).slideUp(500);
  }
  tl.showAlert = showAlert;

  /**
   * Display an alert to reflect actions carried out on entries.
   * 
   * @param {string} id 
   */
  function showAlert(id) {
    var alertText = $('#text-' + id).html();
    var $alertElem = $('#entry-alert');
    var $alertTextElem = $('#entry-alert-text');
    $alertTextElem.html(alertText);
    $alertElem.fadeTo(2000, 1000).slideUp(500);
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
      tl.util.logError(tagVerifier.errors);
    }
  }

  /**
   * Class for communicating an errors with entries.
   * 
   * @param {string} reason A reason code like entry-empty
   */
  function EntryError(reason) {
    this.reason = reason;
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
    var $button = $('#diary-submit');
    $spinner.show();
    $button.prop('disabled', true);

    var $form = $(form);
    var $entry = $form.find('textarea[name=diary-entry]');
    var entry = $entry.val().substring(0, config['max-length']);
    var dateStr = $form.find('[name=diary-date]').val();

    var errors = [];    
    if(!entry) {
      errors.push(new EntryError('entry-empty'));
    }
    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr, false);
    tags = tags.concat(tl.queryTags);

    let tagVerifier = new tl.TagVerifier(tl.tagErrorConfig);
    tagVerifier.verifyTags(tags);
    if(tagVerifier.errors.length) {
      errors = errors.concat(tagVerifier.errors);
    }

    if(errors.length) {
      entryFailedUpdateUI(errors, $spinner, $button);
    }
    else {
      tags = tl.cleanTags(tags);
      tags = processTagList(tags);
      var tagString = tags.join();
      tl.allTags = tl.allTags.concat(tags);
      tl.allTags = processTagList(tl.allTags);

      let date = new Date();
      if(dateStr && dateStr !== '') {
        date = new Date(dateStr);
      }

      const entryData = {
        uid: loggedInUser.uid,
        entry: entry,
        date: date,
        tags: tagString,
        'tag-list': tags,
        'date-modified': firebase.firestore.FieldValue.serverTimestamp()
      }

      var batch = db.batch();
      var newEntryRef = db.collection('diary-entry').doc();
      var tagsRef = db.collection('diary-tags').doc(loggedInUser.uid);
      batch.set(newEntryRef, entryData);
      batch.set(tagsRef, {tags: tl.allTags.join()})
      batch.commit().catch(function(error) {
        entryFailedUpdateUI(error);
      });

      entryData['id'] = newEntryRef.id;
      tl.entries.unshift(entryData);
      updateQueryRelatedTags();
      refreshUI();
      $spinner.hide();
      $button.prop('disabled', false);
      showAlert('entry-added-alert');
      $entry.val('');
    }
  }
  tl.diaryAddEntry = diaryAddEntry;

  /**
   * Display errors with entry and update entry submit UI.
   * 
   * @param {object[]} errors An array of error objects.
   */
  function entryFailedUpdateUI(errors, $spinner, $button) {
    var $spinner = $('#add-entry-spinner');
    var $button = $('#diary-submit');
    var errorReason = errors[0].reason;
    
    tl.util.logError('Error adding document: ' + errorReason);
    $spinner.hide();
    $button.prop('disabled', false);
    showErrorAlert(errors[0]);
  }

  /**
   * Display errors with entry and update entry edit UI.
   * 
   * @param {object[]} errors An array of error objects.
   */
  function editFailedUpdateUI(errors) {
    var $spinner = $('#edit-entry-spinner');
    var $button = $('#edit-entry-button');
    tl.util.logError(JSON.stringify(errors));
    $spinner.hide();
    $button.prop('disabled', false);
    showErrorAlert(errors[0], 'edit-error');
  }

  /**
   * Save tags to firestore.
   * 
   * @returns {Promise}
   */
  function saveTags() {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;
    return new Promise((resolve, reject) => {
      db.collection('diary-tags').doc(loggedInUser.uid).set({tags: tl.allTags.join()})
      .then(function(docRef) {
        resolve();
      })
      .catch(function(error) {
        reject('Error adding tags: ' + error.toString());
      });
    });
  }
  tl.saveTags = saveTags;

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
    let query = db.collection('diary-entry');
    query = query.where('uid', '==', loggedInUser.uid);
    let storedMatchingTags = [];
    let orphans = [];

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
  tl.findOrphanTags = findOrphanTags;

  /**
   * Gets recent entries from the database and formats them for display.
   * 
   * Also finds the tags related to the currently active tags.
   */
  function getRecentEntries() {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;

    let query = db.collection('diary-entry').orderBy('date', 'desc');
    query = query.where('uid', '==', loggedInUser.uid);

    if(tl.queryTags.length > 0) {
      query = query.where('tag-list', 'array-contains-any', tl.queryTags);
    }
    else {
      query = query.limit(10);
    }

    tl.entries = [];
    queryRelatedTags = [];

    return new Promise(function(resolve, reject) {
      query.get({source: 'cache'})
      .then(function(querySnapshot) {
        var mostRecentModify = new Date(1955, 10, 21, 6, 15, 0);
        querySnapshot.forEach(function(doc) {
          let data = doc.data();
          data['id'] = doc.id;
          data['date'] = data['date'].toDate();
          data['date-modified'] = data['date-modified'].toDate();
          
          let exists = false;
          for(var i = 0; i < tl.entries.length; i++) {
            var existingEntry = tl.entries[i];
            if(existingEntry['id'] === data['id']) {
              exists = true;
              if(data['deleted']) {
                tl.entries.splice(i, 1);
              }
              else {
                tl.entries[i] = data;
              }
              break;
            }
          }

          if(!exists && !data['deleted']) {
            tl.entries.push(data);
          }

          if(data['date-modified'] > mostRecentModify) {
            mostRecentModify = data['date-modified'];
          }
        });

        updateQueryRelatedTags();
        refreshUI();

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

              let exists = false;
              for(var i = 0; i < tl.entries.length; i++) {
                var existingEntry = tl.entries[i];
                if(existingEntry['id'] === data['id']) {
                  exists = true;
                  if(data['deleted']) {
                    tl.entries.splice(i, 1);
                  }
                  else {
                    tl.entries[i] = data;
                  }
                  break;
                }
              } 

              if(!exists && !data['deleted']) {
                  tl.entries.push(data);
              }
            });

            tl.entries.sort((a, b) => a['date'] < b['date'] ? 1 : -1);
            updateQueryRelatedTags();
            refreshUI();
          }
          
          resolve(tl.entries);
        });
      })
      .catch(function(error) {
          tl.util.logError(['Error getting documents: ', error])
          resolve(tl.entries);
      });
    });
  }
  tl.getRecentEntries = getRecentEntries;

  /**
   * When there are active tags, gets all other tags from
   * records matching tags.
   * 
   * These can then be shown as related tags.
   */
  function updateQueryRelatedTags() {
    queryRelatedTags = [];
    let tagQueryActive = tl.queryTags.length > 0;

    for(var i = 0; i < tl.entries.length; i++) {
      var data = tl.entries[i];

      var tagList = data['tag-list'];

      var containsQueryTags = true;
      if(tagQueryActive) {
        if(!tl.queryTags.every(r => tagList.indexOf(r) >= 0)) {
          containsQueryTags = false;
        }
      }

      if(containsQueryTags) {
        if(tagQueryActive) {
          queryRelatedTags = queryRelatedTags.concat(tagList);
        }
      }
    }

    if(tagQueryActive) {
      queryRelatedTags = processTagList(queryRelatedTags); 
    }

    return queryRelatedTags;
  }

  /**
   * Performs a refresh of the UI after the full entries list is
   * changed.
   */
  function refreshUI() {
    refreshEntryDisplay();
    refreshTagDisplay();
    initAutocomplete();
  }
  tl.refreshUI = refreshUI;

  /**
   * Displays the entries for the currently active tags.
   * 
   * @param {object[]} entries List of entry data
   */
  function refreshEntryDisplay() {
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

    var tagQueryActive = tl.queryTags.length > 0;
    var excludeQueryActive = excludeTags.length > 0;

    for(var i = 0; i < tl.entries.length; i++) {
      var data = tl.entries[i];
      var tagList = tl.cleanTags(data['tag-list']);
      var tags = tagList.join();

      var containsQueryTags = true;
      if(tagQueryActive) {
        if(!tl.queryTags.every(r => tagList.indexOf(r) >= 0)) {
          containsQueryTags = false;
        }
      }
      if(excludeQueryActive) {
        if(tagList.some(r => excludeTags.indexOf(r) >= 0)) {
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

    var hasSelectedTags = tl.queryTags.length > 0 || excludeTags.length > 0;

    if(rows == '') {
      if(hasSelectedTags) {
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
   * Replaces HTML special characters.
   * 
   * @param {string} entry 
   */
  function cleanEntry(entry) {
    entry = htmlEntities(entry);
    return entry;
  }

  /**
   * Replaces HTML special characters. Removes control characters including newlines
   * and tabs.
   * 
   * @param {string} entry 
   */
  function cleanTitle(entry) {
    entry = DOMPurify.sanitize(entry);
    // entry = entry.replace(/[\x00-\x1F\x21-\x2F\x3A-\x40\x7B-\x9F]/g, '');
    entry = entry.replace(/[\r\n\t]/g, '');
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
    var linkTemplate = '<a href="{link}" target="_blank" onclick="event.stopPropagation();">{linkDisplay}</a>';
    entry = entry.replace(/^(http.*)$/gm, function(match) {
      if(isValidURL(match)) {
        var line = linkTemplate.replace('{link}', match);
        line = line.replace('{linkDisplay}', match);
        return line;
      }
      else {
        return match;
      }
    });
    entry = entry.replaceAll('*', '&bull;');
    entry = entry.replaceAll('\n', '<br />');
    return entry;
  }

  /**
   * Pops up a modal to edit an entry.
   * 
   * @param {string} id Entry ID
   */
  function editEntryStart(id) {
    var db = tl.db;
    var curEntry = null;
    for(var i = 0; i < tl.entries.length; i++) {
      curEntry = tl.entries[i];
      if(curEntry.id === id) {
        break;
      }
    }

    let data = curEntry;
    var $form = $('#edit-entry-form');
    var $entry = $form.find('textarea[name=diary-entry]');
    var $date = $form.find('[name=diary-date]');
    $entry.val(data['entry'])
    var date = data['date'];
    $date[0].valueAsNumber = date.getTime();
    $('#edit-entry-button').data('id', id);
    $('#delete-entry-button-on-popup').data('id', id);

    var tags = data['tag-list'];
    var tagDisplayTemplate = $('#elem-diary-tag-edit').html();
    var tagHTML = '';
    var tagsHTML = '';
    for(var i = 0; i < tags.length; i++) {
      tagHTML = tagDisplayTemplate.replaceAll('{tag}', tl.cleanTag(tags[i]));
      tagHTML = tagHTML.replace('{selected}', 'selected');
      tagsHTML += tagHTML;
    }
    $('#diary-edit-entry-tags').html(tagsHTML);
    $form.find('[name=new-tag]').val('');
    $('#edit-entry-date').removeClass('show');
    $('#editEntryModal').on('shown.bs.modal', function () {
      $('#editEntryModal').find('[name=diary-entry]').focus();
    });
    entryInputInit();
    $('#editEntryModal').modal();
  }
  tl.editEntryStart = editEntryStart;

  /**
   * Updates an entry using information from the edit entry form.
   * 
   * @param {string} id Entry ID
   */
  function editEntry(id) {
    var db = tl.db;

    var $spinner = $('#edit-entry-spinner');
    var $button = $('#edit-entry-button');
    $spinner.show();
    $button.prop('disabled', true);
    const $form = $('#edit-entry-form');
    const entry = $form.find('textarea[name=diary-entry]').val().substring(0, config['max-length']);
    const $date = $form.find('[name=diary-date]');

    var errors = [];    
    if(!entry) {
      errors.push(new EntryError('entry-empty'));
    }

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

    var tags = tl.tagCSVToTags(tagStr, false);
    tags = tags.concat(formTags);
    tags = processTagList(tags);

    let tagVerifier = new tl.TagVerifier(tl.tagErrorConfig);
    tagVerifier.verifyTags(tags);
    if(tagVerifier.errors.length) {
      errors = errors.concat(tagVerifier.errors);
    }

    if(errors.length) {
      editFailedUpdateUI(errors);
    }
    else {
      var tagString = tags.join();
      tl.allTags = tl.allTags.concat(tags);
      tl.allTags = processTagList(tl.allTags);
      var newEntry = {
        'entry': entry,
        'tags': tagString,
        'tag-list': tags,
        'date-modified': firebase.firestore.FieldValue.serverTimestamp()
      };
      var newDate = new Date($date.val());
      if(newDate !== new Date().getTime()) {
        newEntry['date'] = firebase.firestore.Timestamp.fromDate(newDate);
      }

      db.collection('diary-entry').doc(id).update(newEntry)
      .then(function() {
          findOrphanTags(formTagsRemoved).then(function(orphans) {
          if(orphans.length) {
            tl.allTags = tl.allTags.filter(item => !orphans.includes(item));
            tl.queryTags = tl.queryTags.filter(item => !orphans.includes(item));
            getRecentEntries().then(function() {
              refreshUI(tl.entries);
            });
          }
          saveTags().then(() => {
            refreshTagDisplay();
          });
        });
        updateQueryRelatedTags();
        refreshEntryDisplay();
       
      }).catch(function(error) {
        tl.util.logError(error);
        showAlert('entry-edit-failed-alert');
      });

      for(var i = 0; i < tl.entries.length; i++) {
        var entryData = tl.entries[i];
        if(entryData['id'] == id) {
          newEntry['id'] = id;
          newEntry['date'] = newDate;
          tl.entries[i] = newEntry;
          break;
        }
      }

      refreshUI();
      $spinner.hide();
      $button.prop('disabled', false);
      $('#editEntryModal').modal('hide');
      showAlert('entry-edited-alert');
    }
  }
  tl.editEntry = editEntry;

  /**
   * Pops up a modal to delete an entry.
   * 
   * @param {string} id Entry ID
   */
  function deleteEntryStart(id) {
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
    var $spinner = $('#delete-entry-spinner');
    $spinner.show();

    tl.dataStore.deleteEntry(id);

    showAlert('entry-deleted-alert');

    for(var i = 0; i < tl.entries.length; i++) {
      var entryData = tl.entries[i];
      if(entryData['id'] == id) {
        tl.entries.splice(i, 1);
        break;
      }
    }
    refreshEntryDisplay();

    $spinner.hide();
    $('#deleteEntryModal').modal('hide');
  }
  tl.deleteEntry = deleteEntry;

  /**
   * Takes an array of tags, removes duplicates and empty tag and sorts.
   * 
   * @param {string[]} tagList 
   */
  function processTagList(tagList) {
    var tagSet = new Set(tagList);
    var tags = Array.from(tagSet).sort();
    for(var i = tagList.length - 1; i >= 0; i--) {
      if(tags[i] == '') {
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
      db.collection('diary-tags').doc(tl.loggedInUser.uid)
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
          db.collection('diary-tag-combos').doc(tl.loggedInUser.uid)
          .get()
          .then(function(doc) {
            let data = doc.data();
            if(data) {
              tl.tagCombos = data['tag-combos'];
            }
            resolve();
          });
      });
    });
  }

  /**
   * Makes a tag active/deactivated.
   * 
   * @param {string} tag 
   */
  function toggleTag(tag, exclude) {
    let queryTagIndex = tl.queryTags.indexOf(tag);
    let tagActive = queryTagIndex != -1;
    let excludeTagIndex = excludeTags.indexOf(tag);
    let tagExcluded = excludeTagIndex != -1;
    let prevPrimaryTag = tl.queryTags[0];
    
    if(exclude) {
      if(tagActive) {
        tl.queryTags.splice(queryTagIndex, 1);
      }
      if(tagExcluded) {
        excludeTags.splice(excludeTagIndex, 1);
      }
      else {
        excludeTags.push(tag);
      }
    }
    else {
      if(!tagActive && !tagExcluded) {
        tl.queryTags.push(tag);
      }
      if(tagActive) {
        tl.queryTags.splice(queryTagIndex, 1);
      }
      if(tagExcluded) {
        excludeTags.splice(excludeTagIndex, 1);
      }
    }
    let primaryTag = tl.queryTags[0];

    let alreadyHaveEntries = tl.entries.length && (primaryTag === prevPrimaryTag);

    updateQueryRelatedTags();
    clearTagSearch();

    if(alreadyHaveEntries) {
      refreshUI();
    }
    else {
      getRecentEntries().then(function() {
        refreshUI();
      });
    }
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
    var queryTagHTML = '';
    var queryTagCombo = [];
    var replacedTemplate = '';
    let tags = tl.allTags;
    if(queryRelatedTags.length) {
      tags = queryRelatedTags;
    }

    if(tags.length - tl.queryTags.length > 7) {
      $('.tl-header-search-container').removeClass('d-none');
      if(tagSearch) {
        tags = tags.filter(x => x.startsWith(tagSearch.toLowerCase()));
      }
    }
    else {
      $('.tl-header-search-container').addClass('d-none');
      clearTagSearch();
    }
    var noTagsElem = $('#elem-no-tags').html();

    if(tl.loggedInUser) {
      var uid = tl.loggedInUser.uid;
      setItem('query-tags-' + uid, tl.queryTags);
      setItem('exclude-tags-' + uid, excludeTags);
    }

    var activeTagHTML = '';
    var activeTagsHTML = '';
    for(var i = 0; i < tl.queryTags.length; i++) {
      activeTagHTML = tagDisplayTemplate.replaceAll('{tag}', tl.cleanTag(tl.queryTags[i]));
      activeTagHTML = activeTagHTML.replace('{selected}', 'selected');
      activeTagsHTML += activeTagHTML;
    }
    $('#diary-entry-active-tags').html(activeTagsHTML);

    var prevTag = '';
    var numTags = tags.length;

    for(var i = 0; i < tl.queryTags.length; i++) {
      var tag = tl.cleanTag(tl.queryTags[i]);
      replacedTemplate = tagTemplate.replaceAll('{tag}', tag);
      replacedTemplate = replacedTemplate.replaceAll('{selected}', 'selected');
      queryTagHTML += replacedTemplate;
      queryTagCombo.push(tag)
    }

    for(var i = 0; i < excludeTags.length; i++) {
      var tag = tl.cleanTag(excludeTags[i]);
      replacedTemplate = tagTemplate.replaceAll('{tag}', tl.cleanTag(tag));
      replacedTemplate = replacedTemplate.replaceAll('{selected}', 'exclude');
      queryTagHTML += replacedTemplate;
      queryTagCombo.push('!' + tag);
    }

    var queryTagComboString = queryTagCombo.join(',');
    if(queryTagCombo.length) {
      if(tl.tagCombos.find(o => o['tags'] === queryTagComboString)) {
        $('#star-tags-main').addClass('starred');
      }
      else {
        $('#star-tags-main').removeClass('starred');
      }
    }

    if(tags.length) {
      for(var tag of tags) {
        if(tl.queryTags.indexOf(tag) > -1 || excludeTags.indexOf(tag) > -1) {
          continue;
        }
        let showingAllTags = !tl.queryTags.length && !excludeTags.length;
        if(showingAllTags) {
          if(numTags > 7 && prevTag && tag.charAt(0) != prevTag.charAt(0)) {
            tagHTML += '<br />';
          }
        }
        replacedTemplate = tagTemplate.replaceAll('{tag}', tl.cleanTag(tag));
        replacedTemplate = replacedTemplate.replaceAll('{selected}', '');
        tagHTML += replacedTemplate;
        prevTag = tag;
      }
    }
    else {
      tagHTML = noTagsElem;
    }

    var $panelAllTags = $('#panel-all-tags').addClass('d-none');
    var $selectedTagsPanel = $('#panel-selected-tags').addClass('d-none');
    var $relatedTagsPanel = $('#panel-related-tags').addClass('d-none');
    var $relatedTags = $('#diary-related-tags');

    if(queryTagHTML) {
      $selectedTagsPanel.removeClass('d-none');
      $('#diary-selected-tags').html(queryTagHTML);
      $('#diary-tags').html('');

      if(tagHTML) {
        $relatedTagsPanel.removeClass('d-none');
        $relatedTags.html(tagHTML);
      }
    }
    else {
      $panelAllTags.removeClass('d-none');
      $('#diary-tags').html(tagHTML);
    }

    var $panelTagCombos = $('#panel-tag-combos').addClass('d-none');
    var $tagCombos = $('#diary-tag-combos');
    if(tl.tagCombos.length) {
      var tagCombosHTML = '';
      var template = $('#elem-diary-tag-combos').html();
      for(var i = 0; i < tl.tagCombos.length; i++) {
        var tagCombo = tl.tagCombos[i]['tags'];
        var tagComboTitle = tl.tagCombos[i]['title'];
        var tagComboElem = template.replaceAll('{tag}', tagCombo);
        tagComboElem = tagComboElem.replaceAll('{tag-string}', cleanTitle(tagComboTitle));
        if(tagCombo === queryTagComboString) {
          tagComboElem = tagComboElem.replaceAll('{active}', 'active');
        }
        else {
          tagComboElem = tagComboElem.replaceAll('{active}', '');
        }
        tagCombosHTML += tagComboElem;
      }
      $tagCombos.html(tagCombosHTML);
      $panelTagCombos.removeClass('d-none');
    }

    $('.diary-tag').HoldButton(250, function($holdButton) {
      var tag = $holdButton.data('tag');
      toggleTag(tag, true);
    }, function($holdButton) {
      var tag = $holdButton.data('tag');
      toggleTag(tag);
    });
  }

  /**
   * Helper function for setting items in local storage.
   * 
   * @param {string} id 
   * @param {object} value 
   */
  function setItem(id, value) {
    if(tl.loggedInUser) {
      var uid = tl.loggedInUser.uid;
      window.localStorage.setItem(uid + id, JSON.stringify(value));
    }
  }

  /**
   * Helper function for getting item from local storage.
   * 
   * @param {string} id 
   */
  function getItem(id) {
    if(tl.loggedInUser) {
      var uid = tl.loggedInUser.uid;
      return window.localStorage.getItem(uid + id); 
    }
  }

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
    if(tl.loggedInUser) {
      var uid = tl.loggedInUser.uid;
      var storedQueryTags = getItem('query-tags-' + uid);
      var storedExcludeTags = getItem('exclude-tags-' + uid);

      if(storedQueryTags) {
        tl.queryTags = JSON.parse(storedQueryTags);
      }
      if(storedExcludeTags) {
        excludeTags = JSON.parse(storedExcludeTags);
      }

      $('.logged-in-show').removeClass('d-none');
      $('.logged-out-show').addClass('d-none');

      var photoURL = config['default-user-img'];

      $('#header-user-img').on('error', function() {
        $(this).attr('src', config['default-user-img']);
      });

      if(loggedInUser.photoURL) {
        photoURL = loggedInUser.photoURL;
      }
      $('#header-user-img').attr('src', photoURL);

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
      $('#diary-controls-toggle').on('click', function(event) {
        event.stopPropagation();
        showWhenNotTyping();
      });

      getRecentEntries().then(function(entries) {
        refreshUI();
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
      $('#diary-new-entry').find('[name=diary-entry]').focus();
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
  function toggleTags(event) {

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
  
  /**
   * Given the element id of a container of tag buttons. Builds a CSV where excluded
   * tags are prepended with !.
   * 
   * E.g.
   *   dev,web,todo,!done
   * 
   * This is then used as the identifier for a group of starred tags.
   * 
   * @param {string} tagsElemID 
   */
  function getStarredTagString(tagsElemID) {
    var $tagsElem = $('#' + tagsElemID);
    var $tags = $tagsElem.find('.diary-tag');

    var tags = [];
    $tags.each(function() {
      var $this = $(this);
      var tagID = $this.data('tag');
      if($this.hasClass('exclude')) {
        tagID = '!' + tagID;
      }
      tags.push(tagID);
    });
    var tagString = tags.join(',');
    return tagString;
  }

  /**
   * If current active tags are starred, unstars them.
   * 
   * Otherwise, open a popup to star the combination of tags.
   */
  function starTagsStart(elem) {
    var $elem = $(elem);
    var tagsElemID = $elem.data('tagsElem');
    var tagString = getStarredTagString(tagsElemID);

    var existingCombo = tl.tagCombos.find(x => x['tags'] === tagString);

    if(existingCombo !== undefined) {
      tl.tagCombos = tl.tagCombos.filter(x => x['tags'] !== tagString)
      saveTagCombos();
      $elem.removeClass('starred');
      refreshTagDisplay();
    }
    else {
      $('#star-tags-modal').on('shown.bs.modal', function () {
        $('#star-tags-form').find('[name=title]').val('').focus();
        entryInputInit();
      });

      $('#star-tags-modal').modal();
    }
  }
  tl.starTagsStart = starTagsStart;

  /**
   * Marks a selection of tags as stars, saves these to the
   * database as a preset.
   * 
   * @param {object} The clicked star element.
   */
  function starTags(elem) {
    var $elem = $(elem);
    var tagsElem = $elem.data('tagsElem');
    var $tagsElem = $('#' + tagsElem);
    var $tags = $tagsElem.find('.diary-tag');

    var title = $('#star-tags-form').find('[name=title').val();
    var cleanedTitle = cleanTitle(title);

    if(title !== cleanedTitle) {
      showErrorAlert(new EntryError('starred-title-invalid'), 'star-tags-error');
    }
    else if(!title) {
      showErrorAlert(new EntryError('starred-title-empty'), 'star-tags-error');
    }
    else {
      title = cleanedTitle.trim().substring(0, tl.config['combo-title-max-length']);

      var tags = [];
      $tags.each(function() {
        var $this = $(this);
        var tagID = $this.data('tag');
        if($this.hasClass('exclude')) {
          tagID = '!' + tagID;
        }
        tags.push(tagID);
      });

      var tagString = tags.join(',');
      tl.tagCombos.unshift({'title': title, 'tags': tagString});
      $elem.addClass('starred');
      refreshTagDisplay();
      $('#star-tags-modal').modal('hide');
      saveTagCombos();
    }
  }
  tl.starTags = starTags;
  
  /**
   * Gets the array of favourite tag combinations. 
   */
  function getTagCombos() {
    return tl.tagCombos;
  }
  tl.getTagCombos = getTagCombos;

  /**
   * Save the array of favourite tag combinations to the db.
   */
  function saveTagCombos() {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;
    return new Promise((resolve, reject) => {
      db.collection('diary-tag-combos').doc(loggedInUser.uid).set({'tag-combos': tl.tagCombos})
      .then(function(docRef) {
        resolve();
      })
      .catch(function(error) {
        reject('Error adding tags: ' + error.toString());
      });
    });
  }

  /**
   * Makes the tags in a combo active/excluded.
   */
  function selectCombo(elem) {
    var $elem = $(elem);
    var tagString = $elem.data('tag');
    var tags = tagString.split(',');
    let prevPrimaryTag = tl.queryTags[0];
    let alreadyHaveEntries = false;

    if($elem.hasClass('active')) {
      excludeTags = [];
      tl.queryTags = [];
      $elem.removeClass('active');
      $('.selected-tags-star').removeClass('starred');
    }
    else {
      tl.queryTags = [];
      excludeTags = [];
      for(var i = 0; i < tags.length; i++) {
        var tag = tags[i];
        if(tag.startsWith('!')) {
          excludeTags.push(tag.substring(1));
        }
        else {
          tl.queryTags.push(tag);
        }
      }
    
      let primaryTag = tl.queryTags[0];

      alreadyHaveEntries = tl.entries.length && (primaryTag === prevPrimaryTag);
    }

    clearTagSearch();
    updateQueryRelatedTags();

    if(alreadyHaveEntries) {
      refreshUI();
    }
    else {
      getRecentEntries().then(function() {
        refreshUI();
      });
    }
  }
  tl.selectCombo = selectCombo;

  /**
   * Called when the input in the entry textarea is changed.
   * 
   * Warns when message length limit being reached.
   * 
   * @param {object} elem 
   */
  function entryChanged(elem) {
    var $elem = $(elem);
    var countElem = $elem.data('countElem');
    var $countElem = $('#' + countElem);

    var entryType = $elem.data('entry-type');
    var configID = [entryType, 'max-length'].join('-');
    var entryMaxLength = config[configID];
    var count = $elem.val().length;
    $countElem.removeClass('max warning');
    var warningLevel = entryMaxLength / 10;

    if(count > entryMaxLength - warningLevel) {
      $countElem.html(count + '/' + entryMaxLength);
      $countElem.removeClass('d-none');
      if(count >= entryMaxLength) {
        $countElem.addClass('max');
      }
      else {
        $countElem.addClass('warning');
      }
    }
    else {
      $countElem.addClass('d-none');
    }
  }
  tl.entryChanged = entryChanged;

  /**
   * Initialises the entry text areas to call entryChanged
   * when input changes.
   */
  function entryInputInit() {
    var $entryAreas = $('.entry-count');
    $entryAreas.on('change keyup input', function(event) {
      entryChanged($(event.target));
    });

    $entryAreas.each(function() {
      var $entryArea = $(this);
      var configID = 'max-length';
      var entryType = $entryArea.data('entryType');
      if(entryType) {
        configID = entryType + '-' + configID;
      }
      var maxLength = tl.config[configID];
      $entryArea.attr('maxlength', maxLength);
      entryChanged(this);
    });
    
  }
  entryInputInit();

  /**
   * Set up autocomplete.
   */
  function initAutocomplete() {
    var hadComma = false;
    $('.tagAutoComplete').textcomplete([
      {
        match: /(^|\b)(,*\w{1,})$/,// /(^|\w)(\w*(?:\s*\w*))$/,
        // #4 - Function called at every new keystroke
        search(query, callback) {
          if(query.charAt(0) === ',') {
            hadComma = true;
          }
          query = query.replaceAll(',', '');
          var matching = tl.allTags.filter(tag => tag.startsWith(query.toLowerCase()));
          var numMatches = matching.length;
          matching = matching.slice(0, 5);
          callback(matching);

          var $dropdown = $('.textcomplete-dropdown');
          if(matching.length < numMatches && !$dropdown.find('.textcomplete-morematches').length) {
            $dropdown.html($dropdown.html() + '<li class="textcomplete-morematches">...</li>')
          }
        },
        // #5 - Template used to display each retrieved result
        template: function(word) {
          return word;
        },
        // #6 - Template used to display the selected result in the textarea
        replace: function(word, e) {
          var $elem = $(e.target);
          var currentText = $elem.val();
          if(hadComma) {
            hadComma = false;
            return ',' + word + ',';
          }
          else {
            return word + ',';
          }
        }
      }
    ]);
  }
  initAutocomplete();

  /**
   * Clear tag search variable and elements.
   */
  function clearTagSearch() {
    tagSearch = '';
    $('.tl-header-search').val(tagSearch);
  }

  /**
   * Set up search box for limiting displayed tags.
   */
  function initTagSearch() {
    clearTagSearch();
    $('.tl-header-search').on('input', function(e) {
      tagSearch = $(this).val().trim();
      refreshTagDisplay();
    });
  }
  initTagSearch();

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

})(taggerlog);
