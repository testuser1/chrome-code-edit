var editor;
var modename = "";
var mtitle = "";
var buffers = {};
var properties = {};
var tabs = [];
var currentTab;
var fileEntry;
var hasWriteAccess;
var currentFile;

//Open file in editor after picker
var onOpenFile = function(theFileEntry) {
  if (buffers.hasOwnProperty(theFileEntry.name)) {
    switchTab(theFileEntry.name);
  } else {
    readFileIntoEditor(theFileEntry);
  }
};

//Save the file after picker
var onSaveFile = function(theFileEntry) {
  writeEditorToFile(theFileEntry);
};

//Handle filesystem errors
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

//Get file type.
function getExtension(filename) {
  return filename.split('.').pop();
}

//Set mode based on file type
function handleDocumentChange(title) {
  var mode = "plaintext";
  var modeName = "Plain Text";
  if (title) {
    title = title.match(/[^/]+$/)[0];
    this.mtitle = title;
    document.title = title;
    if (filetypes[getExtension(title)]) {
      modeChange(filetypes[getExtension(title)]);
    } else {
      modeChange("plaintext");
    }
  } else {
    this.mtitle = "[no document loaded]";
  }
}

//Open file
function readFileIntoEditor(theFileEntry) {
  if (theFileEntry) {
    theFileEntry.file(function(file) {
      var fileReader = new FileReader();

      fileReader.onload = function(e) {
        openBuffer(theFileEntry.name,true,theFileEntry,e.target.result);
        switchTab(theFileEntry.name);
      };

      fileReader.onerror = function(e) {
        console.log("Read failed: " + e.toString());
      };

      fileReader.readAsText(file);
    }, errorHandler);
  }
}

//Save file
function writeEditorToFile(theFileEntry) {
  theFileEntry.createWriter(function(fileWriter) {
    fileWriter.onerror = function(e) {
      console.log("Write failed: " + e.toString());
    };

    var blob = new Blob([editor.getValue()]);
    fileWriter.truncate(blob.size);
    fileWriter.onwriteend = function() {
      fileWriter.onwriteend = function(e) {
        handleDocumentChange(theFileEntry.name);
        setFile(theFileEntry.name);
        console.log("Write completed.");
      };

      fileWriter.write(blob);
    }
  }, errorHandler);
}

//Change the mode
function modeChange(mode, manual){
	if(mode == "plaintext") return;
	this.modename = mode;
	editor.setOption("mode", mode);
  CodeMirror.autoLoadMode(editor, mode);
  if(mode == "clike") editor.setOption("mode","text/x-csrc");
  if(manual) this.modename = mode + " (Manual Change)";
}

//For scrolling the tab bar
//TODO: make better...
function moveElement(elementId, by){
  var elementToMove = document.getElementById(elementId);
  var s = elementToMove.style.left;
  if(s == "") s = "30px";
  var re = /px$/;
  s.replace(re, "");
  var t = parseInt(s);
  if(by < 0 && elementToMove.scrollWidth > elementToMove.clientWidth) elementToMove.style.left = (t + by) + "px";
  if(by > 0 && t < 30) elementToMove.style.left = (t + by) + "px";
}

//Switch to next tab
function nextTab(backward){
  var changeTo;
  if (tabs.length == 1){return;}
  if ((currentTab == (tabs.length-1)) && !backward){
    changeTo = 0;
  } else if ((currentTab == 0) && backward){
    changeTo = tabs.length-1;
  } else if (backward) {
    changeTo = currentTab -1;
  } else {
    changeTo = currentTab +1;
  }
  var newtab = tabs[changeTo];
  switchTab(newtab);
}

var onSaveFile = function(theFileEntry) {
	if (theFileEntry.name != currentFile){
		var tab = document.getElementById(currentFile);
		properties[theFileEntry.name] = properties[currentFile];
		buffers[theFileEntry.name] = buffers[currentFile];
		delete properties[currentFile];
		delete buffers[currentFile];
		tabs[currentTab] = theFileEntry.name;
		tab.setAttribute("id",theFileEntry.name);
		tab.innerHTML = theFileEntry.name;
		tab.onclick = function(){switchToMe(theFileEntry.name);};
		setFile(theFileEntry.name);
	}
  writeEditorToFile(theFileEntry);
};

//Adds a new tab
function addTab(name){
  var item_link = document.createElement('a');
  var tabs_list = document.getElementById('tabs');
  item_link.appendChild(document.createTextNode(name));
  item_link.setAttribute("href","#");
  item_link.setAttribute("id",name);
  tabs_list.appendChild(item_link);
  document.getElementById(name).addEventListener("click", function(){switchTab(name);});
  currentTab = tabs.push(name);
}

