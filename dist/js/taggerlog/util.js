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

  /**
   * JQuery plugin to make elem trigger callback after
   * a specified time.
   * 
   * @param {number} time Time in ms
   * @param {function} callbackHold Function to call at end of timeout (param is $elem)
   * @param {function=} callbackEarly Function to call when elem is released before hold time (param is $elem)
   */
  $.fn.HoldButton = function(time, callbackHold, callbackEarly) {
    return this.each(function() {
      var $elem = $(this);
      var id = null;
      var holdTriggered = false;
      $elem.data('heldDown', false);
      $elem.on('mousedown touchstart', function(e) {
        $elem.data('heldDown', true);
        id = setTimeout(function($holdButton) { holdTriggered = true; callbackHold($holdButton); }, time, $elem);
      }).on('mouseup mouseleave touchend', function(e) {
        var $elem = $(e.target);
        if($elem.data('heldDown')) {
          $elem.data('heldDown', false);
          e.preventDefault();
          if(!holdTriggered) {
            if(callbackEarly) {
              callbackEarly($elem);
            }
          }
          if(id) {
            clearTimeout(id);
          }
          holdTriggered = false;
        }
      })
    });
  }

  /**
   * JQuery plugin to make elem trigger callback when pulled.
   * 
   * @param {function=} callbackStarted Function to call at touch/mouse start (param Event e)
   * @param {function=} callbackPulling Function to call at touch/mouse move (params Event e, dx, dy)
   * @param {function=} callbackReleased Function to call when released/left (param Event e)
   */
  $.fn.Pullable = function(callbackStarted, callbackPulling, callbackReleased) {
    return this.each(function() {
      var $elem = $(this);

      $elem.on('mousedown touchstart', function(e) {
        e.preventDefault();
        $elem.data('beingPulled', true);
        $elem.data('pullX', e.pageX);
        $elem.data('pullY', e.pageY);
        if(callbackStarted) {
          callbackStarted(e);
        }
      })
      .on('mousemove touchmove', function(e) {
        if($elem.data('beingPulled')) {
          if(callbackPulling) {
            let dx = e.pageX - $elem.data('pullX');
            let dy = e.pageY - $elem.data('pullY');

            callbackPulling(e, dx, dy);
          }
        }
      })
      .on('mouseup mouseleave touchend', function(e) {
        $elem.data('beingPulled', false);
        if(callbackReleased) {
          callbackReleased(e);
        }
      });
    })
  }
})(taggerlog);
