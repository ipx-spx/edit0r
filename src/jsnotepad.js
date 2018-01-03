/*
jsnotepad, version 2.1.0

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

var jsNotepad2 = (function() {
/* Suffixes for ids of elements */
  var _id_            = '_jsnotepad-';
  var _id_cont        = _id_+'container';
  var _id_lnnums      = _id_+'lnnums';
  var _id_lns         = _id_+'lns';
  var _id_char        = _id_+'char';
  var _id_cursor      = _id_+'cursor';
  var _id_cursorinput = _id_+'cursorinput';
  var _id_blur        = _id_+'blur';
/* Class names */
  var cls_       = "jsnotepad-";
  var cls_cont   = "jsnotepad";
  var cls_lnnums = cls_+"line-numbers";
  var cls_lns    = cls_+"lines";
  var cls_char   = cls_+"char";
  var cls_cursor = cls_+"cursor";
  var cls_blur   = cls_+"blur";
/* We need numbers of line to be visible till the bottom of the container, even
if there are actually less lines. Therefore below number is added to get that
done. */
  var extraLines = 100;
/* Storing information about shift, alt and ctrl keys being down. */
  var keyShiftDown = false;
  var keyAltDown   = false;
  var keyCtrlDown  = false;
/* Keycodes */
  var ALT = 16;
  var CTRL = 17;
  var SHIFT = 18;
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
/* Ids of all jsNotepad instances on the page */
  var instances = {};
/* Marks whether handlers for events on are already added */
  var keysAttached = false;
  var instanceKeysAttached = {};
  var instanceScrollAttached = {};
/* Cursor position */
  var instanceCursors = {};
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
/* Adds id to list of all jsNotepad instances */
  function _addInstance(id, status) {
    instances[id]=(typeof(status) == 'undefined'?0:1);
  }
/* Add cursor position for instance */
  function _addInstanceCursorPosition(id, row, col) {
    instanceCursors[id] = {'row':row, 'col':col};
  }
/* Returns list of instance ids */
  function _listInstances() {
    return instances;
  }
/* Creates container element in an absolute position. */
  function _createContainer(o) {
    var id = o.id+_id_cont;
    if (jsHelper(id).length() == 1)
      return jsHelper.elById(id);
    var c = _nuDivPosAbsLeft0Top0(cls_cont, id);
    var textarea_pos = jsHelper(o.id).pos();
    jsHelper(c).style('overflow', 'hidden').style('width', textarea_pos.w+'px')
                                          .style('height', textarea_pos.h+'px');
    var par = jsHelper(o).parent().style('position', 'relative').append(c);
    return c;
  };

/* Creates element containing line numbers in position related to container. */
  function _createLineNumbers(o) {
    var id = o.id+_id_lnnums;
    var h = jsHelper(o).pos().h;
    if (jsHelper(id).length() < 1) {
      var l = _nuDivPosAbsLeft0Top0(cls_lnnums, id);
      jsHelper(o.id+_id_cont).append(l);
    } else {
      var l = jsHelper.elById(id);
    }
    jsHelper(id).style('height', h+'px');
    return l;
  };

/* Creates element for every single line. */
  function _createLines(o) {
    var id = o.id+_id_lns, id_nums = o.id+_id_lnnums;
    if (jsHelper(id).length() < 1) {
      var lns_obj = _nuDiv(cls_lns, id);
    /* Calculate number of lines by splitting the text with \n */
      var match = jsHelper(o).val().match(/\n/g),
        cnt_lns = (match !== null ? match.length+1 : 1),
        arr_lns = jsHelper(o).val().split(/\n/), ln_nums  = '', lns_html = '';
    /* Generate preformatted element for every line. */
      for (var i=0; i<cnt_lns; i++) {
        lns_html = lns_html+_pre(jsHelper.encHtml(arr_lns[i])+' ');
      }
      jsHelper(lns_obj).html(lns_html);
    /* Overwrite the scroll to 0, just in case browser caches something */
      lns_obj.scrollTop = 0; lns_obj.scrollLeft = 0;
    /* Add lines object to the container*/
      jsHelper(o.id+_id_cont).append(lns_obj);

    /* Generate line numbers. */
      for (var i=0; i<cnt_lns+extraLines; i++) {
        ln_nums = ln_nums+(ln_nums!=''?"\n":'')+_pre((i+1).toString());
      }
      jsHelper(id_nums).html(ln_nums);
    /* Attach focus on the input once lines are clicked */
      jsHelper(id).on('click', function() {
        var id = this.id.split('_')[0];
        jsHelper.elById(id+_id_cursorinput).focus();
      });
    } else {
      var lns_obj = jsHelper.elById(id);
    }

    /* Set position and size of lines element */
    var ln_nums_pos = jsHelper(id_nums).pos();
    var o_pos = jsHelper(o).pos();
    jsHelper(lns_obj).style('height', o_pos.h+'px')
      .style('width', (o_pos.w-ln_nums_pos.w)+'px').style('position','absolute')
      .style('top', '0px').style('left', ln_nums_pos.w+'px');
    return lns_obj;
  };

/* Creates char element. */
  function _createChar(o) {
    var id = o.id + _id_char;
    if (jsHelper(id).length() < 1) {
      var char_obj = jsHelper.nu('span', { className:cls_char, id:id,
                                                        innerHTML: '&nbsp;' });
      jsHelper(o.id+_id_cont).append(char_obj);
    } else {
      var char_obj = jsHelper.elById(id);
    }
    return char_obj;
  };

