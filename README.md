# edit0r
This is a simple *prototype* of text editor created using HTML and Javascript. It takes textarea and converts it into 
nice looking (soon) editor.

It is not totally functional and it has many bugs. Also, when it gets into some sort of working stable status, it will require
re-factoring.

## Requirements
Requires June library at least in version 0.2. It can be found at the following URL: https://github.com/LaatuGroup/june.
It is a submodule linked to vendor/laatu/june.

## Running
Please download all the files and run test.html. There is an *init()* method called on *laatuJsEditor* object that initialises
the editor.

### Future work
Features to be implemented:
* basic vim functionality (since vim is our favourite editor);
* templates system (we might want some parts of our text to be editable and some don't);
* use of browser storage;
* api for things like validation, syntax highlighting, importing and exporting.

### Known bugs so far
JUNE needs updating!

This list should probably be much longer:
* when line gets empty, a space is getting inserted so that *pre* tag does not dissapear;
* cursor should not get out of the box (both up and down);
* if cursor gets out of the element then lines container should be scrolled so that the cursor stays viewable.
