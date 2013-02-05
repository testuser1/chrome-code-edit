# Chrome code editor

A fork of the example in the chrome-app-samples repo.
Features bracket matching, crude tab system, ctrl-X shortcuts.

## Shortcuts
* Ctrl-O: Opens a file
* Ctrl-Q: Closes a file (Does not save, does not prompt - bad right now.) 
* Ctrl-S: Saves the file
* Ctrl-M: Manual mode change
* Ctrl-Space: Show an information dialog
* Ctrl-N: Creates a new file
* Shift-Ctrl-N: Opens a new window

## How to use
Open up a terminal and type this:
```shell
git clone https://github.com/james-clark/chrome-code-edit.git
cd chrome-code-edit
git submodule init
git submodule update
```

Then load into Chrome as an unpacked extension.

## APIs

* [chrome.fileSystem](http://developer.chrome.com/trunk/apps/fileSystem.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

