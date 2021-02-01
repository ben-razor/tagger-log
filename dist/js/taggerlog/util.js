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
   * @param {event} e Check if event was touch not mouse
   */
  function isTouch(e) {
    return e.originalEvent && e.originalEvent.touches;
  }
  tl.util.isTouch = isTouch;

  /**
   * Get an object to access pageX and pageY on.
   * 
   * Returns event for desktop or e.originalEvent.touches
   * for mobile.
   * 
   * @param {event} e 
   */
  function getTouchInfo(e) {
      var touchInfo = e;
      if(isTouch(e)) {
        touchInfo = e.originalEvent.touches[0];
      }
      return touchInfo;
  }
  tl.util.getTouchInfo = getTouchInfo;

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
      let $elem = $(this);
      let id = null;
      let holdTriggered = false;
      let startPos = [0,0];

      $elem.data('heldDown', false);

      $elem.on('mousedown touchstart', function(e) {
        $elem.data('heldDown', true);
        let touchInfo = getTouchInfo(e);
        startPos = [touchInfo.screenX, touchInfo.screenY];
        id = setTimeout(function($holdButton) { holdTriggered = true; callbackHold($holdButton); }, time, $elem);
      })
      .on('mousemove touchmove', function(e) {
        if($elem.data('heldDown')) {
          let touchInfo = getTouchInfo(e);
          const DRAG_DIST = 8;
          let dx = Math.abs(touchInfo.screenX - startPos[0]);
          let dy = Math.abs(touchInfo.screenY - startPos[1]);
          let dragged = dx > DRAG_DIST || dy > DRAG_DIST;

          if(dragged) {
            $elem.data('heldDown', false);
            if(id) {
              clearTimeout(id);
            }
            holdTriggered = false;
          }
        }
      })
      .on('mouseleave', function(e) {
        $elem.data('heldDown', false);
        if(id) {
          clearTimeout(id);
        }
        holdTriggered = false;
      })
      .on('mouseup touchend', function(e) {
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
   * Adds the class pullClick to the element so onclick handlers on contained
   * elements can check and not trigger if this is set in a parent.
   * 
   * @param {function=} callbackStarted Function to call at touch/mouse start (param Event e)
   * @param {function=} callbackPulling Function to call at touch/mouse move (params Event e, dx, dy)
   * @param {function=} callbackReleased Function to call when released/left (param Event e)
   */
  $.fn.Pullable = function(callbackStarted, callbackPulling, callbackReleased) {
    return this.each(function() {
      var $elem = $(this);
      $elem.addClass('pullable');
      
      $elem.on('mousedown touchstart', function(e) {
        $('body').css('overscroll-behavior', 'none');
        $elem.data('pullStarted', true);
        $elem.data('pullStartX', getTouchInfo(e).pageX);
        $elem.data('pullStartY', getTouchInfo(e).pageY);
        if(callbackStarted) {
          callbackStarted(e);
        }
      })
      .on('mousemove touchmove', function(e) {
        if($elem.data('pullStarted') || $elem.data('beingPulled')) {
          $elem.data('pullStarted', false);
          
          if(callbackPulling) {
            let pageX = getTouchInfo(e).pageX;
            let pageY = getTouchInfo(e).pageY;

            let dx = pageX - $elem.data('pullStartX');
            let dy = pageY - $elem.data('pullStartY');

            let prevX = $elem.data('pullX') || 0;
            let prevY = $elem.data('pullY') || 0;
            let dxMove = pageX - prevX;
            let dyMove = pageY - prevY;

            if(dxMove || dyMove) {
              $elem.data('beingPulled', true);
              $elem.addClass('pullClick');
              callbackPulling(e, dx, dy);
            }

            $elem.data('pullX', pageX);
            $elem.data('pullY', pageY);
          }
        }
      })
      .on('mouseup mouseleave', function(e) {
        $('body').css('overscroll-behavior', '');
        $elem.data('pullStarted', false);
        $elem.data('beingPulled', false);
        if(callbackReleased) {
          callbackReleased(e);
        }
      })
      .on('touchend', function(e) {
        $('body').css('overscroll-behavior', '');
        $elem.data('pullStarted', false);
        $elem.data('beingPulled', false);
        $elem.removeClass('pullClick');
        if(callbackReleased) {
          callbackReleased(e);
        }
      })
      .on('click', function(e) {
        $elem.data('pullStarted', false);
        $elem.data('beingPulled', false);
        $elem.removeClass('pullClick');
      });
    })
  }
})(taggerlog);
