'use strict';
/** @suppress {duplicate} */
var taggerlog = taggerlog || {};

(function(tl) {
  tl.util = {};
  /**
   * Searches for first element of array matching value,
   * removes it if found.
   * 
   * @param {object[]} array
   * @param {object} value
   */
  tl.util.findAndRemove = function(arr, value) {
    var index = arr.indexOf(value);
    var exists = (index !== -1);
    if(exists) {
      arr.splice(index, 1);
    }
  }

  /**
   * Helper function to wrap logging.
   * 
   * @param {string} error 
   */
  tl.util.logError = function(error) {
    console.log(error);
  }

  /**
   * Helper function to wrap logging.
   * 
   * @param {string} error 
   */
  tl.util.logObject = function(obj) {
    console.log(JSON.stringify(obj));
  }

})(taggerlog);
