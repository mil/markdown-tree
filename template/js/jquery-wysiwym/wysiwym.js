/*----------------------------------------------------------------------------------------------
 * Simple Wysiwym Editor for jQuery
 * Version: 2.0 (2011-01-26)
 *--------------------------------------------------------------------------------------------- */
BLANKLINE = '';
Wysiwym = {};

$.fn.wysiwym = function(markupSet, options) {
    this.EDITORCLASS = 'wysiwym-editor';           // Class to use for the wysiwym editor
    this.BUTTONCLASS = 'btn-toolbar';                // Class to use for the wysiwym buttons
    this.HELPCLASS = 'wysiwym-help';               // Class to use for the wysiwym help
    this.HELPTOGGLECLASS = 'wysiwym-help-toggle';  // Class to use for the wysiwym help
    this.textelem = this;                          // Javascript textarea element
    this.textarea = $(this);                       // jQuery textarea object
    this.editor = undefined;                       // jQuery div wrapper around this editor
    this.markup = new markupSet(this);             // Wysiwym Markup set to use
    this.defaults = {                              // Default option values
        containerButtons: undefined,               // jQuery elem to place buttons (makes one by default)
        containerHelp: undefined,                  // jQuery elem to place help (makes one by default)
        helpEnabled: true,                         // Set true to display the help dropdown
        helpToggle: true,                          // Set true to use a toggle link for help
        helpToggleElem: undefined,                 // jQuery elem to toggle help (makes <a> by default)
        helpTextShow: 'show markup syntax',        // Toggle text to display when help is not visible
        helpTextHide: 'hide markup syntax'         // Toggle text to display when help is visible
    };
    this.options = $.extend(this.defaults, options ? options : {});

    // Add the button container and all buttons
    this.initializeButtons = function() {
        var markup = this.markup;
        if (this.options.containerButtons == undefined)
            this.options.containerButtons = $("<div></div>").insertBefore(this.textarea);
        this.options.containerButtons.addClass(this.BUTTONCLASS);

        this.options.btngroup = $("<div class='btn-group'></div>").appendTo(this.options.containerButtons);

        for (var i=0; i<markup.buttons.length; i++) {
            // Create the button
            var button = markup.buttons[i];

            if (button==='|') {
                this.options.btngroup = $("<div class='btn-group'></div>").appendTo(this.options.containerButtons);
                continue;
            }

            var jqbutton = button.create();
            var data = $.extend({markup:this.markup}, button.data);
            jqbutton.bind('click', data, button.callback);
            this.options.btngroup.append(jqbutton);
        }
    };

    // Initialize the AutoIndent trigger
    this.initializeAutoIndent = function() {
        if (this.markup.autoindents) {
            var data = {markup:this.markup};
            this.textarea.bind('keydown', data, Wysiwym.autoIndent);
        }
    };

    // Initialize the help syntax dropdown
    this.initializeHelp = function() {
        if (this.options.helpEnabled) {
            if (this.options.containerHelp == undefined)
                this.options.containerHelp = $("<div></div>").insertAfter(this.textarea);
            this.options.containerHelp.addClass(this.HELPCLASS);
            // Add the help table and items
            var helpBody = $('<tbody></tbody>');
            var helpTable = $('<table cellpadding="0" cellspacing="0" border="0"></table>').append(helpBody);
            for (var i=0; i<this.markup.help.length; i++) {
                var item = this.markup.help[i];
                helpBody.append('<tr><th>'+ item.label +'</th><td>'+ item.syntax +'</td></tr>');
            };
            this.options.containerHelp.append(helpTable);
        }
    };

    // Initialize the Help Toggle Button
    this.initializeHelpToggle = function() {
        if (this.options.helpToggle && this.options.helpEnabled) {
            var self = this;  // Required for use inside click callback
            if (this.options.helpToggleElem == undefined)
                this.options.helpToggleElem = $("<a href='#'>"+ this.options.helpTextShow +"</a>");
            this.options.helpToggleElem.addClass(this.HELPTOGGLECLASS);
            this.options.helpToggleElem.bind('click', function() {
                if (self.options.containerHelp.is(':visible')) {
                    self.options.containerHelp.slideUp('fast');
                    $(this).text(self.options.helpTextShow);
                } else {
                    self.options.containerHelp.slideDown('fast');
                    $(this).text(self.options.helpTextHide);
                }
                return false;
            });
            this.options.containerHelp.before(this.options.helpToggleElem).hide();
        }
    };

    // Initialize the Wysiwym Editor
    this.editor = $('<div class="'+ this.EDITORCLASS +'"></div>');
    this.textarea.wrap(this.editor);
    this.initializeButtons();
    this.initializeAutoIndent();
    this.initializeHelp();
    this.initializeHelpToggle();
};


