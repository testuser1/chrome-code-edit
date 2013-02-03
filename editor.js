var newButton, openButton, saveButton;
var editor;
var fileEntry;
var hasWriteAccess;

function errorHandler(e) {
  var msg = "";

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
    msg = "QUOTA_EXCEEDED_ERR";
    break;
    case FileError.NOT_FOUND_ERR:
    msg = "NOT_FOUND_ERR";
    break;
    case FileError.SECURITY_ERR:
    msg = "SECURITY_ERR";
    break;
    case FileError.INVALID_MODIFICATION_ERR:
    msg = "INVALID_MODIFICATION_ERR";
    break;
    case FileError.INVALID_STATE_ERR:
    msg = "INVALID_STATE_ERR";
    break;
    default:
    msg = "Unknown Error";
    break;
  };

  console.log("Error: " + msg);
}
var modename = "";
var mtitle = "";
function handleDocumentChange(title) {
  var mode = "plaintext";
  var modeName = "Plain Text";
  if (title) {
    title = title.match(/[^/]+$/)[0];
    this.mtitle = title;
    document.title = title;
    if (title.match(/.json$/)) {
      mode = {name: "javascript", json: true};
      modeName = "JavaScript (JSON)";
    } else if (title.match(/.html$/)) {
      mode = "htmlmixed";
      modeName = "HTML";
    } else if (title.match(/.css$/)) {
      mode = "css";
      modeName = "CSS";
    }
  } else {
    this.mtitle = "[no document loaded]";
  }
  editor.setOption("mode", mode);
  this.modename = modeName;
}

function newFile() {
  fileEntry = null;
  hasWriteAccess = false;
  handleDocumentChange(null);
}

function setFile(theFileEntry, isWritable) {
  fileEntry = theFileEntry;
  hasWriteAccess = isWritable;
}

function readFileIntoEditor(theFileEntry) {
  if (theFileEntry) {
    theFileEntry.file(function(file) {
      var fileReader = new FileReader();

      fileReader.onload = function(e) {
        handleDocumentChange(theFileEntry.fullPath);
        editor.setValue(e.target.result);
      };

      fileReader.onerror = function(e) {
        console.log("Read failed: " + e.toString());
      };

      fileReader.readAsText(file);
    }, errorHandler);
  }
}

function writeEditorToFile(theFileEntry) {
  theFileEntry.createWriter(function(fileWriter) {
    fileWriter.onerror = function(e) {
      console.log("Write failed: " + e.toString());
    };

    var blob = new Blob([editor.getValue()]);
    fileWriter.truncate(blob.size);
    fileWriter.onwriteend = function() {
      fileWriter.onwriteend = function(e) {
        handleDocumentChange(theFileEntry.fullPath);
        console.log("Write completed.");
      };

      fileWriter.write(blob);
    }
  }, errorHandler);
}

var onChosenFileToOpen = function(theFileEntry) {
  setFile(theFileEntry, false);
  readFileIntoEditor(theFileEntry);
};

var onWritableFileToOpen = function(theFileEntry) {
  setFile(theFileEntry, true);
  readFileIntoEditor(theFileEntry);
};

var onChosenFileToSave = function(theFileEntry) {
  setFile(theFileEntry, true);
  writeEditorToFile(theFileEntry);
};

function handleNewButton() {
  if (false) {
    newFile();
    editor.setValue("");
  } else {
    chrome.app.window.create('main.html', {
      frame: 'chrome', width: 720, height: 400
    });
  }
}

function handleOpenButton() {
  chrome.fileSystem.chooseEntry({ type: 'openFile' }, onChosenFileToOpen);
}

function handleInfoButton(){
  if (editor.openDialog) editor.openDialog("File: " + mtitle + " Mode: " + modename + "<button style='position:absolute;left:-1000px;'/>", [], {bottom:true});
}

function handleSaveButton() {
  if (fileEntry && hasWriteAccess) {
    writeEditorToFile(fileEntry);
  } else {
    chrome.fileSystem.chooseEntry({ type: 'saveFile' }, onChosenFileToSave);
  }
}

function initContextMenu() {
  chrome.contextMenus.removeAll(function() {
    for (var snippetName in SNIPPETS) {
      chrome.contextMenus.create({
        title: snippetName,
        id: snippetName,
        contexts: ['all']
      });
    }
  });
}

chrome.contextMenus.onClicked.addListener(function(info) {
  // Context menu command wasn't meant for us.
  if (!document.hasFocus()) {
    return;
  }

  editor.replaceSelection(SNIPPETS[info.menuItemId]);
});

onload = function() {
  initContextMenu();

  newButton = document.getElementById("new");
  openButton = document.getElementById("open");
  saveButton = document.getElementById("save");

  newButton.addEventListener("click", handleNewButton);
  openButton.addEventListener("click", handleOpenButton);
  saveButton.addEventListener("click", handleSaveButton);

  editor = CodeMirror(
    document.getElementById("editor"),
    {
      lineNumbers: true,
      lineWrapping: true,
      theme: "monokai",
      extraKeys: {
        "Cmd-S": function(instance) { handleSaveButton() },
        "Ctrl-S": function(instance) { handleSaveButton() },
        "Cmd-O": function(instance) { handleOpenButton() },
        "Ctrl-O": function(instance) { handleOpenButton() },
        "Cmd-Space": function(instance) { handleInfoButton() },
        "Ctrl-Space": function(instance) { handleInfoButton() },
      }
    });
  editor.on("cursorActivity", function() {
    editor.matchHighlight("CodeMirror-matchhighlight");
  });

  newFile();
  onresize();
};

onresize = function() {
  var container = document.getElementById('editor');
  var containerWidth = container.offsetWidth;
  var containerHeight = container.offsetHeight;

  var scrollerElement = editor.getScrollerElement();
  scrollerElement.style.width = containerWidth + 'px';
  scrollerElement.style.height = containerHeight + 'px';

  editor.refresh();
}
