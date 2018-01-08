/*
jsnotepad, version 3.0.0

Copyright (c) 2016, 2017, 2018, Nicholas Gasior <nmls@laatu.se>
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

var jsNotepad = (function() {
/* Suffixes for ids of elements */
  var _id_            = '_jsnotepad-';
  var _id_cont        = _id_+'container';
  var _id_lnnums      = _id_+'lnnums';
  var _id_lns         = _id_+'lns';
  var _id_sel         = _id_+'selection';
  var _id_char        = _id_+'char';
  var _id_cursor      = _id_+'cursor';
  var _id_cursorinput = _id_+'cursorinput';
  var _id_blur        = _id_+'blur';
/* Class names */
  var cls_       = "jsnotepad-";
  var cls_cont   = "jsnotepad";
  var cls_lnnums = cls_+"line-numbers";
  var cls_lns    = cls_+"lines";
  var cls_sel    = cls_+"selection-lines";
  var cls_char   = cls_+"char";
  var cls_cursor = cls_+"cursor";
  var cls_blur   = cls_+"blur";
/* We need numbers of line to be visible till the bottom of the container, even
if there are actually less lines. Therefore below number is added to get that
done. */
  var extraLines = 100;
/* Keycodes */
  var ALT = 18;
  var CTRL = 17;
  var SHIFT = 16;
  var ENTER = 13;
  var SPACE = 32;
  var DELETE = 46;
  var END = 35;
  var HOME = 36;
  var DOWN = 40;
  var UP = 38;
  var LEFT = 37;
  var RIGHT = 39;
  var BACKSPACE = 8;
  var TAB = 9;
  var PAGEUP = 33;
  var PAGEDOWN = 34;
  var C = 67;
  var K = 75;
  var V = 86;
/* Ids of all jsNotepad instances on the page (with some details). See creating
   instance function. */
  var instances = {};
/* Marks whether handlers for events on are already added */
  var keysAttached = false;
/* Marks if blur and focus events on window are handled */
  var windowBlurFocusAttached = false;
/* Helpers */
  function _pre(s) {
    return '<pre>'+jsHelper.encHtml(s)+'</pre>';
  }
  function _nuDiv(c, i) {
    return jsHelper.nu('div', {className: c, id: i});
  }
  function _nuDivPosAbsLeft0Top0(c, i) {
    return jsHelper.nu('div', {className: c, id: i, style: {position:'absolute',
             left: '0px', top: '0px' }});
  }

  function _addInstance(id, active, mode, input) {
    instances[id] = {
      'active': (typeof(active) == 'undefined' ? false : status),
      'mode': (typeof(mode) == 'undefined' ? 'edit' : mode),
      'input': (typeof(input) == 'undefined' ? 'default' : input),
      'keysAttached': false,
      'scrollAttached': false,
      'mouseAttached': false,
      'cursorPosition': [0, 0],
      'selection': [-1,-1,-1,-1],
      'clipboards': []
    };
  }

  function _addInstanceCursorPosition(id, line, col) {
    instances[id]['cursorPosition'] = [line, col];
  }

  function _listInstances() {
    return instances;
  }
/* Creates container element in an absolute position. */
  function _createContainer(t_id) {
    var id = t_id+_id_cont;
    if (jsHelper(id).length() == 1)
      return jsHelper.elById(id);
    var c = _nuDivPosAbsLeft0Top0(cls_cont, id);
    var textarea_pos = jsHelper(t_id).pos();
    jsHelper(c).style('overflow', 'hidden').style('width', textarea_pos.w+'px')
                                          .style('height', textarea_pos.h+'px');
    var par = jsHelper(t_id).parent().style('position', 'relative').append(c);
    return c;
  };

/* Creates element containing line numbers in position related to container. */
  function _createLineNumbers(t_id) {
    var id = t_id+_id_lnnums;
    var h = jsHelper(t_id).pos().h;
    if (jsHelper(id).length() < 1) {
      var l = _nuDivPosAbsLeft0Top0(cls_lnnums, id);
      jsHelper(t_id+_id_cont).append(l);
    } else {
      var l = jsHelper.elById(id);
    }
    jsHelper(id).style('height', h+'px');
    return l;
  };

