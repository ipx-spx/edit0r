/*
June, version 0.7.9, by Nicholas Gasior

Copyright (c) 2016, Laatu
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

var june = (function() {
/* Objects assigned. */
    var o=[];

/* Assigning object or array of objects. */
    var setO = function(a) { o = a; return june; };
    var getO = function()  { return o;           };

/* Getting object on which we are going do various actions 
   (eg. change styles). */
    var get = function (i) {
        if (typeof(i) == 'object') { 
            setO([i]);
        } else if (document.getElementById(i)) {
            setO([document.getElementById(i)]);
        }
        return this;
    };

/* Events. */
    var on = function(n, f) {
        for (var i=0; i<o.length; i++) { o[i].addEventListener(n, f); }
        return this;
    };

/* Adding/removing classes.
   General function to handle add, remove and checking if element has class. */
    var _removeClass = function(cs, a, h) {
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
            }
            o[oi].className=c;
            if (oi == 0 && h)
                return false;
        }
    };
    var _hasClass    = function(cs) {
        for (var oi=0; oi<o.length; oi++) {
            if (!_hasObjClass(o[oi], cs))
                return false;
        }
        return true;
    };
    var _hasObjClass = function(o, cs) {
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
    };

    var removeClass = function(r) { _removeClass(r,false,false);return this; };
    var addClass    = function(r) { _removeClass(r,true, false);return this; };
    var hasClass    = function(r) { return _hasClass(r); };

    var filterClass  = function(c) {
        var newObjs=[];
        for (var oi=0; oi<o.length; oi++) {
            if (_hasObjClass(o[oi],c)) {
                newObjs.push(o[oi]);
            }
        }
        setO(newObjs);
        return this;
    }

    var _returnArray = function(out) {
             if (out.length==1) { return out[0]; }
        else if (out.length==0) { return null;   }
        else                    { return out;    }
    };

