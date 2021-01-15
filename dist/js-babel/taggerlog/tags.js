'use strict';
/** @suppress {duplicate} */

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var taggerlog = taggerlog || {};

(function (tl) {
  var tagErrorConfig = {
    "tags-empty": {},
    "tag-empty": {},
    "tag-format-max-length": {
      "data": {
        "max-length": 20
      }
    },
    "tag-format-max-tags": {
      "data": {
        "max-tags": 10
      }
    },
    "tag-format-valid-chars": {
      "data": {
        "valid-extra-chars": "-"
      }
    }
  };
  tl.tagErrorConfig = tagErrorConfig;
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

  tl.TagError = TagError;
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

    this.addError = function (tag, reason) {
      this.errors.push(new TagError(tag, reason));
      this.errorCodes.add(reason);
    };
    /**
     * Checks each tag against the error config to make sure they are valid.
     * 
     * @param {string[]} tags 
     */


    this.verifyTags = function (tags) {
      var maxTags = this.tagErrorConfig["tag-format-max-tags"]["data"]["max-tags"];

      if (tags.length == 0) {
        this.addError("", "tags-empty");
      } else if (tags.length > maxTags) {
        this.addError("", "tag-format-max-tags");
      }

      var _iterator = _createForOfIteratorHelper(tags),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var tag = _step.value;
          this.verifyTag(tag);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
    /**
     * Checks a tag against the error config. Records any errors found using 
     * this.addError
     * 
     * @param {string} tag 
     */


    this.verifyTag = function (tag) {
      var tagMaxLength = this.tagErrorConfig["tag-format-max-length"]["data"]["max-length"];

      if (!tag) {
        this.addError("", "tag-empty");
      }

      if (tag.length > tagMaxLength) {
        this.addError(tag, "tag-format-max-length");
      }

      var regex = /^[a-z0-9- ]+$/i;

      if (!regex.test(tag)) {
        this.addError(tag, "tag-format-valid-chars");
      }
    };
  }

  tl.TagVerifier = TagVerifier;
  /**
   * Converts csv of tags to array of lower case tags.
   * Replaces spaces and underscores with dashes.
   * @param {string} tagStr A CSV string of tags.
   * @param {boolean} clean Whether to sanitize tag.
   * @returns {string[]}
   */

  function tagCSVToTags(tagStr, clean) {
    if (clean === undefined) clean = true;
    var tagSet = new Set();
    var tagStrings = tagStr.split(",");

    for (var i = 0; i < tagStrings.length; i++) {
      var tag = tagStrings[i];
      tagStrings[i] = tag.trim();
    }

    if (clean) {
      tagStrings = cleanTags(tagStrings);
    }

    var _iterator2 = _createForOfIteratorHelper(tagStrings),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var tag = _step2.value;

        if (tag) {
          tagSet.add(tag);
        }
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }

    var tags = Array.from(tagSet);
    return tags;
  }

  tl.tagCSVToTags = tagCSVToTags;
  /**
   * Cleans an array of tags.
   * 
   * @param {string[]} tagStrings 
   */

  function cleanTags(tagStrings) {
    var tags = [];

    var _iterator3 = _createForOfIteratorHelper(tagStrings),
        _step3;

    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var tagRaw = _step3.value;
        tags.push(cleanTag(tagRaw));
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }

    return tags;
  }

  tl.cleanTags = cleanTags;
  /**
   * Replaces _ and space with dash.
   * 
   * Removes any characters except alphanumeric.
   * 
   * Converts to lower case.
   * 
   * @param {string} tagRaw 
   */

  function cleanTag(tagRaw) {
    var tagClean = tagRaw.toLowerCase().replaceAll(/[ _]/g, '-');
    tagClean = tagClean.replaceAll(/[^0-9a-zA-Z\-]/g, '');
    return tagClean;
  }

  tl.cleanTag = cleanTag;
})(taggerlog);