/* Creates element that will be the cursor. */
  function _createCursor(o) {
    var id = o.id+_id_cursor;
    if (jsHelper(id).length() < 1) {
      var char_coords = jsHelper(o.id+_id_char).pos();
      var cursor_obj = jsHelper.nu('div',{ className:cls_cursor, 
        id: o.id+_id_cursor, style: { height: char_coords.h+'px' }, 
        innerHTML: '<textarea rows="1" id="'+o.id+_id_cursorinput+'"'
                 + 'readonly="readonly"></textarea>' });
      jsHelper(o.id+_id_cont).append(cursor_obj);
    }
    var row = instanceCursors[o.id]['row'],
        col = instanceCursors[o.id]['col'];
    var lns_pos = jsHelper(o.id+_id_lns).pos();
    var char_pos = jsHelper(o.id+_id_char).pos();
    var scroll = _getScroll(o.id);
    var l = lns_pos.l + (col*char_pos.w) - scroll.l;
    var t = lns_pos.t + (row*char_pos.h) - scroll.t; 
    jsHelper(id).style('position', 'absolute')
      .style('left', l+'px').style('top', t+'px');
    jsHelper.elById(o.id+_id_cursorinput).focus();
    return jsHelper.elById(id);
  };

/* Creates a layer on top of editor to handle blurring and focusing */
  function _createBlur(o) {
    var id = o.id+_id_blur;
    var pos = jsHelper(o).pos();
    var wasCreation = false;
    if (jsHelper(id).length() < 1) {
      var b = _nuDivPosAbsLeft0Top0(cls_blur, id);
      var par = jsHelper(o).parent().style('position', 'relative').append(b);
      jsHelper(id).style('zIndex', 5000);
      wasCreation = true;
    }
    jsHelper(id).style('width', pos.w+'px').style('height', pos.h+'px');
    if (wasCreation) {
      jsHelper(id).on('click', function() {
        jsNotepad2.cmd('', 'set-all-inactive');
        jsNotepad2.cmd(o.id, 'set-active');
      });
    }
  }

/* Activates jsnotepad instance */
  function _setActive(id) {
    if (typeof(instances[id]) == 'undefined')
      return false;
    jsHelper(id+_id_blur).style('display', 'none');
    jsHelper(id+_id_cursorinput).attr('readonly', null);
    jsHelper.elById(id+_id_cursorinput).focus();
    instances[id] = 1;
    return true;
  }

/* Deactivates jsnotepad instance */
  function _setInactive(id) {
    if (typeof(instances[id]) == 'undefined')
      return false;
    jsHelper(id+_id_blur).style('display', 'block');
    instances[id] = 0;
    return true;
  }

/* Sets all jsnotepad instances inactive */
  function _setAllInactive() {
    for (o in instances) {
      _setInactive(o);
    }
    return true;
  }

/* Handle alt, ctrl and shift keys */
  function _attachKeysShiftCtrlAlt() {
  /* When user leaves the window or comes back we reset the status of ctrl, alt
     and shift */
    jsHelper(window).on('blur', function(evt) {
      keyShiftDown = false; keyAltDown = false; keyCtrlDown = false;
      jsNotepad2.cmd('', 'set-all-inactive');
    }).on('focus', function(evt) {
      keyShiftDown = false; keyAltDown = false; keyCtrlDown = false;
      jsNotepad2.cmd('', 'set-all-inactive');
    }).on('keydown', function(evt) {
      switch (evt.keyCode) {
        case SHIFT: keyShiftDown = true; break;
        case CTRL:  keyCtrlDown  = true; break;
        case ALT:   keyAltDown   = true; break;
        default: break;
      }
    }).on('keyup', function(evt) {
      switch (evt.keyCode) {
        case SHIFT: keyShiftDown = false; break;
        case CTRL:  keyCtrlDown  = false; break;
        case ALT:   keyAltDown   = false; break;
        default: break;
      }
    });
  }

