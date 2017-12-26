/*
jshelper, version 2.0.6

Copyright (c) 2015, 2016, 2017, 2018, Nicholas Gasior <nmls@laatu.se>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/* Object containing element(s) */
  var jshEl = function(idOrObj) {
  /* Objects assigned */
    if (typeof(idOrObj) == "object") {
      var id = null;
      var o = [idOrObj];
    } else {
      var id = idOrObj;
      var o = [];
    }
    
  /* Setter/getter for DOM elements */
    var setO = function(a) { o = a; return this; }
    var getO = function()  { return o; }

  /* Private functions ----------------------------------------------------- */
  /* Checks if element has class */
    function _hasClass(cs) {
      for (var oi=0; oi<o.length; oi++) {
        if (!_hasObjClass(o[oi], cs))
          return false;
      }
      return true;
    }
  /* Checks if DOM element has class */
    function _hasObjClass(o, cs) {
      var re_w=/[\t\r\n\f]/g;
      var c=o.className;
      if (typeof(c)!='string')
        return false;
      c=c.replace(re_w,' ');
      if (c!='') {
        var ca=c.split(' ');
        for (var ci=0;ci<ca.length;ci++) {
          if (!ca[ci].match(/^[ ]*$/) && ca[ci]==cs) {
            return true;
          }
        }
      }
      return false;
    }
  /* Modified DOM element className */
    function _modClass(cs, a, h) {
      for (var oi=0; oi<o.length; oi++) {
        var re_w=/[\t\r\n\f]/g;
        var c=o[oi].className;
        c = c.replace(re_w, ' ');
        if (c != '') {
          var ca=c.split(' ');
          var n='';
          for (var ci=0; ci<ca.length; ci++) {
            if (!ca[ci].match(/^[ ]*$/)) { 
              if (ca[ci]!=cs) {
                n+=(n!=''?' ':'')+ca[ci];
              } else {
                if (h) {
                  return true;
                }
              }
            }
          }
          c=a?n+(n!=''?' ':'')+cs:n;
        } else {
          c=a?cs:''
        }
        o[oi].className=c;
        if (oi == 0 && h)
          return false;
      }
    }

    function _returnArray(out) {
             if (out.length==1) { return out[0]; }
        else if (out.length==0) { return null;   }
        else                    { return out;    }
    }

  /* Getter/setter for value of DOM element */
    function _val(o,v) {
        if (typeof(v) == 'undefined') return _valGet(o);
        else                          return _valSet(o, v);
    };

  /* Gets value from DOM element */
    function _valGet(o) {
        var tag = o.tagName.toLowerCase();
        switch (tag) {
            case 'select':   return o.options[o.selectedIndex].value;
            case 'textarea': return o.value;
            case 'input':
                var type = o.getAttribute('type');
                if (type===null) { type='text'; }
                switch (type) {
                    case 'text':
                    case 'password':
                    case 'hidden':
                    case 'checkbox':
                    case 'radio':
                        return o.value;
                }
                break;
        }
        return null;
    }

  /* Sets value of DOM element */
    function _valSet(o,v) {
        var tag = o.tagName.toLowerCase();
        switch (tag) {
            case 'select':
                for (var i=0; i<o.options.length; i++) {
                    if (o.options[i].value == v) {
                        o.selectedIndex = i;
                        return this;
                    }
                }
                break;
            case 'input':
                var type = o.getAttribute('type');
                if (type===null) { type='text'; }
                switch (type) {
                    case 'text':
                    case 'password':
                    case 'hidden':
                    case 'checkbox':
                    case 'radio':
                        o.value=v;
                        return this;
                }
                break;
            case 'textarea':
                o.value=v;
                return this;
        }
        return this;
    }

  /* Returns true if element can be checked */
    function _canElementBeChecked(el) {
        var tagName = el.tagName.toLowerCase();
        var tagType = el.getAttribute('type');
        if (tagType===null) { tagType='text'; }

        if (tagName=='input' && (tagType=='radio' || tagType=='checkbox')) {
            return true;
        } else { 
            return false;
        }
    }

  /* Sets 'checked' attr of DOM element */
    function _setElementChecked(el,v)   { 
        el.checked=(v?true:false);
        return this;
    }

  /* Gets 'checked' attr of DOM element */
    function _getElementChecked(el)     { 
        return el.checked; 
    }

  /* Sets 'disabled' attr of DOM element */
    function _setElementDisabled(el,v)   {
        el.disabled=(v?true:false);
        return this;
    }

  /* Gets 'disabled' attr of DOM element */
    function _getElementDisabled(el)     { 
        return el.disabled; 
    }

  /* Sets DOM element attribute */
    function _setElementAttribute(el,a,v) {
        if (v === null) {
            el.removeAttribute(a);
        } else {
            el.setAttribute(a, v);
        }
        return this;
    }

  /* Gets DOM element attribute */
    function _getElementAttribute(el,a)   { 
        return el.getAttribute(a); 
    }

  /* Sets DOM element style */
    function _setElementStyle(el,a,v) { 
        el.style[a]=v;
        return this;
    }
    
  /* Gets DOM element style */
    function _getElementStyle(el,a)   { 
        return el.style[a]; 
    }

  /* Public functions ------------------------------------------------------ */
  /* Creates DOM element from id */
    this.init = function() {
      if (document.getElementById(id)) {
        o = [document.getElementById(id)];
      }
    };

  /* Attach event to an element */
    this.on = function(n, f) {
      for (var i=0; i<o.length; i++) { 
        o[i].addEventListener(n, f); 
      }
      return this;
    };
    
  /* Detach event to an element */
    this.off = function(n, f) {
      for (var i=0; i<o.length; i++) { 
        o[i].removeEventListener(n, f); 
      }
      return this;
    };

  /* Removes class from element */
    this.rmClass = function(r) { 
      _modClass(r, false, false);
      return this; 
    };
    
  /* Adds class to element */
    this.addClass = function(r) { 
      _modClass(r, true, false);
      return this; 
    };

  /* Gets/sets value of element */
    this.val = function(v) {
        var out=[];
        for (var i=0; i<o.length; i++) {
            if (typeof v === 'undefined') { out.push(_val(o[i])); } 
            else                          { _val(o[i],v);         }
        }
        if (typeof v === 'undefined') { return _returnArray(out); } 
        else                          { return this;              }
    };

  /* Gets/sets innerHTML of element */
    this.html = function(v) {
      if (typeof v === 'undefined') {
        var out=[];
        for (var i=0; i<o.length; i++) { out.push(o[i].innerHTML); }
        return _returnArray(out);
      } else {
        for (var i=0; i<o.length; i++) { o[i].innerHTML=v;         }
        return this;
      }
    };

  /* Gets/sets 'checked' attribute */
    this.checked = function(v) {
        if (typeof v === 'undefined') {
            var out=[];
            for (var i=0; i<o.length; i++) {
                if (_canElementBeChecked(o[i])) {
                    out.push(_getElementChecked(o[i]));
                }
            }
            return _returnArray(out);
        } else {
            for (var i=0; i<o.length; i++) {
                if (_canElementBeChecked(o[i])) {
                    _setElementChecked(o[i],(v?true:false));
                }
            }
            return this;
        }
    }

  /* Gets/sets 'disabled' attribute */
    this.disabled = function(v) {
        if (typeof v === 'undefined') {
            var out=[];
            for (var i=0; i<o.length; i++) {
                out.push(_getElementDisabled(o[i]));
            }
            return _returnArray(out);
        } else {
            for (var i=0; i<o.length; i++) {
                _setElementDisabled(o[i],(v?true:false));
            }
            return this;
        }
    };

  /* Gets/sets attribute */
    this.attr = function(a, v) {
        if (typeof v === 'undefined') {
            var out=[];
            for (var i=0; i<o.length; i++) {
                out.push(_getElementAttribute(o[i], a));
            }
            return _returnArray(out);
        } else {
            for (var i=0; i<o.length; i++) {
                _setElementAttribute(o[i], a, v);
            }
            return this;
        }
    };

  /* Gets/sets style */
    this.style = function(a, v) {
        if (typeof v === 'undefined') {
            var out=[];
            for (var i=0; i<o.length; i++) {
                out.push(_getElementStyle(o[i], a));
            }
            return _returnArray(out);
        } else {
            for (var i=0; i<o.length; i++) {
                _setElementStyle(o[i], a, v);
            }
            return this;
        }
    };
    
  /* Appends object, just a wrapper to appendChild. */
    this.append = function(obj) {
      if (o.length == 1) {
        o[0].appendChild(obj);
      }
    }

  /* Calls function on every element */
    this.func = function(func) {
      for (var i=0; i<o.length; i++) {
        func(o[i]);
      }
    }

  /* Functions only returning values --------------------------------------- */
  /* Checks if element has class */
    this.hasClass = function(r) { 
      return _hasClass(r);
    };

  /* Returns position */
    this.pos = function() {
      var out=[];
      for (var i=0; i<o.length; i++) {
      /* @todo Checking if tagName is 'g' might not necessary be a proper 
         way. Needs checking at later point. */
        if (o[i].tagName == 'svg' || o[i].tagName == 'g') {
          var bbox    = o[i].getBBox();
          var _height = bbox.height;
          var _width  = bbox.width;
          var _left   = bbox.x;
          var _top    = bbox.y;
        } else {
          var _height = "innerHeight" in o[i] ? o[i].innerHeight 
                                                     : o[i].offsetHeight;
          var _width  = "innerWidth"  in o[i] ? o[i].innerWidth  
                                                     : o[i].offsetWidth;
          var _left   = o[i].offsetLeft;
          var _top    = o[i].offsetTop;
        }
        out.push({ w: _width, h: _height, l: _left, t: _top });
      }
      return _returnArray(out);
    };
  /* Returns number of DOM elements selected */
    this.length = function() {
      return o.length;
    }

  /* DOM elements modifiers ------------------------------------------------ */
  /* Removes DOM elements that do not have class */
    this.filterClass  = function(c) {
      var newObjs=[];
      for (var oi=0; oi<o.length; oi++) {
        if (_hasObjClass(o[oi],c)) {
          newObjs.push(o[oi]);
        }
      }
      setO(newObjs);
      return this;
    }
  /* Removed DOM elements that do not match tag name */
    this.filterTag = function(t) {
      var newObjs=[];
      for (var oi=0; oi<o.length; oi++) {
        if (o[oi].tagName.toLowerCase() == t.toLowerCase()) {
          newObjs.push(o[oi]);
        }
      }
      setO(newObjs);
      return this;
    }
    
  /* Removes DOM element. */
    this.rm = function() {
      for (var i=0; i<o.length; i++) { o[i].parentNode.removeChild(o[i]); }
      return true;
    };

  /* Sets current object DOM elements to parents of all objects. */
    this.parent = function() {
      var newObjs = [];
      for (var i=0; i<o.length; i++) { newObjs.push(o[i].parentNode); }
      setO(newObjs);
      return this;
    };

  /* Sets current object DOM elements to its next siblings. */
    this.next = function() {
      var newObjs = [];
      for (var i=0; i<o.length; i++) { 
        newObjs.push(o[i].nextElementSibling);
      }
      setO(newObjs);
      return this;
    };

  /* Sets current object DOM elements to its previous siblings. */
    this.prev = function() {
      var newObjs = [];
      for (var i=0; i<o.length; i++) { 
        newObjs.push(o[i].previousElementSibling); 
      }
      setO(newObjs);
      return this;
    };

  /* Sets current objects to its children. */
    this.children = function() {
      var newObjs = [];
      for (var i=0; i<o.length; i++) {
        for (var j=0; j<o[i].childNodes.length; j++) {
          if (o[i].childNodes[j].nodeType == 1) {
            newObjs.push(o[i].childNodes[j]);
          }
        }
      } 
      setO(newObjs);
      return this;
    };
    
  /* Sets current object to nth element */
    this.nth = function(n) {
      var newObjs = [];
      if (o.length >= n) {
        newObjs.push(o[n-1]);
      }
      setO(newObjs);
      return this;
    };
    
  /* Sets current object to first element */
    this.first = function() {
      this.nth(1);
      return this;
    };
    
  /* Sets current object to the last element */
    this.last = function() {
      var l = o.length;
      this.nth(l);
      return this;
    };
  };