/*----------------------------------------------------------------------------------------------
 * Wysiwym Selection
 * Manipulate the textarea selection
 *--------------------------------------------------------------------------------------------- */
Wysiwym.Selection = function(wysiwym) {
    this.lines = wysiwym.lines;                 // Reference to wysiwym.lines
    this.start = { line:0, position:0 },        // Current cursor start positon
    this.end = { line:0, position:0 },          // Current cursor end position

    // Return a string representation of this object.
    this.toString = function() {
        var str = 'SELECTION: '+ this.length() +' chars\n';
        str += 'START LINE: '+ this.start.line +'; POSITION: '+ this.start.position +'\n';
        str += 'END LINE: '+ this.end.line +'; POSITION: '+ this.end.position +'\n';
        return str;
    };

    // Add a line prefix, reguardless if it's already set or not.
    this.addLinePrefixes = function(prefix) {
        for (var i=this.start.line; i <= this.end.line; i++) {
            this.lines[i] = prefix + this.lines[i];
        }
        this.start.position += prefix.length;
        this.end.position += prefix.length;
    };

    // Add the specified prefix to the selection
    this.addPrefix = function(prefix) {
        var numlines = this.lines.length;
        var line = this.lines[this.start.line];
        var newline = line.substring(0, this.start.position) +
            prefix + line.substring(this.start.position, line.length);
        this.lines[this.start.line] = newline;
        this.start.position += prefix.length;
        if (this.start.line == this.end.line)
            this.end.position += prefix.length;
        // Check we need to update the scroll height;  This is very slightly
        // off because height != scrollHeight. A fix would be nice.
        if (prefix.indexOf('\n') != -1) {
            var scrollHeight = wysiwym.textelem.scrollHeight;
            var lineheight = parseInt(scrollHeight / numlines);
            wysiwym.scroll += lineheight;
        }

    };

    // Add the specified suffix to the selection
    this.addSuffix = function(suffix) {
        var line = this.lines[this.end.line];
        var newline = line.substring(0, this.end.position) +
            suffix + line.substring(this.end.position, line.length);
        this.lines[this.end.line] = newline;
    };

    // Append the specified text to the selection
    this.append = function(text) {
        var line = this.lines[this.end.line];
        var newline = line.substring(0, this.end.position) +
            text + line.substring(this.end.position, line.length);
        this.lines[this.end.line] = newline;
        this.end.position += text.length;
    };

    // Return an array of lines in the selection
    this.getLines = function() {
        var selectedlines = [];
        for (var i=this.start.line; i <= this.end.line; i++)
            selectedlines[selectedlines.length] = this.lines[i];
        return selectedlines;
    };

    // Return true if selected text contains has the specified prefix
    this.hasPrefix = function(prefix) {
        var line = this.lines[this.start.line];
        var start = this.start.position - prefix.length;
        if ((start < 0) || (line.substring(start, this.start.position) != prefix))
            return false;
        return true;
    };

    // Return true if selected text contains has the specified suffix
    this.hasSuffix = function(suffix) {
        var line = this.lines[this.end.line];
        var end = this.end.position + suffix.length;
        if ((end > line.length) || (line.substring(this.end.position, end) != suffix))
            return false;
        return true;
    };

    // Insert the line before the selection to the specified text. If force is
    // set to false and the line is already set, it will be left alone.
    this.insertPreviousLine = function(newline, force) {
        force = force !== undefined ? force : true;
        var prevnum = this.start.line - 1;
        if ((force) || ((prevnum >= 0) && (this.lines[prevnum] != newline))) {
            this.lines.splice(this.start.line, 0, newline);
            this.start.line += 1;
            this.end.line += 1;
        }
    };

    // Insert the line after the selection to the specified text. If force is
    // set to false and the line is already set, it will be left alone.
    this.insertNextLine = function(newline, force) {
        force = force !== undefined ? force : true;
        var nextnum = this.end.line + 1;
        if ((force) || ((nextnum < this.lines.length) && (this.lines[nextnum] != newline)))
            this.lines.splice(nextnum, 0, newline);
    };

    // Return true if selected text is wrapped with prefix & suffix
    this.isWrapped = function(prefix, suffix) {
        return ((this.hasPrefix(prefix)) && (this.hasSuffix(suffix)));
    };

    // Return the selection length
    this.length = function() {
        return this.val().length;
    };

    // Return true if all lines have the specified prefix. Optionally
    // specify prefix as a regular expression.
    this.linesHavePrefix = function(prefix) {
        for (var i=this.start.line; i <= this.end.line; i++) {
            var line = this.lines[i];
            if ((typeof(prefix) == 'string') && (!line.startswith(prefix))) {
                return false;
            } else if ((typeof(prefix) != 'string') && (!line.match(prefix))) {
                return false;
            }
        }
        return true;
    };

    // Prepend the specified text to the selection
    this.prepend = function(text) {
        var line = this.lines[this.start.line];
        var newline = line.substring(0, this.start.position) +
            text + line.substring(this.start.position, line.length);
        this.lines[this.start.line] = newline;
        // Update Class Variables
        if (this.start.line == this.end.line)
            this.end.position += text.length;
    };

    // Remove the prefix from each line in the selection. If the line
    // does not contain the specified prefix, it will be left alone.
    // Optionally specify prefix as a regular expression.
    this.removeLinePrefixes = function(prefix) {
        for (var i=this.start.line; i <= this.end.line; i++) {
            var line = this.lines[i];
            var match = prefix;
            // Check prefix is a regex
            if (typeof(prefix) != 'string')
                match = line.match(prefix)[0];
            // Do the replace
            if (line.startswith(match)) {
                this.lines[i] = line.substring(match.length, line.length);
                if (i == this.start.line)
                    this.start.position -= match.length;
                if (i == this.end.line)
                    this.end.position -= match.length;
            }

        }
    };

    // Remove the previous line. If regex is specified, it will
    // only be removed if there is a match.
    this.removeNextLine = function(regex) {
        var nextnum = this.end.line + 1;
        var removeit = false;
        if ((nextnum < this.lines.length) && (regex) && (this.lines[nextnum].match(regex)))
            removeit = true;
        if ((nextnum < this.lines.length) && (!regex))
            removeit = true;
        if (removeit)
            this.lines.splice(nextnum, 1);
    };

    // Remove the specified prefix from the selection
    this.removePrefix = function(prefix) {
        if (this.hasPrefix(prefix)) {
            var line = this.lines[this.start.line];
            var start = this.start.position - prefix.length;
            var newline = line.substring(0, start) +
                line.substring(this.start.position, line.length);
            this.lines[this.start.line] = newline;
            this.start.position -= prefix.length;
            if (this.start.line == this.end.line)
                this.end.position -= prefix.length;
        }
    };

    // Remove the previous line. If regex is specified, it will
    // only be removed if there is a match.
    this.removePreviousLine = function(regex) {
        var prevnum = this.start.line - 1;
        var removeit = false;
        if ((prevnum >= 0) && (regex) && (this.lines[prevnum].match(regex)))
            removeit = true;
        if ((prevnum >= 0) && (!regex))
            removeit = true;
        if (removeit) {
            this.lines.splice(prevnum, 1);
            this.start.line -= 1;
            this.end.line -= 1;
        }
    };

    // Remove the specified suffix from the selection
    this.removeSuffix = function(suffix) {
        if (this.hasSuffix(suffix)) {
            var line = this.lines[this.end.line];
            var end = this.end.position + suffix.length;
            var newline = line.substring(0, this.end.position) +
                line.substring(end, line.length);
            this.lines[this.end.line] = newline;
        }
    };

    // Set the prefix of each selected line. If the prefix is already and
    // set, the line willl be left alone.
    this.setLinePrefixes = function(prefix, increment) {
        increment = increment ? increment : false;
        for (var i=this.start.line; i <= this.end.line; i++) {
            if (!this.lines[i].startswith(prefix)) {
                // Check if prefix is incrementing
                if (increment) {
                    var num = parseInt(prefix.match(/\d+/)[0]);
                    prefix = prefix.replace(num, num+1);
                }
                // Add the prefix to the line
                var numspaces = this.lines[i].match(/^\s*/)[0].length;
                this.lines[i] = this.lines[i].lstrip();
                this.lines[i] = prefix + this.lines[i];
                if (i == this.start.line)
                    this.start.position += prefix.length - numspaces;
                if (i == this.end.line)
                    this.end.position += prefix.length - numspaces;
            }
        }
    };

    // Unwrap the selection prefix & suffix
    this.unwrap = function(prefix, suffix) {
        this.removePrefix(prefix);
        this.removeSuffix(suffix);
    };

    // Remove blank lines from before and after the selection.  If the
    // previous or next line is not blank, it will be left alone.
    this.unwrapBlankLines = function() {
        wysiwym.selection.removePreviousLine(/^\s*$/);
        wysiwym.selection.removeNextLine(/^\s*$/);
    };

    // Return the selection value
    this.val = function() {
        var value = '';
        for (var i=0; i < this.lines.length; i++) {
            var line = this.lines[i];
            if ((i == this.start.line) && (i == this.end.line)) {
                return line.substring(this.start.position, this.end.position);
            } else if (i == this.start.line) {
                value += line.substring(this.start.position, line.length) +'\n';
            } else if ((i > this.start.line) && (i < this.end.line)) {
                value += line +'\n';
            } else if (i == this.end.line) {
                value += line.substring(0, this.end.position)
            }
        }
        return value;
    };

    // Wrap the selection with the specified prefix & suffix
    this.wrap = function(prefix, suffix) {
        this.addPrefix(prefix);
        this.addSuffix(suffix);
    };

    // Wrap the selected lines with blank lines.  If there is already
    // a blank line in place, another one will not be added.
    this.wrapBlankLines = function() {
        if (wysiwym.selection.start.line > 0)
            wysiwym.selection.insertPreviousLine(BLANKLINE, false);
        if (wysiwym.selection.end.line < wysiwym.lines.length - 1)
            wysiwym.selection.insertNextLine(BLANKLINE, false);
    };

}