/* Attach all key events */
  function _attachKeys() {
    _attachKeysShiftCtrlAlt();
    jsHelper(window).on('keypress', function(evt) {
      var f=false;
      for (i in instances) {
        if (instances[i] == 1)
          f=true;
      }
      if (!f)
        return null;
      
      if (keyAltDown || keyCtrlDown)
        return null;
      
      if (evt.keyCode == UP || evt.keyCode == DOWN || evt.keyCode == LEFT ||
          evt.keyCode == RIGHT || evt.keyCode == DELETE || evt.keyCode == END ||
          evt.keyCode == ENTER || evt.keyCode == HOME || evt.keyCode == TAB) {
          evt.preventDefault();
      }

    /* Basic cursor moves */
      switch (evt.keyCode) {
        case LEFT: _cmdOnAllActive('move-cursor-left'); break;
        case RIGHT: _cmdOnAllActive('move-cursor-right', {'c': 1}); break;
        case UP: _cmdOnAllActive('move-cursor-up'); break;
        case DOWN: _cmdOnAllActive('move-cursor-down'); break;
        case BACKSPACE: _cmdOnAllActive('remove-left-char'); break;
        case DELETE: _cmdOnAllActive('remove-right-char'); break;
        case ENTER: _cmdOnAllActive('new-line'); break;
        case HOME: _cmdOnAllActive('move-cursor-home'); break;
        case END: _cmdOnAllActive('move-cursor-end'); break;
        default: break;
      }
    });
    keysAttached = true;
    return true;
  };

  function _attachInstanceKeys(o) {
    jsHelper(o.id+_id_cursorinput).on('keyup', function(evt) {
      var id = this.id.split('_')[0];
      var val = this.value;
      if (val != '') {
        jsNotepad2.cmd(id, 'insert-text', {'text': val});
      }
      this.value = '';
    });
    instanceKeysAttached[o.id] = 1;
    return true;
  }
  
  function _attachInstanceScroll(o) {
    jsHelper(o.id+_id_lns).on('scroll', function() {
      var id = this.id.split('_')[0];
      // @scope?
      _createCursor(jsHelper.elById(id));
      jsHelper.elById(o.id+_id_lnnums).scrollTop = this.scrollTop;
    });
  }

  function _getScroll(id) {
    var lns = jsHelper.elById(id+_id_lns);
    return { l: lns.scrollLeft, t: lns.scrollTop };
  }

  function _getRowsCount(id) {
    return jsHelper(id+_id_lns).children().filterTag('pre').length();
  }
  
  function _getLineColsCount(id, row) {
    var h = jsHelper(id+_id_lns).children().filterTag('pre').nth(row+1).html();
    h = h.replace(/<span[a-zA-Z0-9 ="_\-]*>/g,'').replace(/<\/span>/g,'');
    h = jsHelper.decHtml(h);
    return h.length-1;
  }

  function _setCursorPosition(id, row, col) {
    if (typeof(row) != 'number' || typeof(col) != 'number')
      return false;
    if (!row.toString().match(/^[0-9]+$/) || !col.toString().match(/^[0-9]+$/))
      return false;
    var rows = _getRowsCount(id);
    if (row >= rows)
      return false;
    var cols = _getLineColsCount(id, row);
    if (col > cols)
      return false;
    _addInstanceCursorPosition(id, row, col);
    _createCursor(jsHelper.elById(id));
  }

  function _getCursorPosition(id) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    return {'row':instanceCursors[id]['row'],'col':instanceCursors[id]['col']}
  }
  
  function _moveCursorUp(id) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    var pos = _getCursorPosition(id);
    if (pos.row > 0) {
      var prev_line_cols = _getLineColsCount(id, pos.row-1);
      if (prev_line_cols < pos.col) {
        var col = prev_line_cols;
      } else {
        var col = pos.col;
      }
      _setCursorPosition(id, pos.row-1, col);
      _scrollIfCursorNotVisible(id);
    }
  }

  function _moveCursorDown(id) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    var pos = _getCursorPosition(id);
    var rows = _getRowsCount(id); 
    if (pos.row < (rows-1)) {
      var next_line_cols = _getLineColsCount(id, pos.row + 1);
      if (next_line_cols < pos.col) {
        var col = next_line_cols;
      } else {
        var col = pos.col;
      }
      _setCursorPosition(id, pos.row + 1, col);
      _scrollIfCursorNotVisible(id);
    }
  }

  function _moveCursorLeft(id) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    var pos = _getCursorPosition(id);
    if (pos.col > 0) {
      _setCursorPosition(id, pos.row, pos.col-1);
      _scrollIfCursorNotVisible(id);
    }
  }

  function _moveCursorRight(id, cnt) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    if (typeof(cnt) != 'number') {
      cnt = 1;
    }
    var pos = _getCursorPosition(id);
    var line_cols = _getLineColsCount(id, pos.row);
    if (pos.col+cnt <= line_cols) {
      _setCursorPosition(id, pos.row, pos.col+cnt);
      _scrollIfCursorNotVisible(id);
    }
  }
  
  function _moveCursorHome(id) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    var pos = _getCursorPosition(id);
    _setCursorPosition(id, pos.row, 0);
    _scrollIfCursorNotVisible(id);
  }
  
  function _moveCursorEnd(id) {
    if (typeof(instanceCursors[id]) == 'undefined')
      return false;
    var pos = _getCursorPosition(id);
    var line_cols = _getLineColsCount(id, pos.row);
    _setCursorPosition(id, pos.row, line_cols);
    _scrollIfCursorNotVisible(id);
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

/* Main initialization method. */
  function _init(id, o) {
    if (!jsHelper.elById(id)) {
      console.log('Element with id '+id+' not found.');
      return false;
    }
    var t = jsHelper.elById(id);
    _addInstanceCursorPosition(id, 0, 0);
    _createContainer(t);
    _createLineNumbers(t);
    _createLines(t);
    /*_createSelection(id);*/
    _createChar(t);
    _createCursor(t);
    _createBlur(t);

    if (!keysAttached) {
      _attachKeys();
    }
    if (typeof(instanceKeysAttached[id]) == 'undefined') {
      _attachInstanceKeys(t);
    }
    if (typeof(instanceScrollAttached[id]) == 'undefined') {
      _attachInstanceScroll(t);
    }
    /* @todo Implement later_attachResize(id); */
    _addInstance(id);
  };

  function _cmdOnAllActive(cmd, opts) {
    for (i in instances) {
      if (instances[i] == 1) {
        if (typeof(opts) == 'undefined') {
          opts = {};
        }
        opts['ignoreCheck'] = 1;
        jsNotepad2.cmd(i, cmd, opts);
      }
    }
  }

  function cmd(id, cmd, opts) {
    switch (cmd) {
      case 'init': _init(id, opts); break;
      case 'list-instances': return _listInstances(); break;
      case 'set-all-inactive': return _setAllInactive(); break;
      case 'set-active': return _setActive(id); break;
      case 'set-inactive': return _setInactive(id); break;
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
      case 'set-cursor-position': 
        _setCursorPosition(id, opts['row'], opts['col']); 
        break;
      case 'move-cursor-up': _moveCursorUp(id); break;
      case 'move-cursor-down': _moveCursorDown(id); break;
      case 'move-cursor-right': _moveCursorRight(id, opts['cnt']); break;
      case 'move-cursor-left': _moveCursorLeft(id); break;
      case 'remove-left-char': _removeLeftChar(id); break;
      case 'remove-right-char': _removeRightChar(id); break;
      case 'move-cursor-end': _moveCursorEnd(id); break;
      case 'move-cursor-home': _moveCursorHome(id); break;
      case 'new-line': _newLine(id); break;
      case 'insert-text': _insertText(id, opts); break;
    }
    return true;
  }
 
  return {
    cmd: cmd
  };

})();

