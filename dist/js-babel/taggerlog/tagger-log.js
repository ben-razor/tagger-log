'use strict';
/** @suppress {duplicate} */

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var taggerlog = taggerlog || {};

(function (tl) {
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
   * An array of starred tag combinations with titles
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
   * Class for communicating general errors.
   * 
   * @param {string} reason A reason code
   */

  var ValidationError = /*#__PURE__*/function (_Error) {
    _inherits(ValidationError, _Error);

    var _super = _createSuper(ValidationError);

    function ValidationError(message) {
      var _this;

      _classCallCheck(this, ValidationError);

      _this = _super.call(this, message);
      _this.name = "Validation Error";
      return _this;
    }

    return ValidationError;
  }( /*#__PURE__*/_wrapNativeSuper(Error));
  /**
   * Display an alert using the message from an error object.
   * 
   * @param {Error} error 
   */


  function alertError(error) {
    var $alertElem = $("#entry-error-alert");
    var $alertTextElem = $("#entry-error-text");
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
    if (elemPrefix === undefined) {
      elemPrefix = 'entry-error';
    }

    var id = error.reason;
    var alertText = $('#text-entry-error-' + id).html();
    var tagErrorInfo = tl.tagErrorConfig[id];

    if (tagErrorInfo) {
      var replace = tagErrorInfo["data"];

      if (replace) {
        for (var string in replace) {
          alertText = alertText.replaceAll('{' + string + '}', replace[string]);
        }
      }
    }

    var $alertElem = $("#" + elemPrefix + "-alert");
    var $alertTextElem = $("#" + elemPrefix + "-text");
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
    var $alertElem = $("#entry-alert");
    var $alertTextElem = $("#entry-alert-text");
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
    var selected = $tagSelect.val();
    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr);
    var tagVerifier = new tl.TagVerifier(tl.tagErrorConfig);
    tagVerifier.verifyTags(tags);

    if (tagVerifier.errors.length == 0) {
      tl.allTags = processTagList(tl.allTags.concat(tags));
      selected = selected.concat(tags);
      $tagSelect.val(selected);
      $tagSelect.selectpicker('refresh');
      $elem.val('');
    } else {
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
    var entry = $entry.val();
    var dateStr = $form.find('[name=diary-date]').val();
    var errors = [];

    if (!entry) {
      errors.push(new EntryError("entry-empty"));
    }

    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr, false);
    tags = tags.concat(queryTags);
    var tagVerifier = new tl.TagVerifier(tl.tagErrorConfig);
    tagVerifier.verifyTags(tags);

    if (tagVerifier.errors.length) {
      errors = errors.concat(tagVerifier.errors);
    }

    if (errors.length) {
      entryFailedUpdateUI(errors, $spinner, $button);
    } else {
      tags = tl.cleanTags(tags);
      tags = processTagList(tags);
      var tagString = tags.join();
      tl.allTags = tl.allTags.concat(tags);
      tl.allTags = processTagList(tl.allTags);
      var date = new Date();

      if (dateStr && dateStr !== "") {
        date = new Date(dateStr);
      }

      var entryData = {
        uid: loggedInUser.uid,
        entry: entry,
        date: new Date(date),
        tags: tagString,
        "tag-list": tags
      };
      var batch = db.batch();
      var newEntryRef = db.collection('diary-entry').doc();
      var tagsRef = db.collection('diary-tags').doc(loggedInUser.uid);
      batch.set(newEntryRef, entryData);
      batch.set(tagsRef, {
        tags: tl.allTags.join()
      });
      batch.commit().then(function () {
        entryData["id"] = newEntryRef.id;
        tl.entries.unshift(entryData);
        updateQueryRelatedTags();
        refreshUI(tl.entries);
        $spinner.hide();
        $button.prop('disabled', false);
        showAlert('entry-added-alert');
        $entry.val('');
      })["catch"](function (error) {
        entryFailedUpdateUI(error);
      });
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
    tl.util.logError("Error adding document: " + errorReason);
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
    showErrorAlert(errors[0], "edit-error");
  }
  /**
   * Save tags to firestore.
   * 
   * @returns {Promise}
   */


  function saveTags() {
    var loggedInUser = tl.loggedInUser;
    var db = tl.db;
    return new Promise(function (resolve, reject) {
      db.collection("diary-tags").doc(loggedInUser.uid).set({
        tags: tl.allTags.join()
      }).then(function (docRef) {
        resolve();
      })["catch"](function (error) {
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
    var query = db.collection("diary-entry");
    query = query.where('uid', '==', loggedInUser.uid);
    var storedMatchingTags = [];
    var orphans = [];
    return new Promise(function (resolve, reject) {
      if (tags.length > 0) {
        query = query.where('tag-list', 'array-contains-any', tags);
      }

      query.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          var data = doc.data();
          var tagList = data['tag-list'];

          var _iterator = _createForOfIteratorHelper(tagList),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var tag = _step.value;

              if (!storedMatchingTags.includes(tag) && tags.includes(tag)) {
                storedMatchingTags.push(tag);
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        });

        var _iterator2 = _createForOfIteratorHelper(tags),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var tag = _step2.value;

            if (!storedMatchingTags.includes(tag)) {
              orphans.push(tag);
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        resolve(orphans);
      })["catch"](function (error) {
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
    var query = db.collection("diary-entry").orderBy("date", "desc");
    query = query.where('uid', '==', loggedInUser.uid);
    var tagQueryActive = false;

    if (queryTags.length > 0) {
      query = query.where('tag-list', 'array-contains-any', queryTags);
      tagQueryActive = true;
    } else {
      query = query.limit(10);
    }

    tl.entries = [];
    queryRelatedTags = [];
    return new Promise(function (resolve, reject) {
      query.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
          var data = doc.data();
          data['id'] = doc.id;
          tl.entries.push(data);
        });
        updateQueryRelatedTags();
        resolve(tl.entries);
      })["catch"](function (error) {
        tl.util.logError("Error getting documents: ", error);
        resolve(tl.entries);
      });
    });
  }
  /**
   * When there are active tags, get's all other tags from
   * records matching tags.
   * 
   * These can then be shown as related tags.
   */


  function updateQueryRelatedTags() {
    queryRelatedTags = [];
    var tagQueryActive = queryTags.length > 0;

    for (var i = 0; i < tl.entries.length; i++) {
      var data = tl.entries[i];
      var tagList = data['tag-list'];
      var containsQueryTags = true;

      if (tagQueryActive) {
        if (!queryTags.every(function (r) {
          return tagList.indexOf(r) >= 0;
        })) {
          containsQueryTags = false;
        }
      }

      if (containsQueryTags) {
        if (tagQueryActive) {
          queryRelatedTags = queryRelatedTags.concat(tagList);
        }
      }
    }

    if (tagQueryActive) {
      queryRelatedTags = processTagList(queryRelatedTags);
    }

    return queryRelatedTags;
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
    var rowTemplate = "<div class=\"diary-entry\" onclick=\"taggerlog.entryClicked('{entry-id}')\">\n      <div class=\"diary-entry-text\">{entry}</div>\n      <div>\n        <div class=\"row\">\n          <div class=\"diary-entry-controls col-3\"></div>\n          <div class=\"diary-entry-tags col-9 text-truncate\">{tags}</div>\n        </div>\n      </div>\n    </div>";
    var rows = '';
    var tagQueryActive = queryTags.length > 0;
    var excludeQueryActive = excludeTags.length > 0;

    for (var i = 0; i < entries.length; i++) {
      var data = entries[i];
      var tagList = tl.cleanTags(data['tag-list']);
      var tags = tagList.join();
      var containsQueryTags = true;

      if (tagQueryActive) {
        if (!queryTags.every(function (r) {
          return tagList.indexOf(r) >= 0;
        })) {
          containsQueryTags = false;
        }
      }

      if (excludeQueryActive) {
        if (tagList.some(function (r) {
          return excludeTags.indexOf(r) >= 0;
        })) {
          containsQueryTags = false;
        }
      }

      if (containsQueryTags) {
        var row = rowTemplate.replace('{date}', data['date']);
        row = row.replace('{entry}', postFormatEntry(cleanEntry(data['entry'])));
        row = row.replace('{entry-id}', data['id']);
        row = row.replace('{tags}', tags);
        rows += row;
      }
    }

    var hasSelectedTags = queryTags.length > 0 || excludeTags.length > 0;

    if (rows == '') {
      if (hasSelectedTags) {
        rows = defaultEntryNoMatchingTags;
      } else {
        rows = defaultEntry;
      }
    }

    var tableHTML = tableTemplate.replace('{rows}', rows);
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
    entry = DOMPurify.sanitize(entry);
    return entry;
  }
  /**
   * Tests if link is valid to use as a href.
   * 
   * @param {string} string 
   */


  function isValidURL(string) {
    var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return res !== null;
  }

  ;
  /**
   * Do any formatting after markdown and sanitising has been done.
   * 
   * @param {string} entry 
   */

  function postFormatEntry(entry) {
    var linkTemplate = '<a href="{link}" target="_blank" onclick="event.stopPropagation();">{linkDisplay}</a>';
    entry = entry.replace(/^(http.*)$/gm, function (match) {
      if (isValidURL(match)) {
        var line = linkTemplate.replace("{link}", match);
        line = line.replace("{linkDisplay}", match);
        return line;
      } else {
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
    db.collection('diary-entry').doc(id).get().then(function (doc) {
      var data = doc.data();
      var $form = $('#edit-entry-form');
      var $entry = $form.find('textarea[name=diary-entry]');
      var $date = $form.find('[name=diary-date]');
      $entry.val(data['entry']);
      var dateInfo = data['date'];
      var date = new Date(dateInfo['seconds'] * 1000);
      $date[0].valueAsNumber = date.getTime();
      $('#edit-entry-button').data('id', id);
      $('#delete-entry-button-on-popup').data('id', id);
      var tags = data['tag-list'];
      var tagDisplayTemplate = $('#elem-diary-tag-edit').html();
      var tagHTML = '';
      var tagsHTML = '';

      for (var i = 0; i < tags.length; i++) {
        tagHTML = tagDisplayTemplate.replaceAll('{tag}', tl.cleanTag(tags[i]));
        tagHTML = tagHTML.replace('{selected}', 'selected');
        tagsHTML += tagHTML;
      }

      $('#diary-edit-entry-tags').html(tagsHTML);
      $form.find('[name=new-tag]').val('');
      $('#edit-entry-date').removeClass('show');
      $('#editEntryModal').modal();
    })["catch"](function (error) {
      tl.util.logError(error);
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
    var $button = $('#edit-entry-button');
    $spinner.show();
    $button.prop('disabled', true);
    var $form = $('#edit-entry-form');
    var entry = $form.find('textarea[name=diary-entry]').val();
    var $date = $form.find('[name=diary-date]');
    var errors = [];

    if (!entry) {
      errors.push(new EntryError("entry-empty"));
    }

    var formTags = [];
    var formTagsRemoved = [];
    var $formTags = $('#diary-edit-entry-tags').find('.diary-tag');
    $formTags.each(function () {
      var $formTag = $(this);

      if ($formTag.hasClass('selected')) {
        formTags.push($formTag.data('tag'));
      } else {
        formTagsRemoved.push($formTag.data('tag'));
      }
    });
    var $elem = $form.find('[name=new-tag]');
    var tagStr = $elem.val();
    var tags = tl.tagCSVToTags(tagStr, false);
    tags = tags.concat(formTags);
    tags = processTagList(tags);
    var tagVerifier = new tl.TagVerifier(tl.tagErrorConfig);
    tagVerifier.verifyTags(tags);

    if (tagVerifier.errors.length) {
      errors = errors.concat(tagVerifier.errors);
    }

    if (errors.length) {
      editFailedUpdateUI(errors);
    } else {
      var tagString = tags.join();
      tl.allTags = tl.allTags.concat(tags);
      tl.allTags = processTagList(tl.allTags);
      var newEntry = {
        'entry': entry,
        'date': new Date($date.val()),
        'tags': tagString,
        'tag-list': tags
      };
      db.collection('diary-entry').doc(id).update(newEntry).then(function () {
        for (var i = 0; i < tl.entries.length; i++) {
          var entryData = tl.entries[i];

          if (entryData["id"] == id) {
            newEntry["id"] = id;
            tl.entries[i] = newEntry;
            break;
          }
        }

        findOrphanTags(formTagsRemoved).then(function (orphans) {
          if (orphans.length) {
            tl.allTags = tl.allTags.filter(function (item) {
              return !orphans.includes(item);
            });
            queryTags = queryTags.filter(function (item) {
              return !orphans.includes(item);
            });
            getRecentEntries().then(function () {
              refreshUI(tl.entries);
            });
          }

          saveTags().then(function () {
            refreshTagDisplay();
          });
        });
        refreshEntryDisplay(tl.entries);
        $spinner.hide();
        $button.prop('disabled', false);
        $('#editEntryModal').modal('hide');
        showAlert('entry-edited-alert');
      })["catch"](function (error) {
        tl.util.logError(error);
        showAlert('entry-edit-failed-alert');
        $spinner.hide();
        $button.prop('disabled', false);
        $('#editEntryModal').modal('hide');
      });
    }
  }

  tl.editEntry = editEntry;
  /**
   * Pops up a modal to delete an entry.
   * 
   * @param {string} id Entry ID
   */

  function deleteEntryStart(id) {
    var db = tl.db;
    db.collection('diary-entry').doc(id).get().then(function (doc) {
      var data = doc.data();
    })["catch"](function (error) {
      tl.util.logError(error);
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
    var orphanTags = [];
    db.collection('diary-entry').doc(id).get().then(function (doc) {
      var data = doc.data();
      var tagList = data['tag-list'];
      db.collection('diary-entry').doc(id)["delete"]().then(function () {
        $spinner.hide();
        $('#deleteEntryModal').modal('hide');
        showAlert('entry-deleted-alert');

        for (var i = 0; i < tl.entries.length; i++) {
          var entryData = tl.entries[i];

          if (entryData["id"] == id) {
            tl.entries.splice(i, 1);
            break;
          }
        }

        refreshEntryDisplay(tl.entries);
        findOrphanTags(tagList).then(function (orphans) {
          if (orphans.length) {
            tl.allTags = tl.allTags.filter(function (item) {
              return !orphans.includes(item);
            });
            queryTags = queryTags.filter(function (item) {
              return !orphans.includes(item);
            });
            saveTags().then(function () {
              getRecentEntries().then(function () {
                refreshUI(tl.entries);
              });
            });
          }
        });
      })["catch"](function (error) {
        tl.util.logError(error);
        showAlert('entry-delete-failed-alert');
        $spinner.hide();
        $('#deleteEntryModal').modal('hide');
      });
    })["catch"](function (error) {
      tl.util.logError(error);
    });
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

    for (var i = tagList.length - 1; i >= 0; i--) {
      if (tags[i] == "") {
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
    return new Promise(function (resolve, reject) {
      db.collection("diary-tags").doc(tl.loggedInUser.uid).get().then(function (doc) {
        var data = doc.data();
        var tagString = data['tags'];

        if (tagString) {
          tl.allTags = processTagList(tagString.split(','));
        } else {
          tl.allTags = [];
        }

        db.collection("diary-tag-combos").doc(tl.loggedInUser.uid).get().then(function (doc) {
          var data = doc.data();

          if (data) {
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


  function toggleTag(tag) {
    var queryTagIndex = queryTags.indexOf(tag);
    var tagActive = queryTagIndex != -1;
    var excludeTagIndex = excludeTags.indexOf(tag);
    var tagExcluded = excludeTagIndex != -1;
    var prevPrimaryTag = queryTags[0];

    if (!tagActive && !tagExcluded) {
      queryTags.push(tag);
    }

    if (tagActive) {
      queryTags.splice(queryTagIndex, 1);
      excludeTags.push(tag);
    } else {
      excludeTags.splice(excludeTagIndex, 1);
    }

    var primaryTag = queryTags[0];
    var alreadyHaveEntries = tl.entries.length && primaryTag === prevPrimaryTag;

    if (alreadyHaveEntries) {
      refreshUI(tl.entries);
    } else {
      getRecentEntries().then(function () {
        refreshUI(tl.entries);
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

    if ($elem.hasClass('selected')) {
      $elem.removeClass('selected');
    } else {
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
    var tags = tl.allTags;

    if (queryRelatedTags.length) {
      tags = queryRelatedTags;
    }

    var noTagsElem = $('#elem-no-tags').html();

    if (tl.loggedInUser) {
      var uid = tl.loggedInUser.uid;
      setCookie('query-tags-' + uid, queryTags);
      setCookie('exclude-tags-' + uid, excludeTags);
    }

    var activeTagHTML = '';
    var activeTagsHTML = '';

    for (var i = 0; i < queryTags.length; i++) {
      activeTagHTML = tagDisplayTemplate.replaceAll('{tag}', tl.cleanTag(queryTags[i]));
      activeTagHTML = activeTagHTML.replace('{selected}', 'selected');
      activeTagsHTML += activeTagHTML;
    }

    $('#diary-entry-active-tags').html(activeTagsHTML);
    var prevTag = '';
    var numTags = tags.length;

    for (var i = 0; i < queryTags.length; i++) {
      var tag = tl.cleanTag(queryTags[i]);
      replacedTemplate = tagTemplate.replaceAll('{tag}', tag);
      replacedTemplate = replacedTemplate.replaceAll('{selected}', 'selected');
      queryTagHTML += replacedTemplate;
      queryTagCombo.push(tag);
    }

    for (var i = 0; i < excludeTags.length; i++) {
      var tag = tl.cleanTag(excludeTags[i]);
      replacedTemplate = tagTemplate.replaceAll('{tag}', tl.cleanTag(tag));
      replacedTemplate = replacedTemplate.replaceAll('{selected}', 'exclude');
      queryTagHTML += replacedTemplate;
      queryTagCombo.push('!' + tag);
    }

    if (queryTagCombo.length) {
      var queryTagComboString = queryTagCombo.join(',');

      if (tl.tagCombos.find(function (o) {
        return o['tags'] === queryTagComboString;
      })) {
        $('#star-tags-main').addClass('starred');
      } else {
        $('#star-tags-main').removeClass('starred');
      }
    }

    if (tags.length) {
      var _iterator3 = _createForOfIteratorHelper(tags),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var tag = _step3.value;

          if (queryTags.indexOf(tag) > -1 || excludeTags.indexOf(tag) > -1) {
            continue;
          }

          var showingAllTags = !queryTags.length && !excludeTags.length;

          if (showingAllTags) {
            if (numTags > 7 && prevTag && tag.charAt(0) != prevTag.charAt(0)) {
              tagHTML += '<br />';
            }
          }

          replacedTemplate = tagTemplate.replaceAll('{tag}', tl.cleanTag(tag));
          replacedTemplate = replacedTemplate.replaceAll('{selected}', '');
          tagHTML += replacedTemplate;
          prevTag = tag;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    } else {
      tagHTML = noTagsElem;
    }

    var $panelAllTags = $('#panel-all-tags').addClass('d-none');
    var $selectedTagsPanel = $('#panel-selected-tags').addClass('d-none');
    var $relatedTagsPanel = $('#panel-related-tags').addClass('d-none');
    var $relatedTags = $('#diary-related-tags');

    if (queryTagHTML) {
      $selectedTagsPanel.removeClass('d-none');
      $('#diary-selected-tags').html(queryTagHTML);
      $('#diary-tags').html('');

      if (tagHTML) {
        $relatedTagsPanel.removeClass('d-none');
        $relatedTags.html(tagHTML);
      }
    } else {
      $panelAllTags.removeClass('d-none');
      $('#diary-tags').html(tagHTML);
    }

    var $panelTagCombos = $('#panel-tag-combos').addClass('d-none');
    var $tagCombos = $('#diary-tag-combos');

    if (tl.tagCombos.length) {
      var tagCombosHTML = '';
      var template = $('#elem-diary-tag-combos').html();

      for (var i = 0; i < tl.tagCombos.length; i++) {
        var tagCombo = tl.tagCombos[i]['tags'];
        var tagComboTitle = tl.tagCombos[i]['title'];
        var tagComboElem = template.replaceAll('{tag}', tagCombo);
        tagComboElem = tagComboElem.replaceAll('{tag-string}', tagComboTitle);
        tagCombosHTML += tagComboElem;
      }

      $tagCombos.html(tagCombosHTML);
      $panelTagCombos.removeClass('d-none');
    }
  }
  /**
   * Helper function for setting cookies.
   * 
   * @param {string} id 
   * @param {object} value 
   */


  function setCookie(id, value) {
    Cookies.set(id, JSON.stringify(value), {
      expires: 365
    });
  }
  /**
   * Helper function for getting cookies.
   * 
   * @param {string} id 
   */


  function getCookie(id) {
    return Cookies.get(id);
  }
  /**
   * Management function to convert csv tags in diary-entry in the db
   * to array of tags in a field called tag-list.
   */


  function tagsToArray() {
    var db = tl.db;
    var collection = db.collection("diary-entry");
    collection.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        var data = doc.data();
        var docTags = data['tags'];
        var tagStrings = docTags.split(',');
        var tags = [];

        var _iterator4 = _createForOfIteratorHelper(tagStrings),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var tag = _step4.value;
            var tagTrimmed = tag.trim();

            if (tagTrimmed) {
              tags.push(tagTrimmed);
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }

        collection.doc(doc.id).update({
          'tag-list': tags
        }).then(function () {})["catch"](function (error) {
          tl.util.logError(error);
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
    db.collection("diary-entry").where('uid', '==', user.uid).get().then(function (querySnapshot) {
      var tagSet = new Set();
      querySnapshot.forEach(function (doc) {
        var data = doc.data();
        var docTags = data['tags'];
        var tagStrings = docTags.split(',');

        var _iterator5 = _createForOfIteratorHelper(tagStrings),
            _step5;

        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var tag = _step5.value;
            var tagTrimmed = tag.trim();

            if (tagTrimmed) {
              tagSet.add(tagTrimmed);
            }
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      });
      var tags = Array.from(tagSet).sort();
      var tagString = tags.join(',');
      var tagData = {
        tags: tagString
      };
      db.collection("diary-tags").doc(user.uid).set(tagData).then(function (docRef) {})["catch"](function (error) {
        tl.util.logError("Error adding tags: ", error);
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

    if (tl.loggedInUser) {
      var uid = tl.loggedInUser.uid;
      var cookieQueryTags = getCookie('query-tags-' + uid);
      var cookieExcludeTags = getCookie('exclude-tags-' + uid);

      if (cookieQueryTags) {
        queryTags = JSON.parse(cookieQueryTags);
      }

      if (cookieExcludeTags) {
        excludeTags = JSON.parse(cookieExcludeTags);
      }

      $('.logged-in-show').removeClass('d-none');
      $('.logged-out-show').addClass('d-none');
      $('#header-user-img').attr('src', loggedInUser.photoURL);
      $('#header-user-name').html(loggedInUser.displayName);
      $('#header-user-email').html(loggedInUser.email);
      $('#diary-controls').removeClass('d-none').addClass('d-flex');
      var $inputs = $('input[type=text], textarea');
      $inputs.focus(function () {
        hideWhenTyping();
      });
      $inputs.on('blur', function () {
        showWhenNotTyping();
      });
      $('#diary-controls-toggle').on('touchstart', function () {
        showWhenNotTyping();
      });
      getRecentEntries().then(function (entries) {
        refreshUI(entries);
      });
      getTags().then(function () {
        refreshTagDisplay();
      });
    } else {
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

    if ($newEntry.hasClass('collapse')) {
      $newEntry.removeClass('collapse');
      $entries.removeClass('collapse');
      $tags.addClass('collapse');
      $newEntryBtn.removeClass('inactive');
      $tagsBtn.addClass('inactive');
    } else {
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

    if ($tags.hasClass('collapse')) {
      $tags.removeClass('collapse');
      $newEntry.addClass('collapse');
      $newEntryBtn.addClass('inactive');
      $tagsBtn.removeClass('inactive');
    } else {
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

    if (!selecting) {
      editEntryStart(entryID);
    }
  }

  tl.entryClicked = entryClicked;
  /**
   * If current active tags are starred, unstars them.
   * 
   * Otherwise, open a popup to star the combination of tags.
   */

  function starTagsStart(elem) {
    var $elem = $(elem);
    var tagsElem = $elem.data('tagsElem');
    var $tagsElem = $('#' + tagsElem);
    var $tags = $tagsElem.find('.diary-tag');
    var tags = [];
    $tags.each(function () {
      var $this = $(this);
      var tagID = $this.data('tag');

      if ($this.hasClass('exclude')) {
        tagID = '!' + tagID;
      }

      tags.push(tagID);
    });
    var tagString = tags.join(',');
    var existingCombo = tl.tagCombos.find(function (x) {
      return x['tags'] === tagString;
    });

    if (existingCombo !== undefined) {
      tl.tagCombos = tl.tagCombos.filter(function (x) {
        return x['tags'] !== tagString;
      });
      saveTagCombos().then(function () {
        $elem.removeClass('starred');
        refreshTagDisplay();
      });
    } else {
      $('#star-tags-modal').on('shown.bs.modal', function () {
        $('#star-tags-form').find('[name=title').val('').focus();
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
    var cleanTitle = cleanEntry(title);

    if (!title) {
      alertError(new tl.Error('Title is empty'));
    } else if (title !== cleanTitle) {
      alertError(new tl.Error('Title must only contain letters and numbers'));
    }

    if (title) {
      var tags = [];
      $tags.each(function () {
        var $this = $(this);
        var tagID = $this.data('tag');

        if ($this.hasClass('exclude')) {
          tagID = '!' + tagID;
        }

        tags.push(tagID);
      });
      var tagString = tags.join(',');
      tl.tagCombos.unshift({
        'title': title,
        'tags': tagString
      });
      $elem.addClass('starred');
      saveTagCombos().then(function () {
        refreshTagDisplay();
        $('#star-tags-modal').modal('hide');
      });
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
    return new Promise(function (resolve, reject) {
      db.collection("diary-tag-combos").doc(loggedInUser.uid).set({
        "tag-combos": tl.tagCombos
      }).then(function (docRef) {
        resolve();
      })["catch"](function (error) {
        reject("Error adding tags: " + error.toString());
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
    var prevPrimaryTag = queryTags[0];
    queryTags = [];
    excludeTags = [];

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];

      if (tag.startsWith('!')) {
        excludeTags.push(tag.substring(1));
      } else {
        queryTags.push(tag);
      }
    }

    var primaryTag = queryTags[0];
    var alreadyHaveEntries = tl.entries.length && primaryTag === prevPrimaryTag;

    if (alreadyHaveEntries) {
      refreshUI(tl.entries);
    } else {
      getRecentEntries().then(function () {
        refreshUI(tl.entries);
      });
    }
  }

  tl.selectCombo = selectCombo;
})(taggerlog);