/*----------------------------------------------------------------------------------------------
 * Wysiwym Textarea
 * This can used used for some or all of your textarea modifications. It will keep track of
 * the the current text and selection positions. The general idea is to keep track of the
 * textarea in terms of Line objects.  A line object contains a lineType and supporting text.
 *--------------------------------------------------------------------------------------------- */
Wysiwym.Textarea = function(textarea) {
    this.textelem = textarea.get(0);                // Javascript textarea element
    this.textarea = textarea;                       // jQuery textarea object
    this.lines = [];                                // Current textarea lines
    this.selection = new Wysiwym.Selection(this);   // Selection properties & manipulation
    this.scroll = this.textelem.scrollTop;          // Current cursor scroll position

    // Return a string representation of this object.
    this.toString = function() {
        var str = 'TEXTAREA: #'+ this.textarea.attr('id') +'\n';
        str += this.selection.toString();
        str += 'SCROLL: '+ this.scroll +'px\n';
        str += '---\n';
        for (var i=0; i<this.lines.length; i++)
            str += 'LINE '+ i +': '+ this.lines[i] +'\n';
        return str;
    };

    // Return the current text value of this textarea object
    this.getProperties = function() {
        var newtext = '';           // New textarea value
        var selectionStart = 0;     // Absolute cursor start position
        var selectionEnd = 0;       // Absolute cursor end position
        for (var i=0; i < this.lines.length; i++) {
            if (i == this.selection.start.line)
                selectionStart = newtext.length + this.selection.start.position;
            if (i == this.selection.end.line)
                selectionEnd = newtext.length + this.selection.end.position;
            newtext += this.lines[i];
            if (i != this.lines.length - 1)
                newtext += '\n';
        }
        return [newtext, selectionStart, selectionEnd];
    };

    // Return the absolute start and end selection postions
    // StackOverflow #1: http://goo.gl/2vSnF
    // StackOverflow #2: http://goo.gl/KHm0d
    this.getSelectionStartEnd = function() {
        if (typeof(this.textelem.selectionStart) == 'number') {
            var startpos = this.textelem.selectionStart;
            var endpos = this.textelem.selectionEnd;
            if (this.textelem.value.indexOf('\r\n') !== -1) {
              //this fixes Opera, it has \r\n's instead of \n's
              startpos -= (this.textelem.value.substring(0, startpos).match(/\r\n/g)||[]).length;
              endpos -= (this.textelem.value.substring(0, endpos).match(/\r\n/g)||[]).length;
            }
        } else {
            this.textelem.focus();
            var text = this.textelem.value.replace(/\r\n/g, '\n');
            var textlen = text.length;
            var range = document.selection.createRange();
            var textrange = this.textelem.createTextRange();
            textrange.moveToBookmark(range.getBookmark());
            var endrange = this.textelem.createTextRange();
            endrange.collapse(false);
            if (textrange.compareEndPoints('StartToEnd', endrange) > -1) {
                var startpos = textlen;
                var endpos = textlen;
            } else {
                var startpos = -textrange.moveStart('character', -textlen);
                //startpos += text.slice(0, startpos).split('\n').length - 1;
                if (textrange.compareEndPoints('EndToEnd', endrange) > -1) {
                    var endpos = textlen;
                } else {
                    var endpos = -textrange.moveEnd('character', -textlen);
                    //endpos += text.slice(0, endpos).split('\n').length - 1;
                }
            }
        }
        return [startpos, endpos];
    };

    // Update the textarea with the current lines and cursor settings
    this.update = function() {
        var properties = this.getProperties();
        var newtext = properties[0];
        var selectionStart = properties[1];
        var selectionEnd = properties[2];
        this.textarea.val(newtext);
        if (this.textelem.setSelectionRange) {
            if (this.textelem.value.indexOf('\r\n') !== -1) {
              //this fixes Opera, it has \r\n's instead of \n's
              var virtual = newtext.replace(/\r\n/g,'\n');
              var deltaStart = (virtual.substring(0, selectionStart).match(/\n/g)||[]).length;
              var deltaEnd = (virtual.substring(0, selectionEnd).match(/\n/g)||[]).length;
              this.textelem.setSelectionRange(selectionStart + deltaStart, selectionEnd + deltaEnd);
            }else{
              this.textelem.setSelectionRange(selectionStart, selectionEnd);
            }
        } else if (this.textelem.createTextRange) {
            var range = this.textelem.createTextRange();
            range.collapse(true);
            range.moveStart('character', selectionStart);
            range.moveEnd('character', selectionEnd - selectionStart);
            range.select();
        }
        this.textelem.scrollTop = this.scroll;
        this.textarea.focus();
    };

    // Initialize the Wysiwym.Textarea
    this.init = function() {
        var text = textarea.val().replace(/\r\n/g, '\n');
        var selectionInfo = this.getSelectionStartEnd(this.textelem);
        var selectionStart = selectionInfo[0];
        var selectionEnd = selectionInfo[1];
        var endline = 0;
        while (endline >= 0) {
            var endline = text.indexOf('\n');
            var line = text.substring(0, endline >= 0 ? endline : text.length);
            if ((selectionStart <= line.length) && (selectionEnd >= 0)) {
                if (selectionStart >= 0) {
                    this.selection.start.line = this.lines.length;
                    this.selection.start.position = selectionStart;
                }
                if (selectionEnd <= line.length) {
                    this.selection.end.line = this.lines.length;
                    this.selection.end.position = selectionEnd;
                }
            }
            this.lines[this.lines.length] = line;
            text = endline >= 0 ? text.substring(endline + 1, text.length) : '';
            selectionStart -= endline + 1;
            selectionEnd -= endline + 1;
        }
        // Tweak the selection end position if its on the edge
        if ((this.selection.end.position == 0) && (this.selection.end.line != this.selection.start.line)) {
            this.selection.end.line -= 1;
            this.selection.end.position = this.lines[this.selection.end.line].length;
        }
    };
    this.init();
};