var jsNotepad = (function() {

/* There might be many instances of jsNotepad but only one of them can be 
active (at least so far). Possible @todo is to make this an array so that text
might be input in many windows. */
    var currentId         = '';


/* Sometimes few char keys need to be pressed to perform an action. This var is
to store all pressed keys so far. This var is probably mostly used in vim mode,
eg. for 'dd' to remove current line. */
    var keyCombination    = '';


/* Edit mode. Text can be edited only when edit mode is turned on. */
    var editMode          = false;

/* Vim mode. If set to true then editor will behave like vim. This value is set
when the editor is initialized. */
    var vimMode           = false;

/* Selected text coordinates in visual mode. */
    var selection         = {r:-1, c:-1};

/* Clipboard lines. */
    var clipboardLines    = [];




/* Creates selection element that will contain visualization of selection */
    function _createSelection(id) {
        var sel_obj = jsHelper.nu('div', {
            className: 'jsnotepad-selection-lines',
            id       : id+'_jsnotepad-selection-lines'
        });
        var p = jsHelper(id+'_jsnotepad-lines').pos();
        jsHelper(sel_obj).style('position','absolute').style('left', p.l+'px')
                       .style('top',  p.t+'px').style('width', p.w+'px')
                       .style('height', p.h+'px');
        jsHelper(id+'_jsnotepad-container').append(sel_obj);
    }


/* Attaches to resize event on the textarea. */
    function _attachResize(id) {
        jsHelper(id).on('resize', function() {
            var textarea_obj    = this;
            var textarea_coords = jsHelper(textarea_obj).pos();
            var line_numbers_ob 
                              = jsHelper.elById(id+'_jsnotepad-line-numbers');
            var line_numbers_coords = jsHelper(line_numbers_obj).pos();
            var lines_obj           = jsHelper.elById(id+'_jsnotepad-lines');
            line_numbers_obj.style.height = textarea_coords.h+'px';
            lines_obj.style.height        = textarea_coords.h+'px';
            lines_obj.style.width 
                              = (textarea_coords.w-line_numbers_coords.w)+'px';
            var lines_pos = jsHelper(lines_obj).pos();
            jsHelper(id+'_jsnotepad-selection-lines')
                .style('top', lines_pos.t).style('left', lines_pos.l)
                .style('width', lines_pos.w).style('height', lines_pos.h);
        });
    };

/* Attaches focusing on the input once editor element is clicked. */
    function _attachClick(id) {
        jsHelper(id+'_jsnotepad-lines').on('click', function() {
            var id = this.id.split('_')[0];
            jsHelper.elById(id+'_jsnotepad-cursor-input').focus();
        });
    };

/* Attaches to scroll event of the editor. */
    function _attachScroll(id) {
        jsHelper(id+'_jsnotepad-lines').on('scroll', function() {
            var id = this.id.replace('_jsnotepad-lines', '');
            // @scope?
            refreshCursorPosition(id);
            jsHelper.elById(id+'_jsnotepad-line-numbers').scrollTop 
                                                              = this.scrollTop;
            jsHelper.elById(id+'_jsnotepad-selection-lines').scrollTop
                                                              = this.scrollTop;
            jsHelper.elById(id+'_jsnotepad-selection-lines').scrollLeft
                                                             = this.scrollLeft;
        });
    };

/* Adds key events. */
    function _handleNormalModeKeyEvent(evt) {
        switch (evt.keyCode) {
            case 37: moveCursorLeft();     break;
            case 39: moveCursorRight(1);   break;
            case 38: moveCursorUp();       break;
            case 40: moveCursorDown();     break;
            case 8:  if (editMode) { removeCharLeft();  } break;
            case 46: if (editMode) { removeCharRight(); } break;
            case 13: if (editMode) { breakLine();       } break;
            default: break;
        }
    }

    function _handleVimModeKeyEvent(evt) {
        if (!editMode) {
        /* 'i' key. */
            if (evt.charCode==105 && !keyShiftDown) {
                evt.preventDefault();
                clearKeyCombination();
                turnEditModeOn();
                stopSelection();
                removeVisualSelection();
                return true;
            }
        /* 'd' key. */
            if (evt.charCode==100 && !keyShiftDown) {
                evt.preventDefault();
                if (keyCombination != 'd') {
                    if (selection.r!=-1) {
                        removeSelection();
                        var pos=getCursorPosition();
                        if (pos.r==selection.r) {
                            var least_col=(pos.c<selection.c?pos.c:selection.c);
                            var least_row=pos.r;
                        } else {
                            var least_row=(pos.r<selection.r?pos.r:selection.r);
                            var least_col=(pos.r<selection.r?pos.c:selection.c);
                        }
                        setCursorPosition(least_row, least_col);
                        stopSelection();
                        removeVisualSelection();
                    } else {
                        keyCombination='d';
                    }
                    return true;
                } else {
                    clearKeyCombination();
                    removeCurrentLine();
                    return true;
                }
            }
        /* 'v' key. */
            if (evt.charCode==118 && !keyShiftDown) {
                evt.preventDefault();
                keyCombination='v';
                startSelection();
                return true;
            }
        /* 'y' key. */
            if (evt.charCode==121 && !keyShiftDown) {
                if (selection.r!=-1) {
                    evt.preventDefault();
                    keyCombination='';
                    copySelection();
                    stopSelection();
                    removeVisualSelection();
                    return true;
                }
            }
        /* 'p' key. */
            if (evt.charCode==112 && !keyShiftDown && keyCombination=='' &&
                clipboardLines.length>0) {
                pasteClipboard();
                return true;
            }
        /* 'g' key. */
            if (evt.charCode==103 && !keyShiftDown) {
                evt.preventDefault();
                if (keyCombination != 'g') {
                    keyCombination='g';
                    return true;
                } else {
                    clearKeyCombination();
                    moveCursorTop();
                    return true;
                }
            }

        /* If 'd' was previously pressed and up or down arrow is pressed next
        then additional lines need to be removed. If other key pressed, then
        clear the combination. */
            if (keyCombination == 'd') {
                if (evt.charCode != 100) {
                    clearKeyCombination();
                }
                if (evt.keyCode == 38) {
                    removeCurrentLine();
                    removePreviousLine();
                    return true;
                }
                if (evt.keyCode == 40) {
                    removeNextLine();
                    removeCurrentLine();
                    return true;
                }
            }
            if (keyCombination.match(/^d[^d]jsHelper/)) {
                clearKeyCombination();
                return true;
            }

        /* If arrow are not pressed then we clear the key combination. */
            if (evt.keyCode!=37 && evt.keyCode!=38 && evt.keyCode!=39 &&
                evt.keyCode!=40) 
            {
                stopSelection();
                clearKeyCombination();
            }

        /* Other characters that move the cursor. */
            switch (evt.charCode) {
            /* ^ */
                case 94:
                    moveCursorHome();
                    return true;
                    break;
            /* jsHelper */
                case 36:
                    moveCursorEnd();
                    return true;
                    break;
            /* G */
                case 71:
                    moveCursorBottom();
                    return true;
                    break;
                default: break;
            }

       }
    /* 'Escape' key. */
        if (evt.keyCode==27) {
            evt.preventDefault();
            turnEditModeOff();
            clearKeyCombination();
            stopSelection();
            removeVisualSelection();
            return true;
        }

    /* Normal arrows etc. */
        var pos = getCursorPosition();
        switch (evt.keyCode) {
            case 37: 
                moveCursorLeft();
                return true;
                break;
            case 39:
                moveCursorRight(1);
                return true;
                break;
            case 38:
                moveCursorUp();
                return true;
                break;
            case 40:
                moveCursorDown();
                return true;
                break;
            case 8:
                if (editMode) { removeCharLeft(); }
                return true;
                break;
            case 46:
                if (editMode) { removeCharRight(); }
                return true;
                break;
            case 13: 
                if (editMode) { breakLine(); }
                return true;
                break;
            case 36:
                moveCursorHome();
                return true;
                break;
            case 35:
                moveCursorEnd();
                return true;
                break;
            default: break;
        }

        stopSelection();
        removeVisualSelection();
    }

/* Sets cursor position to specified row and column. */
    function setCursorPosition(row, col, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var container_coords 
                   = jsHelper(jsHelper.elById(id+'_jsnotepad-container')).pos();
        var lines_coords 
                   = jsHelper(jsHelper.elById(id+'_jsnotepad-lines')).pos();
        var char_coords = jsHelper(jsHelper.elById(id+'_jsnotepad-char')).pos();
        var scroll = getScroll();

        var cursor_obj = jsHelper.elById(id+'_jsnotepad-cursor');
   
        cursor_obj.style.zIndex   = 2000;
        cursor_obj.style.position = 'absolute';
        cursor_obj.style.left     = (container_coords.l+lines_coords.l
                                    +(col*char_coords.w)-scroll.l)
                                    +'px';
        cursor_obj.style.top      = (container_coords.t+lines_coords.t
                                    +(row*char_coords.h)-scroll.t)
                                    +'px';

        cursor_obj.col = col;
        cursor_obj.row = row;
        jsHelper.elById(id+'_jsnotepad-cursor-input').focus();
        
    /* If visual mode is turned on (meaning selection is started) then some
    pieces of text need to be highlighted. */
        if (selection.r == -1)
            return true;
    /* Clearing existing selection. All rows that contain span with style are
    in rowsWithSelection. */
        removeVisualSelection();

        var pos=getCursorPosition();
        makeVisualSelection(selection.r,selection.c,pos.r,pos.c);
    }

/* Makes visual selection based on beginning and ending point. */
    function makeVisualSelection(br,bc,er,ec) {
        var rows=br-er;
        var cols=bc-ec;
    /* If nothing is selected (cursor is in the same place as the selection
    starting point. */
        if (rows==0 && cols==0)
            return true;
        if (rows==0) {
            var start_col = (bc<ec?bc:ec);
            var stop_col  = (bc>ec?bc:ec);
            var row       = er;
            addVisualSelection(row, start_col, stop_col);
        } else {
            var start_row = (br<er?br:er);
            var stop_row  = (br>er?br:er);
            var start_col = (br<er?bc:ec);
            var stop_col  = (br<er?ec:bc);
            for (r=start_row; r<=stop_row; r++) {
                var row_cols = getLineColsCount(r);
                if (r==start_row) {
                    addVisualSelection(r, start_col, row_cols);
                } else if (r==stop_row) {
                    addVisualSelection(r, 0, stop_col);
                } else {
                    addVisualSelection(r, 0, row_cols);
                }
            }
        }
    };

    function refreshCursorPosition(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var cursor_obj = jsHelper.elById(id+'_jsnotepad-cursor');
    /* If cursor is below text (eg. because we removed lines), it needs to be
    moved to the last line. */ 
        if (cursor_obj.row > (getRowsCount()-1)) {
            cursor_obj.row = getRowsCount()-1;
            cursor_obj.col = 0;
        }
        setCursorPosition(cursor_obj.row, cursor_obj.col, id);
    };

/* Return object containing cursor position: column and row. */
    function getCursorPosition(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        return {
            c: jsHelper.elById(id+'_jsnotepad-cursor').col,
            r: jsHelper.elById(id+'_jsnotepad-cursor').row
        };
    };

/* Creates span that will visualize selection. */
    function addVisualSelection(r, b, e, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var el_lines = jsHelper.elById(id+'_jsnotepad-selection-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i==r && (e-b)>0) {
                    var h=' '.repeat(b);
                    h+='<span>';
                    h+=' '.repeat(e-b);
                    h+='</span>';
                    el_lines.childNodes[i].innerHTML=h;
                }
            }
        }
    }