/* Creates element for every single line. */
  function _createLines(t_id) {
    var id = t_id+_id_lns, id_nums = t_id+_id_lnnums;
    if (jsHelper(id).length() < 1) {
      var lns_obj = _nuDiv(cls_lns, id);
    /* Calculate number of lines by splitting the text with \n */
      var match = jsHelper(t_id).val().match(/\n/g),
        cnt_lns = (match !== null ? match.length+1 : 1),
        arr_lns = jsHelper(t_id).val().split(/\n/), ln_nums  = '', lns_html = '';
    /* Generate preformatted element for every line. */
      for (var i=0; i<cnt_lns; i++) {
        lns_html = lns_html+_pre(jsHelper.encHtml(arr_lns[i])+' ');
      }
      jsHelper(lns_obj).html(lns_html);
    /* Overwrite the scroll to 0, just in case browser caches something */
      lns_obj.scrollTop = 0; lns_obj.scrollLeft = 0;
    /* Add lines object to the container*/
      jsHelper(t_id+_id_cont).append(lns_obj);

    /* Generate line numbers. */
      for (var i=0; i<cnt_lns+extraLines; i++) {
        ln_nums = ln_nums+(ln_nums!=''?"\n":'')+_pre((i+1).toString());
      }
      jsHelper(id_nums).html(ln_nums);
    /* Attach focus on the input once lines are clicked */
      jsHelper(id).on('click', function(e) {
        var id = this.id.split('_')[0];
        jsHelper.elById(id+_id_cursorinput).focus();
      });
    } else {
      var lns_obj = jsHelper.elById(id);
    }

    /* Set position and size of lines element */
    var ln_nums_pos = jsHelper(id_nums).pos();
    var t_pos = jsHelper(t_id).pos();
    jsHelper(lns_obj).style('height', t_pos.h+'px')
      .style('width', (t_pos.w-ln_nums_pos.w)+'px').style('position','absolute')
      .style('top', '0px').style('left', ln_nums_pos.w+'px');
    return lns_obj;
  };

/* Creates element that will visualize selection. */
  function _createSelectionLines(t_id) {
    var id = t_id+_id_sel;
    if (jsHelper(id).length() < 1) {
      var sel_obj = _nuDiv(cls_sel, id);
      var cnt_lns = jsHelper(t_id+_id_lns).children('pre').length();
      var h = '';
      for (var i=0; i<cnt_lns; i++) {
        h = h+_pre(' ');
      }
      jsHelper(sel_obj).html(h);
      jsHelper(t_id+_id_cont).append(sel_obj);
    } else {
      var sel_obj = jsHelper.elById(id);
    }

    /* Set position and size of selection element */
    var lns_pos = jsHelper(t_id+_id_lns).pos();
    jsHelper(sel_obj).style('height', lns_pos.h+'px')
      .style('width', lns_pos.w+'px').style('position','absolute')
      .style('top', '0px').style('left', lns_pos.l+'px');
    return sel_obj;
  };

/* Creates char element. */
  function _createChar(t_id) {
    var id = t_id + _id_char;
    if (jsHelper(id).length() < 1) {
      var char_obj = jsHelper.nu('span', { className:cls_char, id:id,
                                                        innerHTML: '&nbsp;' });
      jsHelper(t_id+_id_cont).append(char_obj);
    } else {
      var char_obj = jsHelper.elById(id);
    }
    return char_obj;
  };

/* Creates element that will be the cursor. */
  function _createCursor(t_id) {
    var id = t_id+_id_cursor;
    if (jsHelper(id).length() < 1) {
      var char_coords = jsHelper(t_id+_id_char).pos();
      var cursor_obj = jsHelper.nu('div',{ className:cls_cursor, 
        id: t_id+_id_cursor, style: { height: char_coords.h+'px' }, 
        innerHTML: '<textarea rows="1" id="'+t_id+_id_cursorinput+'"'
                 + 'readonly="readonly"></textarea>' });
      jsHelper(t_id+_id_cont).append(cursor_obj);
    }
    var line = instances[t_id]['cursorPosition'][0],
        col = instances[t_id]['cursorPosition'][1];
    var lns_pos = jsHelper(t_id+_id_lns).pos();
    var char_pos = jsHelper(t_id+_id_char).pos();
    var scroll = _getScroll(t_id);
    var l = lns_pos.l + (col*char_pos.w) - scroll.l;
    var t = lns_pos.t + (line*char_pos.h) - scroll.t; 
    jsHelper(id).style('position', 'absolute')
      .style('left', l+'px').style('top', t+'px');
    jsHelper.elById(t_id+_id_cursorinput).focus();
    return jsHelper.elById(id);
  };