/*----------------------------------------------------------------------------------------------
 * Wysiwym Button
 * Represents a single button in the Wysiwym editor.
 *--------------------------------------------------------------------------------------------- */
Wysiwym.Button = function(name, callback, data, cssclass) {
    this.name = name;                  // Button Name
    this.callback = callback;          // Callback function for this button
    this.data = data ? data : {};      // Callback arguments
    this.cssclass = cssclass;          // CSS Class to apply to button

    // Return the CSS Class for this button
    this.getCssClass = function() {
        if (!this.cssclass)
            return "icon-" + this.name.toLowerCase().replace(' ', '');
        return "icon-" + this.cssclass;
    };

    // Create and return a new Button jQuery element
    this.create = function() {
        var button = $("<div></div>").addClass('btn').attr('title', this.name);
        var icon = $('<i class=""></i>').addClass(this.getCssClass());
        var text = $('<span class="text">'+ this.name +'</span>');
        text.attr('unselectable', 'on');
        icon.attr('unselectable', 'on');
        button.append(icon).append(text);
        return button;
    };
}


/*----------------------------------------------------------------------------------------------
 * Wysiwym Button Callbacks
 * Useful functions to help easily create Wysiwym buttons
 *--------------------------------------------------------------------------------------------- */
// Wrap the selected text with a prefix and suffix string.
Wysiwym.span = function(event) {
    var markup = event.data.markup;    // (required) Markup Language
    var prefix = event.data.prefix;    // (required) Text wrap prefix
    var suffix = event.data.suffix;    // (required) Text wrap suffix
    var text = event.data.text;        // (required) Default wrap text (if nothing selected)
    var wysiwym = new Wysiwym.Textarea(markup.textarea);
    if (wysiwym.selection.isWrapped(prefix, suffix)) {
        wysiwym.selection.unwrap(prefix, suffix);
    } else if (wysiwym.selection.length() == 0) {
        wysiwym.selection.append(text);
        wysiwym.selection.wrap(prefix, suffix);
    } else {
        wysiwym.selection.wrap(prefix, suffix);
    }
    wysiwym.update();
};