/* Removes visualization of selection. */
    function removeVisualSelection(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var h = '';
        var el_lines = jsHelper.elById(id+'_jsnotepad-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                h+='<pre> </pre>';
            }
        }
        jsHelper(id+'_jsnotepad-selection-lines').html(h);
    }

/* Returns left and top scroll. */
    function getScroll(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = jsHelper.elById(id+'_jsnotepad-lines');
        return { l:el_lines.scrollLeft, t:el_lines.scrollTop };
    };

/* Returns number of columns in a certain row. */
    function getLineColsCount(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = jsHelper.elById(id+'_jsnotepad-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    var h=el_lines.childNodes[i].innerHTML
                         .replace(/<span[a-zA-Z0-9 ="_\-]*>/g,'')
                         .replace(/<\/span>/g,'');
                    return jsHelper.decHtml(h).length-1;
                }
            }
        }
        return null;
    };

/* Returns contents of specified line. */
    function getLine(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = jsHelper.elById(id+'_jsnotepad-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    var h=el_lines.childNodes[i].innerHTML
                         .replace(/<span[a-zA-Z0-9 ="_\-]*>/g,'')
                         .replace(/<\/span>/g,'');
                    return jsHelper.decHtml(h).replace(/ jsHelper/,'');
                }
            }
        }
        return null;
    };

