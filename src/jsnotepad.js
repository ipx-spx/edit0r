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

var jsNotepad = (function() {

/* There might be many instances of textEditor but only one of them can be 
active (at least so far). Possible @todo is to make this an array so that text
might be input in many windows. */
    var currentId         = '';

/* Storing information about shift, alt and ctrl keys being down. */
    var keyShiftDown      = false;
    var keyAltDown        = false;
    var keyCtrlDown       = false;

/* Sometimes few char keys need to be pressed to perform an action. This var is
to store all pressed keys so far. This var is probably mostly used in vim mode,
eg. for 'dd' to remove current line. */
    var keyCombination    = '';

/* We need numbers of line to be visible till the bottom of the container, even
if there are actually less lines. Therefore below number is added to get that
done. */
    var lineNumberAddon   = 100;

/* Edit mode. Text can be edited only when edit mode is turned on. */
    var editMode          = false;

/* Vim mode. If set to true then editor will behave like vim. This value is set
when the editor is initialized. */
    var vimMode           = false;

/* Selected text coordinates in visual mode. */
    var selection         = {r:-1, c:-1};

/* Clipboard lines. */
    var clipboardLines    = [];

/* Creates container element in an absolute position. */
    function _createContainer(id, l, t) {
        var c = jsHelper.nu('div', {
            className: 'jsnotepad',
            style: {
                position: 'absolute',
                left    : l+'px',
                top     : t+'px'
            },
            id: id+'_jsnotepad-container'
        });
        jsHelper(document.body).append(c);
        return c;
    };

/* Creates element containing line numbers in position related to container. */
    function _createLineNumbers(id, h) {
        var l = jsHelper.nu('div', {
            className: 'jsnotepad-line-numbers',
            id       : id+'_jsnotepad-line-numbers',
            style    : { position: 'absolute', 
                         left:     '0', 
                         top:      '0',
                         height:   h+'px' },
        });
        jsHelper(id+'_jsnotepad-container').append(l);
        return l;
    };

/* Creates element for every single line. */
    function _createLines(id, textarea_obj) {
        var lines_obj = jsHelper.nu('div', {
            className: 'jsnotepad-lines',
            id       : id+'_jsnotepad-lines'
        });
        var match = textarea_obj.value.match(/\n/g);
        if (match !== null) {
            var cnt_lines = match.length+1;
        } else {
            var cnt_lines = 1;
        }
        var arr_lines     = textarea_obj.value.split(/\n/);
        var line_numbers  = '';
        var lines_content = '';
        for (var i=0; i<cnt_lines+lineNumberAddon; i++) {
            line_numbers = line_numbers + (line_numbers!=''?"\n":'') + (i+1);
        }
        for (var i=0; i<cnt_lines; i++) {
            lines_content = lines_content+'<pre>'
                                         +jsHelper.encHtml(arr_lines[i])+' '
                                         +'</pre>';
        }
        lines_obj.innerHTML        = lines_content;

        var line_numbers_obj = jsHelper.elById(id+'_jsnotepad-line-numbers');
        line_numbers_obj.innerHTML = '<pre>'+line_numbers+'</pre>';

        var container_obj = jsHelper.elById(id+'_jsnotepad-container');
        jsHelper(container_obj).append(lines_obj);

        var line_numbers_coords = jsHelper(line_numbers_obj).pos();
        var textarea_coords     = jsHelper(textarea_obj).pos();
        jsHelper(lines_obj)
               .style('height', textarea_coords.h+'px')
               .style('width',  (textarea_coords.w-line_numbers_coords.w)+'px')
               .style('position', 'absolute')
               .style('left', (line_numbers_coords.w+line_numbers_coords.l)+'px')
               .style('top', line_numbers_coords.t+'px');
        return lines_obj;
    };

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

/* Creates char element. */
    function _createChar(id) {
        var char_obj = jsHelper.nu('span', {
            className: 'jsnotepad-char',
            id       : id + '_jsnotepad-char',
            innerHTML: '&nbsp;'
        });
        jsHelper(document.body).append(char_obj);
        return char_obj;
    };

/* Creates element that will be the cursor. */
    function _createCursor(id) {
        var char_coords = jsHelper(id+'_jsnotepad-char').pos();
        var cursor_obj  = jsHelper.nu('div', {
            className: 'jsnotepad-cursor',
            id       : id+'_jsnotepad-cursor',
            innerHTML:   '<textarea '
                       + 'rows="1" '
                       + 'id="'+id+'_jsnotepad-cursor-input"'
                       + 'readonly="readonly"></textarea>',
            style    : { height: char_coords.h+'px' }
        });
        jsHelper(document.body).append(cursor_obj);
    };

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

    function _attachKeys(id) {
        // @scope?
        jsHelper(document.body).on('keydown', function(evt) {
            switch (evt.keyCode) {
                case 16: keyShiftDown = true;  break;
                case 18: keyAltDown   = true;  break;
                case 17: keyCtrlDown  = true;  break;
                default: break;
            }
        }).on('keyup', function(evt) {
            switch (evt.keyCode) {
                case 16: keyShiftDown = false; break;
                case 18: keyAltDown   = false; break;
                case 17: keyCtrlDown  = false; break;
                default: break;
            }
        }).on('keypress', function(evt) {
            if (keyAltDown || keyCtrlDown)
                return null;

    /* Preventing default behavior for arrow keys, backspace, delete and
    enter. */
        if (evt.keyCode == 37 || evt.keyCode == 39 || evt.keyCode == 38 ||
            evt.keyCode == 40 || evt.keyCode == 8  || evt.keyCode == 46 ||
            evt.keyCode == 13) {
            evt.preventDefault();
        }

        /* Keys are handled different in vim mode. */
            if (vimMode) {
                _handleVimModeKeyEvent(evt);
            } else {
                _handleNormalModeKeyEvent(evt);
            }
        });
        jsHelper(id+'_jsnotepad-cursor-input').on('keyup',function(evt) {
            var id  = this.id.split('_')[0];
            var val = this.value;
            if (val != '') { 
                // @scope?
                insertText(val, id);
            }
            this.value = '';
        });
    };

/* Main initialization method. */
    function init(id, o) {
        if (!jsHelper.elById(id, 'Element with id '+id+' not found.'))
            return false;

        currentId = id;

        var textarea_obj     = jsHelper.elById(id);
        var textarea_coords  = jsHelper(textarea_obj).pos();
        var container_obj    = _createContainer(id, textarea_coords.l, 
                                                    textarea_coords.t);
        _createLineNumbers(id, textarea_coords.h);
        _createLines(id, textarea_obj);
        _createSelection(id);
        _createChar(id);
        _createCursor(id);

        _attachKeys(id);
        _attachClick(id);
        _attachScroll(id);
        _attachResize(id);
        setCursorPosition(0,0);

        turnEditModeOn();
    /* If vim mode is to be turned on then editing is unavailable when
    initialized. */
        if (typeof(o) === 'object') {
            if (typeof(o.vimMode) == 'boolean' && o.vimMode) {
                vimMode = true;
                turnEditModeOff();
            }
        }

   };

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
})();

jshEl.prototype.notepad = function(opts) {
  this.func(function(el) {
    if ($(el).attr('id') === null) {
      $(el).attr('id', $.uid());
    }
    $.notepad('#'+$(el).attr('id'), opts);
  });
}

jsHelper.notepad = function(src, opts) {
  if (src[0] == '#' && src.length > 1) {
    var id = src.substring(1);
    if (jsHelper(id).length() != 1)
      return false;
    jsNotepad.init(id, opts);
  }
};

if (typeof(JSHELPER_COMPATIBLE) == "undefined") {
  $.notepad = function(src, opts) { jsHelper.notepad(src, opts); };
}
