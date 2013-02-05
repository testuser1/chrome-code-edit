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
* Ctrl-Tab: Move one file to the right
* Shift-Ctrl-N: Move one file to the left

## How to use
Open up a terminal and type this:
```shell
git clone https://github.com/james-clark/chrome-code-edit.git
cd chrome-code-edit
git submodule init
git submodule update
```

Then load into Chrome as an unpacked extension.

## Disclaimer
This was made for my personal use, so there might be better ways to do things - I'm not very experienced.
Feel free to submit a pull request if there is anything you can do better :)