/* Returns number of lines. */
    function getRowsCount(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
 
        var el_lines = jsHelper.elById(id+'_jsnotepad-lines');
        return el_lines.childNodes.length;
    };

/* Replaces specified line with content. */
    function replaceLine(row, content, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = jsHelper.elById(id+'_jsnotepad-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    el_lines.childNodes[i].innerHTML = jsHelper.encHtml(content)+' ';
                }
            }
        }
    };

/* Inserts content in a new line, after specified line. */
    function insertLineAfter(row, content, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines  = jsHelper.elById(id+'_jsnotepad-lines');
        var lines_cnt = el_lines.childNodes.length;
        for (var i=0; i<lines_cnt; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    var new_line = jsHelper.nu('pre');
                    new_line.innerHTML = jsHelper.encHtml(content)+' ';
                    if (i == lines_cnt) {
                        el_lines.appendChild(new_line);
                    } else {
                        el_lines.insertBefore(new_line, 
                                                     el_lines.childNodes[i+1]);
                    }
                }
            }
        }
    };

/* Removes specified line. */
    function removeLine(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
 
        var el_lines  = jsHelper.elById(id+'_jsnotepad-lines');
        var lines_cnt = el_lines.childNodes.length;
        for (var i=0; i<lines_cnt; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    el_lines.removeChild(el_lines.childNodes[i]);
                    return true;
                }
            }
        }
    };

/* Adds line number. */
    function addLineNumber(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines        = jsHelper.elById(id+'_jsnotepad-lines');
        var lines_cnt       = el_lines.childNodes.length + lineNumberAddon;
        var el_line_numbers = jsHelper.elById(id+'_jsnotepad-line-numbers');
        el_line_numbers.innerHTML = el_line_numbers.innerHTML
                                   .replace('</pre>', "\n"+lines_cnt+'</pre>');
    };

/* Removes last line number. */
    function removeLineNumber(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_line_numbers = jsHelper.elById(id+'_jsnotepad-line-numbers');
        el_line_numbers.innerHTML = el_line_numbers.innerHTML
                                       .replace(/\n[0-9]+\<\/pre\>/, '</pre>');
    };

/* Moves cursor left. */
    function moveCursorLeft(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (pos.c > 0) {
            setCursorPosition(pos.r, pos.c-1);
        }
    };