/* Creates a layer on top of editor to handle blurring and focusing */
  function _createBlur(t_id) {
    var id = t_id+_id_blur;
    var pos = jsHelper(t_id).pos();
    var wasCreation = false;
    if (jsHelper(id).length() < 1) {
      var b = _nuDivPosAbsLeft0Top0(cls_blur, id);
      var par = jsHelper(t_id).parent().style('position', 'relative').append(b);
      jsHelper(id).style('zIndex', 5000);
      wasCreation = true;
    }
    jsHelper(id).style('width', pos.w+'px').style('height', pos.h+'px');
    if (wasCreation) {
      jsHelper(id).on('click', function() {
        jsNotepad.cmd('', 'set-all-inactive');
        jsNotepad.cmd(t_id, 'set-active');
      });
    }
  }

/* Activates jsnotepad instance */
  function _setActive(id) {
    jsHelper(id+_id_blur).style('display', 'none');
    jsHelper(id+_id_cursorinput).attr('readonly', null);
    jsHelper.elById(id+_id_cursorinput).focus();
    instances[id]['active'] = true;
    return true;
  }

/* Deactivates jsnotepad instance */
  function _setInactive(id) {
    jsHelper(id+_id_blur).style('display', 'block');
    instances[id]['active'] = false;
    return true;
  }

/* Sets all jsnotepad instances inactive */
  function _setAllInactive() {
    for (o in instances) {
      _setInactive(o);
    }
    return true;
  }

/* Handle window blur and focus */
  function _attachWindowBlurFocus() {
    jsHelper(window).on('blur', function(evt) {
      jsNotepad.cmd('', 'set-all-inactive');
    }).on('focus', function(evt) {
      jsNotepad.cmd('', 'set-all-inactive');
    });
  }