/* Global variable for all operations */
  jsHelper = function(idOrObj) {
  /* Create js helper object */
    var el = new jshEl(idOrObj);
    el.init();
    return el;
  };
  

/* External functions - not related to DOM elements */
/* Attaches function to event */
  jsHelper.on = function(e, f) {
  /* On document load */
    if (e.toLowerCase() == "documentload") {
      var r = setInterval(function() {
        if (document.readyState == "complete") {
          clearInterval(r);
          f();
        }
      }, 100);
    }
  }

/* Counter for uniquely generated ids. */
  jsHelper.genUidsCnt = 0;
/* Generates unique id dependant on current datetime and genUidsCnt counter */
  jsHelper.uid = function() {
    var curDate = new Date();
    var curUnixTime = parseInt(curDate.getTime() / 1000);
    curUnixTime = curUnixTime.toString();
    jsHelper.genUidsCnt++;
    return 'gen_'+curUnixTime+'_'+(jsHelper.genUidsCnt-1);
  };
  
/* Shorter alias for document.getElementById */
  jsHelper.elById = function(id) {
    return document.getElementById(id);
  };

/* Encodes/decodes '<' and '>' HTML chars */
  jsHelper.encHtml = function(s) { 
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
  };
  jsHelper.decHtml = function(s) {
    return s.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>');
  };
  