/* Moves cursor right. */
    function moveCursorRight(c, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        if (typeof(c) != 'number') {
            var c = 1;
        }
        var pos       = getCursorPosition(id);
        var line_cols = getLineColsCount(pos.r, id);
        if (pos.c < line_cols) {
            setCursorPosition(pos.r, pos.c+c, id);
        }
    };

/* Moves cursor up. */
    function moveCursorUp(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (pos.r > 0) {
            var prev_line_cols = getLineColsCount(pos.r-1, id);
            if (prev_line_cols < pos.c) {
                var col = prev_line_cols;
            } else {
                var col = pos.c;
            }
            setCursorPosition(pos.r-1, col, id);
        }
    };

/* Moves cursor down. */
    function moveCursorDown(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos  = getCursorPosition(id);
        var rows = getRowsCount(id);
        if (pos.r < (rows-1)) {
            var next_line_cols = getLineColsCount(pos.r + 1, id);
            if (next_line_cols < pos.c) {
                var col = next_line_cols;
            } else {
                var col = pos.c;
            }
            setCursorPosition(pos.r + 1, col, id);
        }
    };

/* Moves cursor to the beginning of the line. */
    function moveCursorHome(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var pos=getCursorPosition();
        setCursorPosition(pos.r, 0);
    }

/* Moves cursor to end of the line. */
    function moveCursorEnd(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var pos=getCursorPosition();
        setCursorPosition(pos.r, getLineColsCount(pos.r));
    }

/* Moves cursor top. */
    function moveCursorTop(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var pos=getCursorPosition();
        setCursorPosition(0,0);
    }

/* Moves cursor bottom. */
    function moveCursorBottom(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        var pos=getCursorPosition();
        setCursorPosition(getRowsCount()-1,0);
    }

/* Inserts text. */
    function insertText(t, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var match = t.match(/\n/g);
        if (match !== null) {
            var cnt_lines = match.length + 1;
        } else {
            var cnt_lines = 1;
        }
        if (cnt_lines == 1) {
            return insertChar(t, id);
        }

        var arr_lines = t.split(/\n/);

        var pos   = getCursorPosition(id);
        var line  = getLine(pos.r, id);
        var left  = line.substring(0, pos.c);
        var right = line.substring(pos.c);
        replaceLine(pos.r, left + arr_lines[0], id);
        moveCursorRight(arr_lines[0].length, id);

        for (var i=1; i<cnt_lines; i++) {
            if (i == cnt_lines-1) {
                insertLineAfter(pos.r+i-1, arr_lines[i]+right, id);
            } else {
                insertLineAfter(pos.r+i-1, arr_lines[i], id);
            }
        }
        setCursorPosition(pos.r+cnt_lines-1, arr_lines[cnt_lines-1].length,id);
    };

/* Inserts one character. */
    function insertChar(c, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos   = getCursorPosition(id);
        var line  = getLine(pos.r, id);
        var left  = line.substring(0, pos.c);
        var right = line.substring(pos.c);
        replaceLine(pos.r, left + c + right, id);
        moveCursorRight(c.length, id);
    };

/* Removes a character at specified column. */
    function removeChar(col, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos   = getCursorPosition(id);
        var line  = getLine(pos.r, id);
        var left  = line.substring(0, col);
        var right = line.substring(col + 1);
        replaceLine(pos.r, left + right, id);
    };

/* Removes a character on the left of the cursor. */
    function removeCharLeft(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (pos.c > 0) {
            removeChar(pos.c - 1, id);
            moveCursorLeft(id);
        } else if (pos.c == 0 && pos.r > 0) {
            joinLineAbove(id);
        }
    };

/* Removes a character on the right of the cursor. */
    function removeCharRight(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos       = getCursorPosition(id);
        var line_cols = getLineColsCount(pos.r, id);
        if (pos.c < line_cols) {
            removeChar(pos.c, id);
        }
    };

/* Breaks line at cursor position. */
    function breakLine(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos   = getCursorPosition(id);
        var line  = getLine(pos.r, id);
        var left  = line.substring(0, pos.c);
        var right = line.substring(pos.c);
        replaceLine(pos.r, left, id);
        insertLineAfter(pos.r, right, id);
        setCursorPosition(pos.r+1, 0, id);
        addLineNumber(id);
    };

/* Joins line above from cursor position. */
    function joinLineAbove(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos           = getCursorPosition(id);
        var line          = getLine(pos.r, id);
        var left          = line.substring(0, pos.c);
        var right         = line.substring(pos.c);
        var line_contents = getLine(pos.r - 1, id);
        var new_contents  = line_contents+right;
        replaceLine(pos.r-1, new_contents, id);
        setCursorPosition(pos.r-1, line_contents.length, id);
        removeLine(pos.r, id);
        removeLineNumber(id);
    };

/* Removes current line. */
    function removeCurrentLine(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (getRowsCount()>1) {
            removeLine(pos.r);
        } else {
            replaceLine(0,'');
        }
        refreshCursorPosition();
    }

/* Removes previous line. */
    function removePreviousLine(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (pos.r>0) {
            removeLine(pos.r-1);
        }
        refreshCursorPosition();
    }

/* Removed next line. */
    function removeNextLine(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (pos.r < (getRowsCount()-1)) {
            removeLine(pos.r+1);
        }
        refreshCursorPosition();
    }