/* Attach all key events */
  function _attachKeys() {
    jsHelper(window).on('keypress', function(evt) {
      var f=false;
      for (i in instances) {
        if (instances[i]['active'])
          f=true;
      }
      if (!f)
        return null;
    
    /* Keys with ctrl and alt down */
      if (evt.altKey && evt.ctrlKey) {
        switch (evt.key) {
          case 'k': 
            _cmdOnAllActive('remove-line');
            return true;
            break;
          default: return null; break;
        }
      } else if (evt.altKey || evt.ctrlKey)
        return null;
      
      if (evt.keyCode == UP || evt.keyCode == DOWN || evt.keyCode == LEFT ||
          evt.keyCode == RIGHT || evt.keyCode == DELETE || evt.keyCode == END ||
          evt.keyCode == ENTER || evt.keyCode == HOME || evt.keyCode == TAB ||
          evt.keyCode == PAGEUP || evt.keyCode == PAGEDOWN) {
          evt.preventDefault();
      }

    /* Keys without shift down */
      if (!evt.shiftKey) {
        switch (evt.keyCode) {
          case BACKSPACE: 
            _cmdOnAllActive('remove-left-char'); 
            return true;
            break;
          case DELETE: 
            _cmdOnAllActive('remove-right-char');
            return true;
            break;
          default: return null; break;
        }
      }

    /* Basic cursor moves */
      switch (evt.keyCode) {
        case LEFT:
          _cmdOnAllActive('move-cursor-left', {'select': evt.shiftKey});
          break;
        case RIGHT:
          _cmdOnAllActive('move-cursor-right', {'cnt': 1,
                                                    'select': evt.shiftKey});
          break;
        case UP:
          _cmdOnAllActive('move-cursor-up', {'select': evt.shiftKey});
          break;
        case DOWN:
          _cmdOnAllActive('move-cursor-down', {'select': evt.shiftKey});
          break;
        case HOME:
          _cmdOnAllActive('move-cursor-home', {'select': evt.shiftKey});
          break;
        case END:
          _cmdOnAllActive('move-cursor-end', {'select': evt.shiftKey});
          break;
        case PAGEUP:
          _cmdOnAllActive('move-cursor-page-up', {'select': evt.shiftKey});
          break;
        case PAGEDOWN: 
          _cmdOnAllActive('move-cursor-page-down', {'select': evt.shiftKey});
          break;
        case ENTER:
          _cmdOnAllActive('new-line');
          break;
        default: break;
      }
    });
    keysAttached = true;
    return true;
  };

  function _attachInstanceKeys(t_id) {
    jsHelper(t_id+_id_cursorinput).on('keyup', function(evt) {
      var id = this.id.split('_')[0];
      var val = this.value;
      if (val != '') {
        jsNotepad.cmd(id, 'insert-text', {'text': val});
      }
      this.value = '';
    });
    instances[t_id]['keysAttached'] = true;
    return true;
  }
  
  function _attachInstanceScroll(t_id) {
    jsHelper(t_id+_id_lns).on('scroll', function() {
      var id = this.id.split('_')[0];
      // @scope?
      _createCursor(id);
      jsHelper.elById(id+_id_lnnums).scrollTop = this.scrollTop;
    });
    instances[t_id]['scrollAttached'] = true;
    return true;
  }
  
  function _attachInstanceMouse(t_id) {
    jsHelper(t_id+_id_cont).on('selectstart', function(e) {
      e.preventDefault();
      return false;
    });
    instances[t_id]['mouseAttached'] = true;
    return true;
  }

  function _getScroll(id) {
    var lns = jsHelper.elById(id+_id_lns);
    return { l: lns.scrollLeft, t: lns.scrollTop };
  }

  function _getLinesCount(id) {
    return jsHelper(id+_id_lns).children().filterTag('pre').length();
  }
  
  function _getPageLinesCount(id) {
    var char_pos = jsHelper(id+_id_char).pos();
    var lns_pos = jsHelper(id+_id_lns).pos();
    return Math.floor(lns_pos.h/char_pos.h);
  }
  
  function _getLineColsCount(id, line) {
    var h = jsHelper(id+_id_lns).children().filterTag('pre').nth(line+1).html();
    h = h.replace(/<span[a-zA-Z0-9 ="_\-]*>/g,'').replace(/<\/span>/g,'');
    h = jsHelper.decHtml(h);
  /* There's extra space at the end */
    return h.length-1;
  }

  function _setCursorPosition(id, line, col) {
    if (typeof(line) != 'number' || typeof(col) != 'number')
      return false;
    if (!line.toString().match(/^[0-9]+$/) || !col.toString().match(/^[0-9]+$/))
      return false;
    var lines = _getLinesCount(id);
    if (line >= lines)
      return false;
    var cols = _getLineColsCount(id, line);
    if (col > cols)
      return false;
    _addInstanceCursorPosition(id, line, col);
    _createCursor(id);
  }

  function _getCursorPosition(id) {
    return { 'line': instances[id]['cursorPosition'][0],
                                    'col': instances[id]['cursorPosition'][1] }
  }
  
  function _getSelection(id) {
    return { 'beginline': instances[id]['selection'][0],
             'begincol': instances[id]['selection'][1],
             'endline': instances[id]['selection'][2],
             'endcol': instances[id]['selection'][3] };
  }

  function _setSelection(id, bl, bc, el, ec) {
    instances[id]['selection'] = [bl, bc, el, ec];
    return true;
  }
  
  function _moveCursorUp(id, _, sel) {
    var pos = _getCursorPosition(id);
    if (pos.line > 0) {
      var col = _maxLineCol(id, pos.line-1, pos.col);
      _setCursorPosition(id, pos.line-1, col);
      if (sel) {
        var cur_sel = _getSelection(id);
        
      }
      _scrollIfCursorNotVisible(id);
    }
  }

  function _moveCursorDown(id, _, sel) {
    var pos = _getCursorPosition(id);
    var lines = _getLinesCount(id); 
    if (pos.line < (lines-1)) {
      var col = _maxLineCol(id, pos.line+1, pos.col);
      var next_line_cols = _getLineColsCount(id, pos.line + 1);
      _setCursorPosition(id, pos.line + 1, col);
      _scrollIfCursorNotVisible(id);
    }
  }

  function _moveCursorLeft(id, _, sel) {
    var pos = _getCursorPosition(id);
    if (pos.col > 0) {
      _setCursorPosition(id, pos.line, pos.col-1);
      _scrollIfCursorNotVisible(id);
    }
  }

  function _moveCursorRight(id, cnt, sel) {
    if (typeof(cnt) != 'number') {
      cnt = 1;
    }
    var pos = _getCursorPosition(id);
    var line_cols = _getLineColsCount(id, pos.line);
    if (pos.col+cnt <= line_cols) {
      _setCursorPosition(id, pos.line, pos.col+cnt);
      _scrollIfCursorNotVisible(id);
    }
  }
  
  function _moveCursorHome(id, sel) {
    var pos = _getCursorPosition(id);
    _setCursorPosition(id, pos.line, 0);
    _scrollIfCursorNotVisible(id);
  }
  
  function _moveCursorEnd(id, sel) {
    var pos = _getCursorPosition(id);
    var line_cols = _getLineColsCount(id, pos.line);
    _setCursorPosition(id, pos.line, line_cols);
    _scrollIfCursorNotVisible(id);
  }
  
  function _moveCursorPageUp(id, sel) {
    var pos = _getCursorPosition(id);
    var page_lines = _getPageLinesCount(id);
    var line = _minFirstLine(id, pos.line - page_lines + 1);
    var col = _maxLineCol(id, line, pos.col);
    _setCursorPosition(id, line, col);
    _scrollIfCursorNotVisible(id);
  }
  
  function _moveCursorPageDown(id, sel) {
    var pos = _getCursorPosition(id);
    var page_lines = _getPageLinesCount(id);
    var line = _maxLastLine(id, pos.line + page_lines - 1);
    var col = _maxLineCol(id, line, pos.col);
    _setCursorPosition(id, line, col);
    _scrollIfCursorNotVisible(id);
  }
  
  function _removeLeftChar(id) {
    var pos = _getCursorPosition(id);
    if (pos.col > 0) {
      _removeChar(id, pos.line, pos.col - 1);
      _moveCursorLeft(id);
    } else if (pos.col == 0 && pos.line > 0) {
      var cols = _getLineColsCount(id, pos.line-1);
      _pasteLine(id, pos.line-1, _getLineColsCount(id, pos.line-1), pos.line);
      _setCursorPosition(id, pos.line-1, cols);
      _removeLine(id, pos.line);
    }
  }
  
  function _removeRightChar(id) {
    var pos = _getCursorPosition(id);
    var line_cols = _getLineColsCount(id, pos.line);
    var lines = _getLinesCount(id);
    if (pos.col < line_cols) {
      _removeChar(id, pos.line, pos.col);
    } else if (pos.line < lines-1 && pos.col == line_cols) {
      _pasteLine(id, pos.line, pos.col, pos.line+1);
      _removeLine(id, pos.line+1);
    }
  }
  
  function _removeChar(id, line, col) {
    var line_val = _getLine(id, line);
    var left = line_val.substring(0, col);
    var right = line_val.substring(col + 1);
    _replaceLine(id, line, left + right);
  }
  
  function _getLine(id, line) {
    var h = jsHelper(id+_id_lns).children().filterTag('pre').nth(line+1).html();
    h = h.replace(/<span[a-zA-Z0-9 ="_\-]*>/g,'').replace(/<\/span>/g,'');
  /* There's extra space at the end */
    h = jsHelper.decHtml(h).replace(/ $/, '');
    return h;
  }
  
  function _replaceLine(id, line, val) { 
    var h = jsHelper.encHtml(val)+' ';
    jsHelper(id+_id_lns).children().filterTag('pre').nth(line+1).html(h);
    return true;
  }
  
  function _pasteLine(id, tgt_line, tgt_col, paste_line) {
    var paste_line_val = _getLine(id, paste_line);
    var line_val = _getLine(id, tgt_line);
    var left = line_val.substring(0, tgt_col);
    var right = line_val.substring(tgt_col + 1);
    _replaceLine(id, tgt_line, left + paste_line_val + right);
  }
  
  function _removeLine(id, line) {
    var lns_cnt = _getLinesCount(id);
    if (lns_cnt > 1) {
      jsHelper(id+_id_lns).children().filterTag('pre').nth(line+1).rm();
    /* When last line is removed, cursor needs to be moved up */
      var pos = _getCursorPosition(id);
      if (pos.line > lns_cnt-2) {
        _setCursorPosition(id, lns_cnt-2, 0);
      }
    } else if (line == 0) {
      _replaceLine(id, line, '');
    }
  }
  
  function _removeCurLine(id) {
    var pos = _getCursorPosition(id);
    _removeLine(id, pos.line); 
  }
  
  function _minFirstLine(id, line) {
    if (line < 0) {
      line = 0;
    }
    return line;
  }
  
  function _maxLastLine(id, line) {
    var lines = _getLinesCount(id);
    if (line > (lines-1)) {
      line = lines-1;
    }
    return line;
  }
  
  function _maxLineCol(id, line, col) {
    var line_cols = _getLineColsCount(id, line);
    if (line_cols < col) {
      col = line_cols;
    }
    return col;
  }
  
  function _scrollIfCursorNotVisible(id) {
    var cont_pos = jsHelper(id+_id_cont).pos();
    var lns_scroll = _getScroll(id);
    var cur_pos = jsHelper(id+_id_cursor).pos();
    var char_pos = jsHelper(id+_id_char).pos();
    
    var diff_h = cur_pos.l - cont_pos.w;
    var lnnums_pos = jsHelper(id+_id_lnnums).pos();
    if (diff_h+(3*char_pos.w)>0) {
      jsHelper.elById(id+_id_lns).scrollLeft 
                = jsHelper.elById(id+_id_lns).scrollLeft+diff_h+(2*char_pos.w);
    }
    if (diff_h < 0) {
      diff_h = -1*diff_h;
      if (diff_h+lnnums_pos.w > cont_pos.w) {
        var minus = (diff_h-cont_pos.w+lnnums_pos.w+(2*char_pos.w));
        jsHelper.elById(id+_id_lns).scrollLeft -= minus;
      }
    }
    
    var diff_v = cur_pos.t - cont_pos.h;
    if (diff_v+(3*char_pos.h)>0) {
      jsHelper.elById(id+_id_lns).scrollTop 
                = jsHelper.elById(id+_id_lns).scrollTop+diff_v+(2*char_pos.h);
    }
    if (diff_v < 0) {
      diff_v = -1*diff_v;
      if (diff_v > cont_pos.h) {
        var minus = (diff_v-cont_pos.h);
        jsHelper.elById(id+_id_lns).scrollTop -= minus;
      }
    }
  }
  
  function _insertLine(id, line, val) {
    var lines_cnt = _getLinesCount(id);
    if (line == lines_cnt) {
      var new_line = jsHelper.nu('pre');
      jsHelper(new_line).html(jsHelper.encHtml(val)+' ');
      jsHelper(id+_id_lns).append(new_line);
    } else {
      jsHelper(id+_id_lns).children().filterTag('pre').nth(line+1).func(
        function(el) {
          var new_line = jsHelper.nu('pre');
          jsHelper(new_line).html(jsHelper.encHtml(val)+' ');
          el.parentNode.insertBefore(new_line, el);
        }
      );
    }
  }
  
  function _insertNewLine(id) {
    var pos = _getCursorPosition(id);
    var line = _getLine(id, pos.line);
    var left = line.substring(0, pos.col);
    var right = line.substring(pos.col);
    _replaceLine(id, pos.line, left);
    _insertLine(id, pos.line+1, right);
    _moveCursorDown(id);
    _moveCursorHome(id);
    _addLineNumber(id);
  }
  
  function _addLineNumber(id) {
    var n = jsHelper(id+_id_lnnums).children('pre').length();
    n++;
    var pre = jsHelper.nu('pre');
    jsHelper(pre).html(n.toString());
    jsHelper(id+_id_lnnums).append(pre);
  }

  function _insertText(id, t) {
    var match = t.match(/\n/g);
    if (match !== null) {
        var cnt_lines = match.length + 1;
    } else {
        var cnt_lines = 1;
    }
    if (cnt_lines == 1)
      return _insertChars(id, t);
      
    var arr_lines = t.split(/\n/);
    var pos   = _getCursorPosition(id);
    var line  = _getLine(id, pos.line);
    var left  = line.substring(0, pos.col);
    var right = line.substring(pos.col);
    _replaceLine(id, pos.line, left + arr_lines[0]);
    _moveCursorRight(id, arr_lines[0].length);
    for (var i=1; i<cnt_lines; i++) {
      if (i == cnt_lines-1) {
        _insertLine(id, pos.line+i, arr_lines[i] + right);
      } else {
        _insertLine(id, pos.line+i, arr_lines[i]);
      }
    }
    _setCursorPosition(id, pos.line+cnt_lines-1, arr_lines[cnt_lines-1].length);
  }

  function _insertChars(id, t) {
    var pos = _getCursorPosition(id);
    var line = _getLine(id, pos.line);
    var left = line.substring(0, pos.col);
    var right = line.substring(pos.col);
    _replaceLine(id, pos.line, left + t + right);
    _moveCursorRight(id, t.length);
  }

/* Main initialization method. */
  function _init(id, o) {
    if (!jsHelper.elById(id)) {
      console.log('Element with id '+id+' not found.');
      return false;
    }
    _addInstance(id);
    var t = jsHelper.elById(id);
    _addInstanceCursorPosition(id, 0, 0);
    _createContainer(id);
    _createLineNumbers(id);
    _createLines(id);
    _createSelectionLines(id);
    _createChar(id);
    _createCursor(id);
    _createBlur(id);

    if (!windowBlurFocusAttached) {
      _attachWindowBlurFocus();
    }
    if (!keysAttached) {
      _attachKeys();
    }
    if (!instances[id]['keysAttached']) {
      _attachInstanceKeys(id);
    }
    if (!instances[id]['scrollAttached']) {
      _attachInstanceScroll(id);
    }
    if (!instances[id]['mouseAttached']) {
      _attachInstanceMouse(id);
    }
    /* @todo Implement later_attachResize(id); */
  };

  function _cmdOnAllActive(cmd, opts) {
    for (i in instances) {
      if (instances[i]['active']) {
        if (typeof(opts) == 'undefined') {
          opts = {};
        }
        opts['ignoreCheck'] = 1;
        jsNotepad.cmd(i, cmd, opts);
      }
    }
  }

  function cmd(id, cmd, opts) {
    switch (cmd) {
      case 'init': _init(id, opts); break;
      case 'list-instances': return _listInstances(); break;
      case 'set-all-inactive': return _setAllInactive(); break;
      default: break;
    }
    if (typeof(opts)=='object' && typeof(opts['ignoreCheck'])!='undefined') {
    } else { 
      var f=false;
      for (i in instances) {
        if (i == id) {
          f = true;
        }
      }
      if (!f) {
        console.log('Invalid id');
        return false;
      }
    }
    switch (cmd) {
      case 'set-active': return _setActive(id); break;
      case 'set-inactive': return _setInactive(id); break;
      case 'set-cursor-position': 
        _setCursorPosition(id, opts['line'], opts['col']); 
        break;
      case 'move-cursor-up': 
        _moveCursorUp(id, null, opts['select']);
        break;
      case 'move-cursor-down': 
        _moveCursorDown(id, null, opts['select']);
        break;
      case 'move-cursor-right':
        _moveCursorRight(id, opts['cnt'], opts['select']);
        break;
      case 'move-cursor-left':
        _moveCursorLeft(id, null, opts['select']);
        break;
      case 'move-cursor-end':
        _moveCursorEnd(id, opts['select']);
        break;
      case 'move-cursor-home':
        _moveCursorHome(id, opts['select']);
        break;
      case 'move-cursor-page-up':
        _moveCursorPageUp(id, opts['select']);
        break;
      case 'move-cursor-page-down':
        _moveCursorPageDown(id, opts['select']);
        break;
      case 'remove-left-char': _removeLeftChar(id); break;
      case 'remove-right-char': _removeRightChar(id); break;
      case 'remove-line': _removeCurLine(id); break;
      case 'new-line': _insertNewLine(id); break;
      case 'insert-text': _insertText(id, opts['text']); break;
    }
    return true;
  }
 
  return {
    cmd: cmd
  };

})();

jshEl.prototype.notepad = function(cmd, opts) {
  this.func(function(el) {
    if ($(el).attr('id') === null) {
      $(el).attr('id', $.uid());
    }
    jsHelper.notepad('#'+$(el).attr('id'), cmd, opts);
  });
}

jsHelper.notepad = function(src, cmd, opts) {
  if (src[0] == '#' && src.length > 1) {
    var id = src.substring(1);
    if (jsHelper(id).length() != 1) {
      console.log('jsnotepad cannot be initialized - id does not exist');
      return false;
    }
    jsNotepad.cmd(id, cmd, opts);
  }
};

if (typeof(JSHELPER_COMPATIBLE) == "undefined") {
  $.notepad = function(src, cmd, opts) { jsHelper.notepad(src, cmd, opts); };
}