/* Shorter alias to encodeURIComponent. */
  jsHelper.encUri = function(s) { return encodeURIComponent(s); }
  jsHelper.decUri = function(s) { return decodeURIComponent(s); }

/* Creates new DOM element. To be used only in sensible places, eg. when object
 * is created once for a lifetime. */
  jsHelper.nu = function(type, properties) {
    var o = document.createElement(type);
    if (typeof(properties) == 'object') {
      for (p in properties) {
        if (typeof(properties[p]) == 'object') {
          for (p2 in properties[p]) {
            o[p][p2] = properties[p][p2];
          }
        } else {
          o[p] = properties[p];
        }
      }
    }
    return o;
  };
  
/* Short variable */
/* @todo This needs to be handled differently so that function definitions are
 * not duplicated. */
  if (typeof(JSHELPER_COMPATIBLE) == "undefined") {
    $ = function(idOrObj) { return jsHelper(idOrObj); }
    $.on = function(e, f) { return jsHelper.on(e, f); }
    $.uid = function() { return jsHelper.uid(); }
    $.elById = function(id) { return jsHelper.elById(id); }
    $.encHtml = function(s) { return jsHelper.encHtml(s); }
    $.decHtml = function(s) { return jsHelper.decHtml(s); }
    $.encUri = function(s) { return jsHelper.encUri(s); }
    $.decUri = function(s) { return jsHelper.decUri(s); }
    $.nu = function(type, properties) { return jsHelper.nu(type, properties); }
  }