/* Turns on edit mode. */
    function turnEditModeOn(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        editMode = true;
        jsHelper(id+'_jsnotepad-cursor-input').attr('readonly', null);
        jsHelper.elById(id+'_jsnotepad-cursor-input').focus();
    };

/* Turns off edit mode */
    function turnEditModeOff(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
        editMode = false;
        jsHelper(id+'_jsnotepad-cursor-input').attr('readonly',
                                                                   'readonly');
        jsHelper.elById(id+'_jsnotepad-cursor-input').focus();
    }

/* Clears all the pressed keys so far. */
    function clearKeyCombination() {
        keyCombination = '';
    }

/* Starts selection (visual mode). */
    function startSelection() {
        var p=getCursorPosition();
        selection={r:p.r,c:p.c}; console.log(selection);
    }

/* Stop selection (visual mode). */
    function stopSelection() {
        selection={r:-1,c:-1};
    }

/* Copies selected text to clipboard. */
    function copySelection() {
        var pos=getCursorPosition();
        var br=selection.r, bc=selection.c, er=pos.r, ec=pos.c;
        var rows=br-er, cols=bc-ec;
    /* If nothing is selected (cursor is in the same place as the selection
    starting point. */
        if (rows==0 && cols==0)
            return true;
        if (rows==0) {
            var start_col = (bc<ec?bc:ec);
            var stop_col  = (bc>ec?bc:ec);
            var row       = er;
            var line      = getLine(row);
            var text      = line.substring(start_col, stop_col);
            clipboardLines = [text];
        } else {
            var start_row = (br<er?br:er);
            var stop_row  = (br>er?br:er);
            var start_col = (br<er?bc:ec);
            var stop_col  = (br<er?ec:bc);
            clipboardLines = [];
            for (r=start_row; r<=stop_row; r++) {
                var row_cols = getLineColsCount(r);
                var line     = getLine(r);
                if (r==start_row) {
                    clipboardLines.push(line.substring(start_col, row_cols));
                } else if (r==stop_row) {
                    clipboardLines.push(line.substring(0, stop_col));
                } else {
                    clipboardLines.push(line.substring(0, row_cols));
                }
            }
        }
    }

/* Inserts text from the clipboard in cursor place. */
    function pasteClipboard() {
        var text = '';
        for (var i=0; i<clipboardLines.length; i++) {
            text += (text!=''?"\n":"")+clipboardLines[i];
        }
        insertText(text);
    }

    function removeSelection() {
        var pos=getCursorPosition();
        var br=selection.r, bc=selection.c, er=pos.r, ec=pos.c;
        var rows=br-er, cols=bc-ec;
    /* If nothing is selected (cursor is in the same place as the selection
    starting point. */
        if (rows==0 && cols==0)
            return true;
        if (rows==0) {
            var start_col = (bc<ec?bc:ec);
            var stop_col  = (bc>ec?bc:ec);
            var row       = er;
            var line      = getLine(row);
            var before    = line.substring(0, start_col);
            var after     = line.substring(stop_col);
            replaceLine(row, before+after);
        } else {
            var start_row = (br<er?br:er);
            var stop_row  = (br>er?br:er);
            var start_col = (br<er?bc:ec);
            var stop_col  = (br<er?ec:bc);
            clipboardLines = [];
            var row_cols  = getLineColsCount(start_row);
            var line      = getLine(start_row);
            replaceLine(start_row, line.substring(0, start_col));
            var row_cols  = getLineColsCount(stop_row);
            var line      = getLine(stop_row);
            replaceLine(stop_row, line.substring(stop_col));
            var diff      = stop_row-start_row-1;
            if (diff==1) {
                removeLine(start_row+1);
            } else if (diff>1) {
                for (var j=stop_row-1; j>=start_row+1; j--) {
                    removeLine(j);
                }
            }
            setCursorPosition(start_row+1,0);
            joinLineAbove();
        }
    }

/* Public methods. */
    return {
        init                 : init,
        setCursorPosition    : setCursorPosition,
        refreshCursorPosition: refreshCursorPosition,
        getCursorPosition    : getCursorPosition,
        getScroll            : getScroll,
        getLineColsCount     : getLineColsCount,
        getLine              : getLine,
        getRowsCount         : getRowsCount,
        replaceLine          : replaceLine,
        insertLineAfter      : insertLineAfter,
        removeLine           : removeLine,
        addLineNumber        : addLineNumber,
        removeLineNumber     : removeLineNumber,
        moveCursorLeft       : moveCursorLeft,
        moveCursorRight      : moveCursorRight,
        moveCursorUp         : moveCursorUp,
        moveCursorDown       : moveCursorDown,
        insertText           : insertText,
        insertChar           : insertChar,
        removeChar           : removeChar,
        removeCharLeft       : removeCharLeft,
        removeCharRight      : removeCharRight,
        breakLine            : breakLine,
        joinLineAbove        : joinLineAbove,
        removeCurrentLine    : removeCurrentLine,
        removePreviousLine   : removePreviousLine,
        removeNextLine       : removeNextLine,
        turnEditModeOn       : turnEditModeOn,
        clearKeyCombination  : clearKeyCombination,
        startSelection       : startSelection,
        stopSelection        : stopSelection
    };
});

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
    jsNotepad2.cmd(id, cmd, opts);
  }
};

if (typeof(JSHELPER_COMPATIBLE) == "undefined") {
  $.notepad = function(src, cmd, opts) { jsHelper.notepad(src, cmd, opts); };
}
