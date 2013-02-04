var editor;
var modename = "";
var mtitle = "";
var buffers = {};
var properties = {};
var fileEntry;
var hasWriteAccess;


function setFile(name) {
  fileEntry = properties[name].fileEntry;
  hasWriteAccess = properties[name].isWritable;
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
    } else if (title.match(/.js$/)) {
      mode = "javascript";
      modeName = "Javascript";
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

function readFileIntoEditor(theFileEntry) {
  if (theFileEntry) {
    theFileEntry.file(function(file) {
      var fileReader = new FileReader();

      fileReader.onload = function(e) {
        openBuffer(theFileEntry.name,true,theFileEntry,e.target.result);
        setFile(theFileEntry.name);
        selectBuffer(theFileEntry.name);
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
    selectBuffer(theFileEntry.name);
  } else {
    readFileIntoEditor(theFileEntry);
  }
};

var onSaveFile = function(theFileEntry) {
  writeEditorToFile(theFileEntry);
};

function handleNewButton(derp) {
  if (!derp) {
    newBuf();
  } else {
    chrome.app.window.create('main.html', {
      frame: 'chrome', width: 720, height: 400
    });
  }
}

function handleOpenButton() {
  chrome.fileSystem.chooseEntry({ type: 'openWritableFile' }, onOpenFile);
}

function handleInfoButton(){
  if (editor.openDialog) editor.openDialog("File: " + mtitle + " Mode: " + modename + "<button style='position:absolute;left:-1000px;'/>", [], {bottom:true});
}

function handleSaveButton() {
  if (fileEntry && hasWriteAccess) {
    writeEditorToFile(fileEntry);
  } else {
    chrome.fileSystem.chooseEntry({ type: 'saveFile' }, onSaveFile);
  }
}

onload = function() {
  editor = CodeMirror(
    document.getElementById("editor"),
    {
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentUnit: 2,
      indentWithTabs: true,
      theme: "monokai",
      extraKeys: {
        "Cmd-S": function(instance) { handleSaveButton() },
        "Ctrl-S": function(instance) { handleSaveButton() },
        "Cmd-O": function(instance) { handleOpenButton() },
        "Ctrl-O": function(instance) { handleOpenButton() },
        "Cmd-N": function(instance) { handleNewButton() },
        "Ctrl-N": function(instance) { handleNewButton() },
        "Cmd-Space": function(instance) { handleInfoButton() },
        "Ctrl-Space": function(instance) { handleInfoButton() },
      }
    });
  editor.on("cursorActivity", function() {
    editor.matchHighlight("CodeMirror-matchhighlight");
  });

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

function switchToMe(name){
  var item = document.getElementById(name);
  var list_items = document.getElementById("tab_list").children;
  for(var i = 0; i < list_items.length; i++){
    list_items.item(i).setAttribute("class");
  }
  item.setAttribute("class","active");
  selectBuffer(name);
}

function openBuffer(mName, writeable, file, text, mode) {
  buffers[mName] = CodeMirror.Doc(text, mode);
  properties[mName] = new Object();
  properties[mName].isWritable = writeable;
  properties[mName].fileEntry = file;
  var item_link = document.createElement('span');
  var tabs_list = document.getElementById('tab_list');
  item_link.appendChild(document.createTextNode(mName));
  item_link.setAttribute("href","#");
  item_link.setAttribute("id",mName);
  tabs_list.appendChild(item_link);
  document.getElementById(mName).addEventListener("click", switchToMe(mName));
}

function newBuf() {
  editor.openDialog('New File: <input type="text" style="width: 10em"/>', function(query) {
    if (query == null) return;
    if (buffers.hasOwnProperty(query)) {
      prompt("There's already a buffer by that name.");
      return;
    }
    openBuffer(query, false, null, "", "plaintext");
    selectBuffer(query);
  },{bottom:true});
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