/* Position of the element. */
    var position = function() {
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

/* Getting/setting the value. */
    var value = function(v) {
        var out=[];
        for (var i=0; i<o.length; i++) {
            if (typeof v === 'undefined') { out.push(_val(o[i])); } 
            else                          { _val(o[i],v);         }
        }
        if (typeof v === 'undefined') { return _returnArray(out); } 
        else                          { return this;              }
    };

/* Removing element. */
    var remove = function() {
        for (var i=0; i<o.length; i++) { o[i].parentNode.removeChild(o[i]); }
    };

/* Setting current object to parents of all objects. */
    var parent = function() {
        var newObjs = [];
        for (var i=0; i<o.length; i++) { newObjs.push(o[i].parentNode); }
        setO(newObjs);
        return this;
    };

/* Setting current objects to its next siblings. */
    var next = function() {
        var newObjs = [];
        for (var i=0; i<o.length; i++) { 
            newObjs.push(o[i].nextElementSibling);
        }
        setO(newObjs);
        return this;
    };

/* Setting current objects to its previous siblings. */
    var previous = function() {
        var newObjs = [];
        for (var i=0; i<o.length; i++) { 
            newObjs.push(o[i].previousElementSibling); 
        }
        setO(newObjs);
        return this;
    };

/* Setting current objects to its children. */
    var children = function() {
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

/* Getting/setting HTML. */
    var html = function(v) {
        if (typeof v === 'undefined') {
            var out=[];
            for (var i=0; i<o.length; i++) { out.push(o[i].innerHTML); }
            return _returnArray(out);
        } else {
            for (var i=0; i<o.length; i++) { o[i].innerHTML=v;         }
            return this;
        }
    };

    var setCheckedIfValueMatches = function(v, c) {
        for (var i=0; i<o.length; i++) {
            if (_canElementBeChecked(o[i])) {
                _setElementChecked(o[i], _val(o[i])==v ? (c?true:false) 
                                                       : (c?false:true));
            }
        }
        return this;
    };

    var setCheckedIfValuesMatches = function(v, c, s) {
        if (typeof c === 'undefined') {
            c = true;
        }
        if (typeof s === 'undefined') {
            s = '|';
        }
        if (v.indexOf(s) > -1) {
            var valArr = v.split(s);
        } else {
            var valArr = [v];
        }
        for (var i=0; i<o.length; i++) {
            if (_canElementBeChecked(o[i])) {
                var fnd = false;
                for (var j = 0; j < valArr.length; j++) {
                    if (_val(o[i]) == valArr[j]) {
                        fnd = true;
                    }
                }
                _setElementChecked(o[i], fnd ? (c?true:false) 
                                             : (c?false:true));
            }
        }
        return this;
    };

    var getValueIfChecked = function(c) {
        if (typeof c === 'undefined') {
            c = true;
        }
        for (var i=0; i<o.length; i++) {
            if (_canElementBeChecked(o[i])) {
                var ch=_getElementChecked(o[i]);
                if ((ch && c)||(!ch && !c))
                    return _val(o[i]);
            }
        }
        return null;
    };

    var getValuesIfChecked = function(c, s) {
        if (typeof c === 'undefined') {
            c = true;
        }
        if (typeof s === 'undefined') {
            s = '|';
        }
        var out='';
        for (var i=0; i<o.length; i++) {
            if (_canElementBeChecked(o[i])) {
                var ch=_getElementChecked(o[i]);
                if ((ch && c)||(!ch && !c)) {
                    out=out+(out!=''?s:'')+_val(o[i]);
                }
            }
        }
        return out;
    };

    var checked = function(v) {
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
    };

    var disabled = function(v) {
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

    var attribute = function(a, v) {
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

    var style = function(a, v) {
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

/* Getting/setting value. */
    var _val = function(o,v) {
        if (typeof(v) == 'undefined') return _valGet(o);
        else                          return _valSet(o, v);
    };
    var _valGet = function (o) {
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
    };

    var _valSet = function (o,v) {
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
    };

    var _canElementBeChecked = function(el) {
        var tagName = el.tagName.toLowerCase();
        var tagType = el.getAttribute('type');
        if (tagType===null) { tagType='text'; }

        if (tagName=='input' && (tagType=='radio' || tagType=='checkbox')) {
            return true;
        } else { 
            return false;
        }
    };

    var _setElementChecked   = function(el,v)   { 
        el.checked=(v?true:false);
        return this;
    };
    var _getElementChecked   = function(el)     { 
        return el.checked; 
    };
    var _setElementDisabled  = function(el,v)   {
        el.disabled=(v?true:false);
        return this;
    };
    var _getElementDisabled  = function(el)     { 
        return el.disabled; 
    };
    var _setElementAttribute = function(el,a,v) {
        if (v === null) {
            el.removeAttribute(a);
        } else {
            el.setAttribute(a, v);
        }
        return this;
    };
    var _getElementAttribute = function(el,a)   { 
        return el.getAttribute(a); 
    };
    var _setElementStyle     = function(el,a,v) { 
        el.style[a]=v;
        return this;
    };
    var _getElementStyle     = function(el,a)   { 
        return el.style[a]; 
    };

/* Counter for uniquely generated ids. */
    var genUidsCnt = 0;

/* Getting raw js object by id. */
    var getRawObject = function(id) {
        if (typeof(id) == 'string') { return document.getElementById(id); } 
        else if (typeof(id) == 'undefined') { return _returnArray(getO()); }
        else { return null; }
    };

/* To be used only in sensible places, eg. when object is created once for a 
   lifetime. */
    var newObject = function(type, properties) {
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

/* Appending object, just a wrapper to appendChild. */
    var append = function(obj) {
        if (o.length == 1) {
            o[0].appendChild(obj);
        }
        return this;
    };

/* Generates unique id dependant on current datetime and genUidsCnt counter. */
    var genUid = function() {
        var curDate = new Date();
        var curUnixTime = parseInt(curDate.getTime() / 1000);
        curUnixTime = curUnixTime.toString();
        genUidsCnt++;
        return 'gen_'+curUnixTime+'_'+(genUidsCnt-1);
    };

/* Run function on document load. */
    var onDocumentLoad = function(f) {
        var r = setInterval(function() {
            if (document.readyState == 'complete') {
                clearInterval(r);
                f();
            }
        }, 10);
    };

/* Encoding and decoding '<' and '>' HTML chars. */
    var encodeHtml = function(s) { 
        return s.replace(/</g, '&lt;').replace(/>/g, '&gt'); 
    };
    var decodeHtml = function(s) {
        return s.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>');
    };

/* Just a nice alias to encodeURIComponent. */
    var encodeUri  = function(s) { return encodeURIComponent(s); }
    var decodeUri  = function(s) { return decodeURIComponent(s); }

    return {
    /* @todo To be renamed or re-factored. */
        setCheckedIfValueMatches    : setCheckedIfValueMatches,
        setCheckedIfValuesMatches   : setCheckedIfValuesMatches,
        getValueIfChecked           : getValueIfChecked,
        getValuesIfChecked          : getValuesIfChecked,
        
    /* Methods that require associated object. */
        on                          : on,
        removeClass                 : removeClass,
        addClass                    : addClass,
        hasClass                    : hasClass,
        filterClass                 : filterClass,
        position                    : position,
        value                       : value,
        parent                      : parent,
        next                        : next,
        previous                    : previous,
        children                    : children,
        remove                      : remove,
        html                        : html,
        append                      : append,
        attribute                   : attribute,
        checked                     : checked,
        disabled                    : disabled,
        style                       : style,

    /* Methods that do not require object. */
        onDocumentLoad              : onDocumentLoad,
        get                         : get,
        genUid                      : genUid,
        getRawObject                : getRawObject,
        encodeHtml                  : encodeHtml,
        decodeHtml                  : decodeHtml,
        newObject                   : newObject,

    /* Short aliases. */
        odl                         : onDocumentLoad,
        g                           : get,
        uid                         : genUid,
        rcls                        : removeClass,
        acls                        : addClass,
        hascls                      : hasClass,
        fcls                        : filterClass,
        pos                         : position,
        val                         : value,
        par                         : parent,
        next                        : next,
        prev                        : previous,
        chn                         : children,
        obj                         : getRawObject,
        rm                          : remove,
        enc                         : encodeHtml,
        dec                         : decodeHtml,
        nu                          : newObject,
        app                         : append,
        attr                        : attribute,
        chk                         : checked,
        dis                         : disabled,
        sty                         : style,
        encUri                      : encodeUri,
        decUri                      : decodeUri
    };
})();

