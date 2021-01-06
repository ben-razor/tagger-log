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

      if(tags.length == 0 || !tags[0]) {
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
      const regex = /^[a-z0-9- ]+$/i;
      if(!regex.test(tag)) {
        this.addError(tag, "tag-format-valid-chars");
      }
    }
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
    if(clean === undefined) clean = true;

    let tagSet = new Set();

    let tagStrings = tagStr.split(",");

    if(clean) {
      tagStrings = cleanTags(tagStrings);
    }

    for(var tagRaw of tagStrings) {
      tagSet.add(tagRaw.trim());
    }

    let tags = Array.from(tagSet);

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
    for(var tagRaw of tagStrings) {
      tags.push(cleanTag(tagRaw));
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
    let tagClean = tagRaw.toLowerCase().replaceAll(/[ _]/g, '-');
    tagClean = tagClean.replaceAll(/[^0-9a-zA-Z\-]/g, '');
    return tagClean;
  }
  tl.cleanTag = cleanTag;

})(taggerlog);