// Prefix each line in the selection with the specified text.
Wysiwym.list = function(event) {
    var markup = event.data.markup;    // (required) Markup Language
    var prefix = event.data.prefix;    // (required) Line prefix text
    var wrap = event.data.wrap;        // (optional) If true, wrap list with blank lines
    var regex = event.data.regex;      // (optional) Set to regex matching prefix to increment num
    var wysiwym = new Wysiwym.Textarea(markup.textarea);
    if (wysiwym.selection.linesHavePrefix(regex?regex:prefix)) {
        wysiwym.selection.removeLinePrefixes(regex?regex:prefix);
        if (wrap) { wysiwym.selection.unwrapBlankLines(); }
    } else {
        wysiwym.selection.setLinePrefixes(prefix, regex);
        if (wrap) { wysiwym.selection.wrapBlankLines(); }
    }
    wysiwym.update();
};

// Prefix each line in the selection according based off the first selected line.
Wysiwym.block = function(event) {
    var markup = event.data.markup;    // (required) Markup Language
    var prefix = event.data.prefix;    // (required) Line prefix text
    var wrap = event.data.wrap;        // (optional) If true, wrap list with blank lines
    var wysiwym = new Wysiwym.Textarea(markup.textarea);
    var firstline = wysiwym.selection.getLines()[0];
    if (firstline.startswith(prefix)) {
        wysiwym.selection.removeLinePrefixes(prefix);
        if (wrap) { wysiwym.selection.unwrapBlankLines(); }
    } else {
        wysiwym.selection.addLinePrefixes(prefix);
        if (wrap) { wysiwym.selection.wrapBlankLines(); }
    }
    wysiwym.update();
};


