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


function setFile(name) {
  fileEntry = properties[name].fileEntry;
  hasWriteAccess = properties[name].isWritable;
  currentFile = name;
}

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

function getExtension(filename) {
  return filename.split('.').pop();
}

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

function readFileIntoEditor(theFileEntry) {
  if (theFileEntry) {
    theFileEntry.file(function(file) {
      var fileReader = new FileReader();

      fileReader.onload = function(e) {
        openBuffer(theFileEntry.name,true,theFileEntry,e.target.result);
        setFile(theFileEntry.name);
        switchToMe(theFileEntry.name);
        handleDocumentChange(theFileEntry.name);
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
        handleDocumentChange(theFileEntry.name);
        console.log("Write completed.");
      };

      fileWriter.write(blob);
    }
  }, errorHandler);
}

var onOpenFile = function(theFileEntry) {
  if (buffers.hasOwnProperty(theFileEntry.name)) {
    switchToMe(theFileEntry.name);
  } else {
    readFileIntoEditor(theFileEntry);
  }
};

var onSaveFile = function(theFileEntry) {
  writeEditorToFile(theFileEntry);
};

function handleNewButton(newWindow) {
  if (!newWindow) {
    editor.openDialog('New File: <input type="text" style="width: 10em"/>', function(query) {
      if (query == null) return;
      if (buffers.hasOwnProperty(query)) {
        prompt("There's already a buffer by that name.");
        return;
      }
      newBuf(query);
    },{bottom:true});
  } else {
    chrome.app.window.create('main.html', {
      frame: 'chrome', width: 720, height: 400
    });
  }
}

function handleModeButton() {
  editor.openDialog('Change mode: <input type="text" style="width: 10em"/>', function(query) {
      if (query == null) return;
      modeChange(query, true);
    },{bottom:true});
}

function handleOpenButton() {
  chrome.fileSystem.chooseEntry({ type: 'openWritableFile' }, onOpenFile);
}

function handleCloseButton() {
  removeTab(currentFile);
}

function handleInfoButton(){
  if (editor.openDialog) editor.openDialog('<span class="bold">File:</span> ' + mtitle + ' <span class="bold" style="padding-left:8px; border-left: 1px solid #333;">Mode:</span> ' + modename + '<button style="position:absolute;left:-1000px;"/>', [], {bottom:true});
}

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
	newBuf("untitled");
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

function modeChange(mode, manual){
  editor.setOption("mode", mode);
  CodeMirror.autoLoadMode(editor, mode);
  this.modename = mode;
  if(mode == "clike") editor.setOption("mode","text/x-csrc");
  if(manual) this.modename = mode + " (Manual Change)";
}

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
  switchToMe(newtab);
}

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

function switchToMe(name){
  var item = document.getElementById(name);
  var list_items = document.getElementById("tabs").children;
  for(var i = 0; i < list_items.length; i++){
    list_items.item(i).setAttribute("class","inactive");
  }
  item.setAttribute("class","active");
  selectBuffer(name);
  currentTab = tabs.indexOf(name);
}

function addTab(name){
  var item_link = document.createElement('a');
  var tabs_list = document.getElementById('tabs');
  item_link.appendChild(document.createTextNode(name));
  item_link.setAttribute("href","#");
  item_link.setAttribute("id",name);
  tabs_list.appendChild(item_link);
  document.getElementById(name).addEventListener("click", function(){switchToMe(name);});
  currentTab = tabs.push(name);
}

function removeTab(name){
  var next;
  document.getElementById(name).remove();
  delete buffers[name];
  var index = tabs.indexOf(name);
  if (index == -1) return false;
  if (index < (tabs.length - 1)){next = tabs[index + 1]} else {next = tabs[0]};
  tabs.splice(index,1);
  if (tabs.length > 0){switchToMe(next);} else {newBuf("untitled");}
}

function openBuffer(mName, writeable, file, text, mode) {
  buffers[mName] = CodeMirror.Doc(text, mode);
  properties[mName] = {isWritable:writeable,fileEntry:file};
  addTab(mName);
}

function newBuf(name) {
  openBuffer(name, false, null, "", "plaintext");
  switchToMe(name);
  setFile(name);
  handleDocumentChange(name);
}

function selectBuffer(name) {
  var buf = buffers[name];
  if (buf.getEditor()) buf = buf.linkedDoc({sharedHist: true});
  var old = editor.swapDoc(buf);
  var linked = old.iterLinkedDocs(function(doc) {linked = doc;});
  if (linked) {
    // Make sure the document in buffers is the one the other view is looking at
    for (var name in buffers) if (buffers[name] == old) buffers[name] = linked;
    old.unlinkDoc(linked);
  }
  editor.focus();
  setFile(name);
}

function nodeContent(id) {
  var node = document.getElementById(id), val = node.textContent || node.innerText;
  val = val.slice(val.match(/^\s*/)[0].length, val.length - val.match(/\s*$/)[0].length) + "\n";
  return val;
}
