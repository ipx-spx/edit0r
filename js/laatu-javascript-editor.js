// by Nicholas Gasior. (c) laatu.uk

String.prototype.encodeHtml = function() {
  return String(this).replace('<', '&lt;').replace('>', '&gt');
}
String.prototype.decodeHtml = function() {
  return String(this).replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>');
}

// Little helper.
var _h = {
  obj: function(id, errMsg) {
    var o = document.getElementById(id);
    if (o === null) {
      console.log(errMsg);
    }
    return o;
  },
  coords: function(obj) {
    if (typeof(obj) == 'string') {
      var obj = this.__obj(obj);
    }
    // @todo Can vanilla javascript be used here instead of jQuery?
    return {
      w: $(obj).width(),
      h: $(obj).height(),
      l: $(obj).position().left,
      t: $(obj).position().top
    };
  },
  // To be used only in sensible places, eg. when object is created once for a lifetime.
  newObj: function(type, properties) {
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
  },
  appendObj: function(obj, tgt) {
    tgt.appendChild(obj);
  }
}

var laatuJsEditor = {
  // There might be many instance of laatuJsEditor but only one of them can be active (at least so far).
  // Possible @todo is to make this an array so that text might be input in many windows.
  currentId:       '',
  // Storing information about shift, alt and ctrl keys being down.
  keyShiftDown:    false,
  keyAltDown:      false,
  keyCtrlDown:     false,
  // We need numbers of line to be visible till the bottom of the container - even if there are actually less lines.
  // Therefore below number is added to get that done.
  lineNumberAddon: 100,

  _createContainer: function(id, l, t) {
    var container_obj = _h.newObj('div', {
      className: 'laatu-js-editor',
      style: {
        position: 'absolute',
        left: l + 'px',
        top: t + 'px'
      },
      id: id + '_laatu-js-editor-container'
    });
    _h.appendObj(container_obj, document.body);
    return container_obj;    
  },
  _createLineNumbers: function(id, container_obj) {
    var line_numbers_obj = _h.newObj('div', {
      className: 'laatu-js-editor-line-numbers',
      id: id + '_laatu-js-editor-line-numbers'
    });
    _h.appendObj(line_numbers_obj, container_obj);
    return line_numbers_obj;
  },
  _createLines: function(id, textarea_obj, container_obj, line_numbers_obj) {
    var lines_obj = _h.newObj('div', {
      className: 'laatu-js-editor-lines',
      id: id + '_laatu-js-editor-lines'
    });
    var match = textarea_obj.value.match(/\n/g);
    if (match !== null) {
      var cnt_lines = match.length + 1;
    } else {
      var cnt_lines = 1;
    }
    var arr_lines = textarea_obj.value.replace(/\n\n/g, "\n \n").replace(/\n$/g, "\n ").split(/\n/);
    var line_numbers = '';
    var lines_content = '';
    for (var i=0; i<cnt_lines+this.lineNumberAddon; i++) {
      line_numbers = line_numbers + (line_numbers!=''?"\n":'') + (i+1);
    }
    for (var i=0; i<cnt_lines; i++) {
      if (arr_lines[i] == '') {
        arr_lines[i] = ' ';
      }
      lines_content = lines_content + '<pre>' + arr_lines[i].encodeHtml() + '</pre>';
    }
    lines_obj.innerHTML = lines_content;
    line_numbers_obj.innerHTML = '<pre>' + line_numbers + '</pre>';
    _h.appendObj(lines_obj, container_obj);

    var line_numbers_coords = _h.coords(line_numbers_obj);
    var textarea_coords = _h.coords(textarea_obj);
    line_numbers_obj.style.height = textarea_coords.h+'px';
    lines_obj.style.height = textarea_coords.h+'px';
    lines_obj.style.width = (textarea_coords.w-line_numbers_coords.w)+'px';
    return lines_obj;
  },
  _createChar: function(id) {
    var char_obj = _h.newObj('span', {
      className: 'laatu-js-editor-char',
      id: id + '_laatu-js-editor-char',
      innerHTML: '&nbsp;'
    });
    _h.appendObj(char_obj, document.body);
    return char_obj;
  },
  _createCursor: function(id, char_obj) {
    var char_coords = _h.coords(char_obj);
    var cursor_obj = _h.newObj('div', {
      className: 'laatu-js-editor-cursor',
      id: id + '_laatu-js-editor-cursor',
      innerHTML: '<textarea rows="1" id="'+id+'_laatu-js-editor-cursor-input"></textarea>',
      style: { height: char_coords.h+'px' }
    });
    _h.appendObj(cursor_obj, document.body);
  },
  _attachResize: function(id) {
    _h.obj(id).onresize = function() {
      var textarea_obj = this;
      var textarea_coords = _h.coords(textarea_obj);
      var line_numbers_obj = _h.obj(id+'_laatu-js-editor-line-numbers');
      var line_numbers_coords = _h.coords(line_numbers_obj);
      var lines_obj = _h.obj(id+'_laatu-js-editor-lines');
      line_numbers_obj.style.height = textarea_coords.h+'px';
      lines_obj.style.height = textarea_coords.h+'px';
      lines_obj.style.width = (textarea_coords.w-line_numbers_coords.w)+'px';
    }
  },
  _attachClick: function(id) {
    _h.obj(id+'_laatu-js-editor-lines').onclick = function() {
      var id = this.id.split('_')[0];
      _h.obj(id+'_laatu-js-editor-cursor-input').focus();
    }
  },
  _attachScroll: function(id) {
    _h.obj(id+'_laatu-js-editor-lines').onscroll = function() {
      var id = this.id.replace('_laatu-js-editor-lines', '');
      laatuJsEditor.refreshCursorPosition(id);
      _h.obj(id+'_laatu-js-editor-line-numbers').scrollTop = this.scrollTop;
    }
  },
  _attachKeys: function(id) {
    document.body.onkeydown = function(evt) {
      switch (evt.keyCode) {
        case 16: laatuJsEditor.keyShiftDown = true;  break;
        case 18: laatuJsEditor.keyAltDown = true;    break;
        case 17: laatuJsEditor.keyCtrlDown = true;   break;
        default: break;
      }
    }
    document.body.onkeyup = function(evt) {
       switch (evt.keyCode) {
        case 16: laatuJsEditor.keyShiftDown = false; break;
        case 18: laatuJsEditor.keyAltDown = false;   break;
        case 17: laatuJsEditor.keyCtrlDown = false;  break;
        default: break;
      }
    }
    document.body.onkeypress = function(evt) {
      if (laatuJsEditor.keyAltDown || laatuJsEditor.keyCtrlDown)
        return null;

      if (evt.keyCode==37 || evt.keyCode==39 || evt.keyCode==38 || evt.keyCode==40 || evt.keyCode==8 || evt.keyCode==46 || evt.keyCode==13) {
        evt.preventDefault();
      }

      switch (evt.keyCode) {
        case 37: laatuJsEditor.moveCursorLeft();     break;
        case 39: laatuJsEditor.moveCursorRight();    break;
        case 38: laatuJsEditor.moveCursorUp();       break;
        case 40: laatuJsEditor.moveCursorDown();     break;
        case 8:  laatuJsEditor.removeCharLeft();     break;
        case 46: laatuJsEditor.removeCharRight();    break;
        case 13: laatuJsEditor.breakLine();          break;
        default: break;
      }
    }
    _h.obj(id+'_laatu-js-editor-cursor-input').onkeyup = function(evt) {
      var id = this.id.split('_')[0];
      var val = this.value;
      if (val != '') { 
        laatuJsEditor.insertChar(val, id);
      }
      this.value = '';
    }
  },
 
  init: function(id) {
    if (!_h.obj(id, 'Element with id ' + id + ' not found.'))
      return false;
    
    this.currentId = id;
    var textarea_obj = _h.obj(id);

    var textarea_coords = _h.coords(textarea_obj);
    var container_obj = this._createContainer(id, textarea_coords.l, textarea_coords.t);
    var line_numbers_obj = this._createLineNumbers(id, container_obj);
    this._createLines(id, textarea_obj, container_obj, line_numbers_obj);
    var char_obj = this._createChar(id);
    this._createCursor(id, char_obj);

    this._attachKeys(id);
    this._attachClick(id);
    this._attachScroll(id);
    this._attachResize(id);

    this.setCursorPosition(0,0);
  },

  setCursorPosition: function(row, col, id) {
    if (typeof(id) != 'string') {
      var id = laatuJsEditor.currentId;
    }
    var l1 = $('#'+id+'_laatu-js-editor-container').position().left;
    var t1 = $('#'+id+'_laatu-js-editor-container').position().top;
    var l2 = $('#'+id+'_laatu-js-editor-lines').position().left;
    var t2 = $('#'+id+'_laatu-js-editor-lines').position().top;
    var scroll = this.getScroll();
    var el_cursor = document.getElementById(id+'_laatu-js-editor-cursor');
    var el_char = document.getElementById(id+'_laatu-js-editor-char');
    var char_w = $(el_char).width(), char_h = $(el_char).height();
    el_cursor.style.zIndex=2000;
    el_cursor.style.position='absolute';
    el_cursor.style.left=(l1+l2+(col*char_w)-scroll.l)+'px';
    el_cursor.style.top=(t1+t2+(row*char_h)-scroll.t)+'px';
    el_cursor.col = col;
    el_cursor.row = row;
    document.getElementById(id+'_laatu-js-editor-cursor-input').focus();
  },
  refreshCursorPosition: function(id) {
    var el_cursor = document.getElementById(id+'_laatu-js-editor-cursor');
    this.setCursorPosition(el_cursor.row, el_cursor.col, id);
  },
  getCursorPosition: function(id) {
    if (typeof(id) != 'string') {
      var id = laatuJsEditor.currentId;
    }
    var el_cursor = document.getElementById(id+'_laatu-js-editor-cursor');
    var col = el_cursor.col;
    var row = el_cursor.row;
    return { c:col, r:row };
  },
  getScroll: function() {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    return { l:el_lines.scrollLeft, t:el_lines.scrollTop };
  },
 getLineColsCount: function(row) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    for (var i=0; i<el_lines.childNodes.length; i++) {
      if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        if (i == row) {

          return el_lines.childNodes[i].innerHTML.decodeHtml().length;
        }
      }
    }
    return null;
  },
  getLine: function(row) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    for (var i=0; i<el_lines.childNodes.length; i++) {
      if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        if (i == row) {

          return el_lines.childNodes[i].innerHTML.decodeHtml();
        }
      }
    }
    return null;
  },
  getRowsCount: function(row) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    return el_lines.childNodes.length;
  },
  replaceLine: function(row, content) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    for (var i=0; i<el_lines.childNodes.length; i++) {
      if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        if (i == row) {
          if (content == '') {
            content = ' ';
          }
          el_lines.childNodes[i].innerHTML = content.encodeHtml();
        }
      }
    }
  },
  insertLineAfter: function(row, content) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    var lines_cnt = el_lines.childNodes.length;
    for (var i=0; i<lines_cnt; i++) {
      if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        if (i == row) {
          if (content == '') {
            content = ' ';
          }
          var new_line = document.createElement('pre');
          new_line.innerHTML = content.encodeHtml();
          if (i == lines_cnt) {
            el_lines.appendChild(new_line);
          } else {
            el_lines.insertBefore(new_line, el_lines.childNodes[i+1]);
          }
        }
      }
    }
  },
  removeLine: function(row) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    var lines_cnt = el_lines.childNodes.length;
    for (var i=0; i<lines_cnt; i++) {
      if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        if (i == row) {
          el_lines.removeChild(el_lines.childNodes[i]);
          return true;
        }
      }
    }
  },
  addLineNumber: function() {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    var lines_cnt = el_lines.childNodes.length + this.lineNumberAddon;
    var el_line_numbers = document.getElementById(id+'_laatu-js-editor-line-numbers');
    el_line_numbers.innerHTML = el_line_numbers.innerHTML.replace('</pre>', "\n" + lines_cnt + '</pre>');
  },
  removeLineNumber: function() {
    var id = laatuJsEditor.currentId;
    var el_line_numbers = document.getElementById(id+'_laatu-js-editor-line-numbers');
    el_line_numbers.innerHTML = el_line_numbers.innerHTML.replace(/\n[0-9]+\<\/pre\>/, '</pre>');
  },
  moveCursorLeft: function() {
    var pos = this.getCursorPosition();
    if (pos.c > 0) {
      this.setCursorPosition(pos.r, pos.c-1);
    }
  },
  moveCursorRight: function(c) {
    if (typeof(c) != 'number') {
      var c = 1;
    }
    var pos = this.getCursorPosition();
    var line_cols = this.getLineColsCount(pos.r);
    if (pos.c < line_cols) {
      this.setCursorPosition(pos.r, pos.c+c);
    }
  },
  moveCursorUp: function() {
    var pos = this.getCursorPosition();
    if (pos.r > 0) {
      var prev_line_cols = this.getLineColsCount(pos.r - 1);
      if (prev_line_cols < pos.c) {
        var col = prev_line_cols;
      } else {
        var col = pos.c;
      }
      this.setCursorPosition(pos.r - 1, col);
    }
  },
  moveCursorDown: function() {
    var pos = this.getCursorPosition();
    var rows = this.getRowsCount();
    if (pos.r < (rows-1)) {
      var next_line_cols = this.getLineColsCount(pos.r + 1);
      if (next_line_cols < pos.c) {
        var col = next_line_cols;
      } else {
        var col = pos.c;
      }
      this.setCursorPosition(pos.r + 1, col);
    }
  },
  insertChar: function(c, id) {
    if (typeof(id) != 'string') {
      var id = laatuJsEditor.currentId;
    }
    var pos = this.getCursorPosition();
    var line = this.getLine(pos.r);
    var left = line.substring(0, pos.c);
    var right = line.substring(pos.c);
    this.replaceLine(pos.r, left + c + right);
    this.moveCursorRight(c.length);
  },
  removeChar: function(col) {
    var pos = this.getCursorPosition();
    var line = this.getLine(pos.r);
    var left = line.substring(0, col);
    var right = line.substring(col + 1);
    this.replaceLine(pos.r, left + right);
  },
  removeCharLeft: function() {
    var pos = this.getCursorPosition();
    if (pos.c > 0) {
      this.removeChar(pos.c - 1);
      this.moveCursorLeft();
    } else if (pos.c == 0 && pos.r > 0) {
      this.joinLineAbove();
    }
  },
  removeCharRight: function() {
    var pos = this.getCursorPosition();
    var line_cols = this.getLineColsCount(pos.r);
    if (pos.c < line_cols) {
      this.removeChar(pos.c);
    }
  },
  breakLine: function() {
    var pos = this.getCursorPosition();
    var line = this.getLine(pos.r);
    var left = line.substring(0, pos.c);
    var right = line.substring(pos.c);
    this.replaceLine(pos.r, left);
    this.insertLineAfter(pos.r, right);
    this.setCursorPosition(pos.r+1, 0);
    this.addLineNumber();
  },
  joinLineAbove: function(row) {
    var pos = this.getCursorPosition();
    var line = this.getLine(pos.r);
    var left = line.substring(0, pos.c);
    var right = line.substring(pos.c);
    var line_contents = this.getLine(pos.r - 1);
    var new_contents = line_contents+right;
    this.replaceLine(pos.r-1, new_contents);
    this.setCursorPosition(pos.r-1, line_contents.length);
    this.removeLine(pos.r);
    this.removeLineNumber();
  }
};

