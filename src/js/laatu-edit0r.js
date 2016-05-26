// by Nicholas Gasior. (c) laatu.uk

var edit0r = (function() {

    // There might be many instance of laatuJsEditor but only one of them can be active (at least so far).
    // Possible @todo is to make this an array so that text might be input in many windows.
    var currentId       = '';

    // Storing information about shift, alt and ctrl keys being down.
    var keyShiftDown    = false;
    var keyAltDown      = false;
    var keyCtrlDown     = false;

    // We need numbers of line to be visible till the bottom of the container - even if there are actually less lines.
    // Therefore below number is added to get that done.
    var lineNumberAddon = 100;

    function _createContainer(id, l, t) {
        var c = june.nu('div', {
            className: 'laatu-js-editor',
            style: {
                position: 'absolute',
                left    : l+'px',
                top     : t+'px'
            },
            id: id+'_laatu-js-editor-container'
        });
        june.g(document.body).app(c);
        return c;
    };

    function _createLineNumbers(id, c) {
        var l = june.nu('div', {
            className: 'laatu-js-editor-line-numbers',
            id       : id+'_laatu-js-editor-line-numbers'
        });
        june.g(c).app(l);
        return l;
    };

    function _createLines(id, textarea_obj, container_obj, line_numbers_obj) {
        var lines_obj = june.nu('div', {
            className: 'laatu-js-editor-lines',
            id       : id+'_laatu-js-editor-lines'
        });
        var match = textarea_obj.value.match(/\n/g);
        if (match !== null) {
            var cnt_lines = match.length+1;
        } else {
            var cnt_lines = 1;
        }
        var arr_lines     = textarea_obj.value.replace(/\n\n/g, "\n \n").replace(/\n$/g, "\n ").split(/\n/);
        var line_numbers  = '';
        var lines_content = '';
        for (var i=0; i<cnt_lines+this.lineNumberAddon; i++) {
            line_numbers = line_numbers + (line_numbers!=''?"\n":'') + (i+1);
        }
        for (var i=0; i<cnt_lines; i++) {
            if (arr_lines[i] == '') {
                arr_lines[i] = ' ';
            }
            lines_content = lines_content+'<pre>'+june.enc(arr_lines[i])+'</pre>';
        }
        lines_obj.innerHTML        = lines_content;
        line_numbers_obj.innerHTML = '<pre>'+line_numbers+'</pre>';
        june.g(container_obj).app(lines_obj);

        var line_numbers_coords = june.g(line_numbers_obj).pos();
        var textarea_coords     = june.g(textarea_obj).pos();
        line_numbers_obj.style.height = textarea_coords.h+'px';
        lines_obj.style.height        = textarea_coords.h+'px';
        lines_obj.style.width         = (textarea_coords.w-line_numbers_coords.w)+'px';
        return lines_obj;
    };

    function _createChar(id) {
        var char_obj = june.nu('span', {
            className: 'laatu-js-editor-char',
            id       : id + '_laatu-js-editor-char',
            innerHTML: '&nbsp;'
        });
        june.g(document.body).app(char_obj);
        return char_obj;
    };

    function _createCursor(id, char_obj) {
        var char_coords = june.g(char_obj).pos();
        var cursor_obj  = june.nu('div', {
            className: 'laatu-js-editor-cursor',
            id       : id+'_laatu-js-editor-cursor',
            innerHTML: '<textarea rows="1" id="'+id+'_laatu-js-editor-cursor-input"></textarea>',
            style    : { height: char_coords.h+'px' }
        });
        june.g(document.body).app(cursor_obj);
    };

    function _attachResize(id) {
        june.g(id).on('resize', function() {
            var textarea_obj        = this;
            var textarea_coords     = june.g(textarea_obj).pos();
            var line_numbers_obj    = june.obj(id+'_laatu-js-editor-line-numbers');
            var line_numbers_coords = june.g(line_numbers_obj).pos();
            var lines_obj           = june.obj(id+'_laatu-js-editor-lines');
            line_numbers_obj.style.height = textarea_coords.h+'px';
            lines_obj.style.height        = textarea_coords.h+'px';
            lines_obj.style.width         = (textarea_coords.w-line_numbers_coords.w)+'px';
        });
    };

    function _attachClick(id) {
        june.g(id+'_laatu-js-editor-lines').on('click', function() {
            var id = this.id.split('_')[0];
            june.obj(id+'_laatu-js-editor-cursor-input').focus();
        });
    };

    function _attachScroll(id) {
        june.g(id+'_laatu-js-editor-lines').on('scroll', function() {
            var id = this.id.replace('_laatu-js-editor-lines', '');
            // @scope?
            refreshCursorPosition(id);
            june.obj(id+'_laatu-js-editor-line-numbers').scrollTop = this.scrollTop;
        });
    };

    function _attachKeys(id) {
        // @scope?
        june.g(document.body).on('keydown', function(evt) {
            switch (evt.keyCode) {
                case 16: keyShiftDown = true;  break;
                case 18: keyAltDown   = true;    break;
                case 17: keyCtrlDown  = true;   break;
                default: break;
            }
        }).on('keyup', function(evt) {
            switch (evt.keyCode) {
                case 16: keyShiftDown = false; break;
                case 18: keyAltDown   = false;   break;
                case 17: keyCtrlDown  = false;  break;
                default: break;
            }
        }).on('keypress', function(evt) {
            if (keyAltDown || keyCtrlDown)
                return null;

            if (evt.keyCode==37 || evt.keyCode==39 || evt.keyCode==38 || evt.keyCode==40 || evt.keyCode==8 || evt.keyCode==46 || evt.keyCode==13) {
                evt.preventDefault();
            }

            // @scope?
            switch (evt.keyCode) {
                case 37: moveCursorLeft();     break;
                case 39: moveCursorRight(1);    break;
                case 38: moveCursorUp();       break;
                case 40: moveCursorDown();     break;
                case 8:  removeCharLeft();     break;
                case 46: removeCharRight();    break;
                case 13: breakLine();          break;
                default: break;
            }
        });
        june.g(id+'_laatu-js-editor-cursor-input').on('keyup', function(evt) {
            var id  = this.id.split('_')[0];
            var val = this.value;
            if (val != '') { 
                // @scope?
                insertText(val, id);
            }
            this.value = '';
        });
    };

    function init(id) {
        if (!june.obj(id, 'Element with id '+id+' not found.'))
            return false;

        currentId = id;

        var textarea_obj     = june.obj(id);
        var textarea_coords  = june.g(textarea_obj).pos();
        var container_obj    = _createContainer(id, textarea_coords.l, textarea_coords.t);
        var line_numbers_obj = _createLineNumbers(id, container_obj);
        _createLines(id, textarea_obj, container_obj, line_numbers_obj);
        var char_obj = _createChar(id);
        _createCursor(id, char_obj);

        _attachKeys(id);
        _attachClick(id);
        _attachScroll(id);
        _attachResize(id);
        setCursorPosition(0,0);
    };

    function setCursorPosition(row, col, id) {
        if (typeof(id) != 'string') {
            var id = laatuJsEditor.currentId;
        }
        var container_coords = june.g(june.obj(id+'_laatu-js-editor-container')).pos();
        var lines_coords     = june.g(june.obj(id+'_laatu-js-editor-lines')).pos();
        var char_coords      = june.g(june.obj(id+'_laatu-js-editor-char')).pos();
        var scroll           = getScroll();

        var cursor_obj       = june.obj(id+'_laatu-js-editor-cursor');
    
        cursor_obj.style.zIndex   = 2000;
        cursor_obj.style.position = 'absolute';
        cursor_obj.style.left     = (container_coords.l+lines_coords.l+(col*char_coords.w)-scroll.l)+'px';
        cursor_obj.style.top      = (container_coords.t+lines_coords.t+(row*char_coords.h)-scroll.t)+'px';

        cursor_obj.col = col;
        cursor_obj.row = row;

        june.obj(id+'_laatu-js-editor-cursor-input').focus();
    };

    function refreshCursorPosition(id) {
        var cursor_obj = june.obj(id+'_laatu-js-editor-cursor');
        setCursorPosition(cursor_obj.row, cursor_obj.col, id);
    };

    function getCursorPosition(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        return {
            c: june.obj(id+'_laatu-js-editor-cursor').col,
            r: june.obj(id+'_laatu-js-editor-cursor').row
        };
    };

    function getScroll(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = june.obj(id+'_laatu-js-editor-lines');
        return { l:el_lines.scrollLeft, t:el_lines.scrollTop };
    };

    function getLineColsCount(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = june.obj(id+'_laatu-js-editor-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    return el_lines.childNodes[i].innerHTML.decodeHtml().length;
                }
            }
        }
        return null;
    };

    function getLine(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = june.obj(id+'_laatu-js-editor-lines');
        for (var i=0; i<el_lines.childNodes.length; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    return el_lines.childNodes[i].innerHTML.decodeHtml();
                }
            }
        }
        return null;
    };

    function getRowsCount(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
 
        var el_lines = june.obj(id+'_laatu-js-editor-lines');
        return el_lines.childNodes.length;
    };

    function replaceLine(row, content, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines = june.obj(id+'_laatu-js-editor-lines');
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
    };

    function insertLineAfter(row, content, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines  = june.obj(id+'_laatu-js-editor-lines');
        var lines_cnt = el_lines.childNodes.length;
        for (var i=0; i<lines_cnt; i++) {
            if (el_lines.childNodes[i].nodeType === Node.ELEMENT_NODE) {
                if (i == row) {
                    if (content == '') {
                        content = ' ';
                    }
                    var new_line = june.nu('pre');
                    new_line.innerHTML = content.encodeHtml();
                    if (i == lines_cnt) {
                        el_lines.appendChild(new_line);
                    } else {
                        el_lines.insertBefore(new_line, el_lines.childNodes[i+1]);
                    }
                }
            }
        }
    };

    function removeLine(row, id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }
 
        var el_lines  = june.obj(id+'_laatu-js-editor-lines');
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

    function addLineNumber(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_lines        = june.obj(id+'_laatu-js-editor-lines');
        var lines_cnt       = el_lines.childNodes.length + this.lineNumberAddon;
        var el_line_numbers = june.obj(id+'_laatu-js-editor-line-numbers');
        el_line_numbers.innerHTML = el_line_numbers.innerHTML.replace('</pre>', "\n" + lines_cnt + '</pre>');
    };

    function removeLineNumber(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var el_line_numbers       = june.obj(id+'_laatu-js-editor-line-numbers');
        el_line_numbers.innerHTML = el_line_numbers.innerHTML.replace(/\n[0-9]+\<\/pre\>/, '</pre>');
    };

    function moveCursorLeft(id) {
        if (typeof(id) != 'string') {
            var id = currentId;
        }

        var pos = getCursorPosition(id);
        if (pos.c > 0) {
            setCursorPosition(pos.r, pos.c-1);
        }
    };

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

        var arr_lines = t.replace(/\n\n/g, "\n \n").replace(/\n$/g, "\n ").split(/\n/);

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
        setCursorPosition(pos.r+cnt_lines-1, arr_lines[cnt_lines-1].length, id);
    };

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
        joinLineAbove        : joinLineAbove
    };
})();

var laatuJsEditor = {
};