//Removes a tab
function removeTab(name){
  var next;
  document.getElementById(name).remove();
  delete buffers[name];
  var index = tabs.indexOf(name);
  if (index == -1) return false;
  if (index < (tabs.length - 1)){next = tabs[index + 1]} else {next = tabs[0]};
  tabs.splice(index,1);
  if (tabs.length > 0){switchTab(next);} else {newBuffer("untitled");}
}

//Switches to a new tab
function switchTab(name){
  var item = document.getElementById(name);
  var list_items = document.getElementById("tabs").children;
  for(var i = 0; i < list_items.length; i++){
    list_items.item(i).setAttribute("class","inactive");
  }
  item.setAttribute("class","active");
  selectBuffer(name);
  currentTab = tabs.indexOf(name);
}

//Opens a new buffer given a file
function openBuffer(mName, writeable, file, text, mode) {
  buffers[mName] = CodeMirror.Doc(text, mode);
  properties[mName] = {isWritable:writeable,fileEntry:file};
  addTab(mName);
}

//Creates a new buffer with no file entry
function newBuffer(name) {
  openBuffer(name, false, null, "", "plaintext");
  switchTab(name);
}

//Sets the current buffer (file) to display
function selectBuffer(name) {
  var buf = buffers[name];
  var old = editor.swapDoc(buf);
  editor.focus();
  setFile(name);
  handleDocumentChange(name);
}

//Set variables of current file loaded
function setFile(name) {
  fileEntry = properties[name].fileEntry;
  hasWriteAccess = properties[name].isWritable;
  currentFile = name;
}

//Handler for new key
function handleNewButton(newWindow) {
  if (!newWindow) {
    editor.openDialog('New File: <input type="text" style="width: 10em"/>', function(query) {
      if (query == null || query == "") return;
      if (buffers.hasOwnProperty(query)) {
        prompt("There's already a buffer by that name.");
        return;
      }
      newBuffer(query);
    },{bottom:true});
  } else {
    chrome.app.window.create('main.html', {
      frame: 'chrome', width: 720, height: 400
    });
  }
}

//Handler for mode key
function handleModeButton() {
  editor.openDialog('Change mode: <input type="text" style="width: 10em"/>', function(query) {
      if (query == null) return;
      modeChange(query, true);
    },{bottom:true});
}

//Handler for open key
function handleOpenButton() {
  chrome.fileSystem.chooseEntry({ type: 'openWritableFile' }, onOpenFile);
}

//Handler for close tab key
function handleCloseButton() {
  removeTab(currentFile);
}

//Handler for info key
function handleInfoButton(){
  if (editor.openDialog) editor.openDialog('<span class="bold">File:</span> ' + mtitle + ' <span class="bold" style="padding-left:8px; border-left: 1px solid #333;">Mode:</span> ' + modename + '<button style="position:absolute;left:-1000px;"/>', [], {bottom:true});
}

//Handler for save key
function handleSaveButton() {
  if (fileEntry && hasWriteAccess) {
    writeEditorToFile(fileEntry);
  } else {
    chrome.fileSystem.chooseEntry({ type: 'saveFile' }, onSaveFile);
  }
}

onload = function() {
  document.getElementById("back").addEventListener("click", function(){moveElement("tabs", 100);});
  document.getElementById("forward").addEventListener("click", function(){moveElement("tabs", -100);});

  CodeMirror.modeURL = "cm/mode/%N/%N.js";
  editor = CodeMirror(
    document.getElementById("editor"),
    {
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentUnit: 2,
      indentWithTabs: true,
      matchBrackets: true,
      theme: "monokai",
      extraKeys: {
        "Cmd-S": function(instance) { handleSaveButton() },
        "Ctrl-S": function(instance) { handleSaveButton() },
        "Cmd-O": function(instance) { handleOpenButton() },
        "Ctrl-O": function(instance) { handleOpenButton() },
        "Cmd-N": function(instance) { handleNewButton() },
        "Ctrl-N": function(instance) { handleNewButton() },
        "Cmd-M": function(instance) { handleModeButton() },
        "Ctrl-M": function(instance) { handleModeButton() },
        "Cmd-Q": function(instance) { handleCloseButton() },
        "Ctrl-Q": function(instance) { handleCloseButton() },
        "Shift-Cmd-N": function(instance) { handleNewButton(true) },
        "Shift-Ctrl-N": function(instance) { handleNewButton(true) },
        "Cmd-Space": function(instance) { handleInfoButton() },
        "Ctrl-Space": function(instance) { handleInfoButton() },
        "Cmd-Tab": function(instance) { nextTab(false) },
        "Ctrl-Tab": function(instance) { nextTab(false) },
        "Shift-Cmd-Tab": function(instance) { nextTab(true) },
        "Shift-Ctrl-Tab": function(instance) { nextTab(true) }
      }
    });
  editor.on("cursorActivity", function() {
    editor.matchHighlight("CodeMirror-matchhighlight");
  });
  newBuffer("untitled");
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