/*----------------------------------------------------------------------------------------------
 * Wysiwym AutoIndent
 * Handles auto-indentation when enter is pressed
 *--------------------------------------------------------------------------------------------- */
Wysiwym.autoIndent = function(event) {
    // Only continue if keyCode == 13
    if (event.keyCode != 13)
        return true;
    // ReturnKey pressed, lets indent!
    var markup = event.data.markup;    // Markup Language
    var wysiwym = new Wysiwym.Textarea(markup.textarea);
    var linenum = wysiwym.selection.start.line;
    var line = wysiwym.lines[linenum];
    var postcursor = line.substring(wysiwym.selection.start.position, line.length);
    // Make sure nothing is selected & there is no text after the cursor
    if ((wysiwym.selection.length() != 0) || (postcursor))
        return true;
    // So far so good; check for a matching indent regex
    for (var i=0; i < markup.autoindents.length; i++) {
        var regex = markup.autoindents[i];
        var matches = line.match(regex);
        if (matches) {
            var prefix = matches[0];
            var suffix = line.substring(prefix.length, line.length);
            // NOTE: If a selection is made in the regex, it's assumed that the
            // matching text is a number should be auto-incremented (ie: #. lists).
            if (matches.length == 2) {
                var num = parseInt(matches[1]);
                prefix = prefix.replace(matches[1], num+1);
            }
            if (suffix) {
                // Regular auto-indent; Repeat the prefix
                wysiwym.selection.addPrefix('\n'+ prefix);
                wysiwym.update();
                return false;
            } else {
                // Return on blank indented line (clear prefix)
                wysiwym.lines[linenum] = BLANKLINE;
                wysiwym.selection.start.position = 0;
                wysiwym.selection.end.position = wysiwym.selection.start.position;
                if (markup.exitindentblankline) {
                    wysiwym.selection.addPrefix('\n');
                }
                wysiwym.update();
                return false;
            }
        }
    }
    return true;
}


