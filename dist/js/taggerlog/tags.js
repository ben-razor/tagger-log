'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {

  var tagErrorConfig = {
    "tags-empty": {},
    "tag-format-max-length": {
      "data": {
        "max-length": 20
      }
    },
    "tag-format-max-tags": {
      "data": {
        "max-tags": 10
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
      let maxTags = this.tagErrorConfig["tag-format-max-tags"]["data"]["max-tags"];

      if(tags.length == 0) {
        this.addError("", "tags-empty");
      }
      else if(tags.length > maxTags) {
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
      let tagMaxLength = this.tagErrorConfig["tag-format-max-length"]["data"]["max-length"];

      if(tag.length > tagMaxLength) {
        this.addError(tag, "tag-format-max-length");
      }
    }
  }
  tl.TagVerifier = TagVerifier;

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
  tl.tagCSVToTags = tagCSVToTags;

})(taggerlog);
