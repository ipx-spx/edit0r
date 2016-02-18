// by Nicholas Gasior. (c) laatu.uk

var __entityMap = {
  "<": "&lt;",
  ">": "&gt;",
};

String.prototype.escapeHtml = function() {
  return String(this).replace(/[<>]/g, function (s) {
    return __entityMap[s];
  });
}
String.prototype.replaceHtml = function() {
  return String(this).replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>');
}

var laatuJsEditor = {
  currentId: '',
  keyShiftDown: false,
  keyAltDown: false,
  keyCtrlDown: false,
  lineNumberAddon: 100,
  init: function(id) {
    if (document.getElementById(id) === null) {
      console.log('Element with id ' + id + ' not found.');
      return false;
    }
    this.currentId = id;

    var el_textarea = document.getElementById(id);

    var l = $(el_textarea).position().left, t = $(el_textarea).position().top;
    var w = $(el_textarea).width(), h = $(el_textarea).height();

    var el_container = document.createElement('div');
    el_container.className = 'laatu-js-editor';
    el_container.style.position = 'absolute';
    el_container.style.left = l + 'px';
    el_container.style.top = t + 'px';
    el_container.id = id + '_laatu-js-editor-container';
    document.body.appendChild(el_container);    

    var el_line_numbers = document.createElement('div');
    el_line_numbers.className = 'laatu-js-editor-line-numbers';
    el_line_numbers.id = id + '_laatu-js-editor-line-numbers';
    el_container.appendChild(el_line_numbers);
    var el_line_numbers_w = $(el_line_numbers).width();

    var el_lines = document.createElement('div');
    el_lines.className = 'laatu-js-editor-lines';
    el_lines.id = id + '_laatu-js-editor-lines';
    var match = el_textarea.value.match(/\n/g);
    if (match !== null) {
      var cnt_lines = match.length + 1;
    } else {
      var cnt_lines = 1;
    }
    var arr_lines = el_textarea.value.replace(/\n\n/g, "\n \n").replace(/\n$/g, "\n ").split(/\n/);
    var line_numbers = '';
    var lines_content = '';
    for (var i=0; i<cnt_lines+this.lineNumberAddon; i++) {
      line_numbers = line_numbers + (line_numbers!=''?"\n":'') + (i+1);
    }
    for (var i=0; i<cnt_lines; i++) {
      if (arr_lines[i] == '') {
        arr_lines[i] = ' ';
      }
      lines_content = lines_content + '<pre>' + arr_lines[i].escapeHtml() + '</pre>';
    }
    el_lines.innerHTML = lines_content;
    el_line_numbers.innerHTML = '<pre>' + line_numbers + '</pre>';
    el_container.appendChild(el_lines);

    el_line_numbers.style.height = h+'px';
    el_lines.style.height = h+'px';
    el_lines.style.width = (w-el_line_numbers_w)+'px';

    this.createChar(id);
    this.createCursor(id);
    this.setCursorPosition(0,0);
    this.attachKeys(id);
    this.attachClick(id);
    this.attachScrollEvent(id);
    this.attachResizeEvent(id);
  },
  attachResizeEvent: function(id) {
    document.getElementById(id).onresize = function() {
      var el_textarea = this;
      var l = $(el_textarea).position().left, t = $(el_textarea).position().top;
      var w = $(el_textarea).width(), h = $(el_textarea).height();
      var el_line_numbers = document.getElementById(id+'_laatu-js-editor-line-numbers');
      var el_line_numbers_w = $(el_line_numbers).width();
      var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
      el_line_numbers.style.height = h+'px';
      el_lines.style.height = h+'px';
      el_lines.style.width = (w-el_line_numbers_w)+'px';
    }
  },
  createChar: function(id) {
    var el_char = document.createElement('span');
    el_char.className = 'laatu-js-editor-char';
    el_char.id = id + '_laatu-js-editor-char';
    el_char.innerHTML = '&nbsp;';
    document.body.appendChild(el_char);
  },
  createCursor: function(id) {
    var el_cursor = document.createElement('div');
    el_cursor.className = 'laatu-js-editor-cursor';
    el_cursor.id = id + '_laatu-js-editor-cursor';
    el_cursor.innerHTML = '<textarea rows="1" id="'+id+'_laatu-js-editor-cursor-input"></textarea>';
    var el_char = document.getElementById(id+'_laatu-js-editor-char');
    var char_h = $(el_char).height();
    el_cursor.style.height = char_h+'px';
    document.body.appendChild(el_cursor);
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
  attachKeys: function(id) {
    document.body.onkeydown = function(evt) {
      switch (evt.keyCode) {
        case 16:
          laatuJsEditor.keyShiftDown = true;
          break;
        case 18:
          laatuJsEditor.keyAltDown = true;
          break;
        case 17:
          laatuJsEditor.keyCtrlDown = true;
          break;
        default:
          break;
      }
    }
    document.body.onkeyup = function(evt) {
       switch (evt.keyCode) {
        case 16:
          laatuJsEditor.keyShiftDown = false;
          break;
        case 18:
          laatuJsEditor.keyAltDown = false;
          break;
        case 17:
          laatuJsEditor.keyCtrlDown = false;
          break;
        default:
          break;
      }
    }
    document.body.onkeypress = function(evt) {
      if (laatuJsEditor.keyAltDown || laatuJsEditor.keyCtrlDown)
        return null;

      if (evt.keyCode==37 || evt.keyCode==39 || evt.keyCode==38 || evt.keyCode==40 || evt.keyCode==8 || evt.keyCode==46 || evt.keyCode==13) {
        evt.preventDefault();
      }

      switch (evt.keyCode) {
        case 37: laatuJsEditor.moveCursorLeft(); break;
        case 39: laatuJsEditor.moveCursorRight(); break;
        case 38: laatuJsEditor.moveCursorUp(); break;
        case 40: laatuJsEditor.moveCursorDown(); break;
        case 8:  laatuJsEditor.removeCharLeft(); break;
        case 46: laatuJsEditor.removeCharRight(); break;
        case 13: laatuJsEditor.breakLine(); break;
        default: 
          break;
      }
    }
    document.getElementById(id+'_laatu-js-editor-cursor-input').onkeyup = function(evt) {
      var id = this.id.split('_')[0];
      var val = this.value;
      if (val != '') { 
        laatuJsEditor.insertChar(val, id);
      }
      this.value = '';
    }
  },
  attachClick: function(id) {
    document.getElementById(id+'_laatu-js-editor-lines').onclick = function() {
      var id = this.id.split('_')[0];
      document.getElementById(id+'_laatu-js-editor-cursor-input').focus();
    }
  },
  attachScrollEvent: function(id) {
    document.getElementById(id+'_laatu-js-editor-lines').onscroll = function() {
      var id = this.id.replace('_laatu-js-editor-lines', '');
      laatuJsEditor.refreshCursorPosition(id);
      document.getElementById(id+'_laatu-js-editor-line-numbers').scrollTop = this.scrollTop;
    }
  },
  getLineColsCount: function(row) {
    var id = laatuJsEditor.currentId;
    var el_lines = document.getElementById(id+'_laatu-js-editor-lines');
    for (var i=0; i<el_lines.childNodes.length; i++) {
      if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
        if (i == row) {

          return el_lines.childNodes[i].innerHTML.replaceHtml().length;
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

          return el_lines.childNodes[i].innerHTML.replaceHtml();
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
          el_lines.childNodes[i].innerHTML = content.escapeHtml();
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
          new_line.innerHTML = content.escapeHtml();
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