/* ---------------------------------------------------------------------------
 * Wysiwym Markdown
 * Markdown markup language for the Wysiwym editor
 * Reference: http://daringfireball.net/projects/markdown/syntax
 *---------------------------------------------------------------------------- */
Wysiwym.Markdown = function(textarea) {
    this.textarea = textarea;    // jQuery textarea object

    // Initialize the Markdown Buttons
    this.buttons = [
        new Wysiwym.Button('Bold',   Wysiwym.span,  {prefix:'**', suffix:'**', text:'strong text'}),
        new Wysiwym.Button('Italic', Wysiwym.span,  {prefix:'_',  suffix:'_',  text:'italic text'}),
        new Wysiwym.Button('Link',   Wysiwym.span,  {prefix:'[',  suffix:'](http://example.com)', text:'link text'}),
	'|',
        new Wysiwym.Button('Bullet List', Wysiwym.list, {prefix:'* ', wrap:true}),
        new Wysiwym.Button('Number List', Wysiwym.list, {prefix:'0. ', wrap:true, regex:/^\s*\d+\.\s/}),
	'|',
        new Wysiwym.Button('Quote',  Wysiwym.list,  {prefix:'> ',   wrap:true}),
        new Wysiwym.Button('Code',   Wysiwym.block, {prefix:'    ', wrap:true})
    ];

    // Configure auto-indenting
    this.exitindentblankline = true;    // True to insert blank line when exiting auto-indent ;)
    this.autoindents = [                // Regex lookups for auto-indent
        /^\s*\*\s/,                     // Bullet list
        /^\s*(\d+)\.\s/,                // Number list (number selected for auto-increment)
        /^\s*\>\s/,                     // Quote list
        /^\s{4}\s*/                     // Code block
    ];

    // Syntax items to display in the help box
    this.help = [
        { label: 'Header', syntax: '## Header ##' },
        { label: 'Bold',   syntax: '**bold**' },
        { label: 'Italic', syntax: '_italics_' },
        { label: 'Link',   syntax: '[pk!](http://google.com)' },
        { label: 'Bullet List', syntax: '* list item' },
        { label: 'Number List', syntax: '1. list item' },
        { label: 'Blockquote', syntax: '&gt; quoted text' },
        { label: 'Large Code Block', syntax: '(Begin lines with 4 spaces)' },
        { label: 'Inline Code Block', syntax: '&lt;code&gt;inline code&lt;/code&gt;' }
    ];
};


/* ---------------------------------------------------------------------------
 * Wysiwym Mediawiki
 * Media Wiki markup language for the Wysiwym editor
 * Reference: http://www.mediawiki.org/wiki/Help:Formatting
 *---------------------------------------------------------------------------- */
Wysiwym.Mediawiki = function(textarea) {
    this.textarea = textarea;    // jQuery textarea object

    // Initialize the Markdown Buttons
    this.buttons = [
        new Wysiwym.Button('Bold',   Wysiwym.span,  {prefix:"'''", suffix:"'''", text:'strong text'}),
        new Wysiwym.Button('Italic', Wysiwym.span,  {prefix:"''",  suffix:"''",  text:'italic text'}),
        new Wysiwym.Button('Link',   Wysiwym.span,  {prefix:'[http://example.com ',  suffix:']', text:'link text'}),
	'|',
        new Wysiwym.Button('Bullet List', Wysiwym.list, {prefix:'* ', wrap:true}),
        new Wysiwym.Button('Number List', Wysiwym.list, {prefix:'# ', wrap:true}),
	'|',
        new Wysiwym.Button('Quote',  Wysiwym.span,  {prefix:'<blockquote>', suffix:'</blockquote>', text:'quote text'}),
        new Wysiwym.Button('Code', Wysiwym.span,  {prefix:'<pre>', suffix:'</pre>', text:'code text'})
    ];

    // Configure auto-indenting
    this.exitindentblankline = true;    // True to insert blank line when exiting auto-indent ;)
    this.autoindents = [                // Regex lookups for auto-indent
        /^\s*\*\s/,                     // Bullet list
        /^\s*\#\s/                      // Number list
    ];

    // Syntax items to display in the help box
    this.help = [
        { label: 'Header', syntax: '== Header ==' },
        { label: 'Bold',   syntax: "'''bold'''" },
        { label: 'Italic', syntax: "''italics''" },
        { label: 'Link',   syntax: '[http://google.com pk!]' },
        { label: 'Bullet List', syntax: '* list item' },
        { label: 'Number List', syntax: '# list item' },
        { label: 'Blockquote', syntax: '&lt;blockquote&gt;quote&lt;/blockquote&gt;' },
        { label: 'Large Code Block', syntax: '&lt;pre&gt;Code block&lt;/pre&gt;' }
    ];
};


/* ---------------------------------------------------------------------------
 * Wysiwym BBCode
 * BBCode markup language for the Wysiwym editor
 * Reference: http://labs.spaceshipnofuture.org/icky/help/formatting/
 *---------------------------------------------------------------------------- */
Wysiwym.BBCode = function(textarea) {
    this.textarea = textarea;    // jQuery textarea object

    // Initialize the Markdown Buttons
    this.buttons = [
        new Wysiwym.Button('Bold',   Wysiwym.span,  {prefix:"[b]", suffix:"[/b]", text:'strong text'}),
        new Wysiwym.Button('Italic', Wysiwym.span,  {prefix:"[i]",  suffix:"[/i]",  text:'italic text'}),
        new Wysiwym.Button('Link',   Wysiwym.span,  {prefix:'[url="http://example.com"]',  suffix:'[/url]', text:'link text'}),
	'|',
        new Wysiwym.Button('Quote',  Wysiwym.span,  {prefix:'[quote]',  suffix:'[/quote]', text:'quote text'}),
        new Wysiwym.Button('Code',   Wysiwym.span,  {prefix:'[code]',  suffix:'[/code]', text:'code text'})
    ];

    // Syntax items to display in the help box
    this.help = [
        { label: 'Bold',   syntax: "[b]bold[/b]" },
        { label: 'Italic', syntax: "[i]italics[/i]" },
        { label: 'Link',   syntax: '[url="http://example.com"]pk![/url]' },
        { label: 'Blockquote', syntax: '[quote]quote text[/quote]' },
        { label: 'Large Code Block', syntax: '[code]code text[/code]' }
    ];
};


/*----------------------------------------------------------------------
 * Additional Javascript Prototypes
 *-------------------------------------------------------------------- */
String.prototype.strip = function() { return this.replace(/^\s+|\s+$/g, ''); };
String.prototype.lstrip = function() { return this.replace(/^\s+/, ''); };
String.prototype.rstrip = function() { return this.replace(/\s+$/, ''); };
String.prototype.startswith = function(str) { return this.substring(0, str.length) == str; };
String.prototype.endswith = function(str) { return this.substring(str.length, this.length) == str; };
