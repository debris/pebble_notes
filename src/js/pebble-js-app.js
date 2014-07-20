var token;
Pebble.addEventListener("ready",
  function (e) {
    console.log("JavaScript app ready and running!");
    token = localStorage.getItem('token');
    console.info('Token found: '+token);
  }
);

var getUrl = function(type, id) {
  if(type === 0) {
    return 'http://api.infnotes.hern.as/notes';
  } else if(type === 1) {
    return 'http://api.infnotes.hern.as/notes/'+id;
  } else if(type === 2) {
    return 'http://infnotes.hern.as/#/pebblelogin/'+id;
  }
};


var sendEndList = function(status) {
  if(typeof status == 'undefined') {
    status = 0;
  }
  Pebble.sendAppMessage({"end": status}, function () {}, function () {});
}
var notes = null;
var getNotes = function(callback, failure, category, forceReload) {
  var notesOnDisk = localStorage.getItem("notes");

  var downloadNotesFromAPI = function() {
    var req = new XMLHttpRequest();
    var url = getUrl(0, category);
    console.info('Fetching notes with parent category: ' + category);
    console.log('Loading "' + url + '"');
    req.open('GET', url, true);
    req.setRequestHeader('Authorization', token);
    req.onload = function (e) {
        console.log('Loaded with status: ' + req.status + ', ready state: ' + req.readyState);
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                notes = response;
                localStorage.setItem("notes", JSON.stringify(notes));
                callback(response);
            } else {
              failure(0);
            }
        } else {
          failure(2);
        }
    };
    req.send(null);
  }
  if(forceReload) {
    downloadNotesFromAPI();
  } else {
    try {
      if(!notes) {
        notes = JSON.parse(notesOnDisk);
      }
      callback(notes);
    } catch(err) {
      downloadNotesFromAPI();
    }
  }
}

var lastNote={};
var fetchData = function (id, forceReload) {
    lastNote = {};
    var sendResultsToPebble = function (data) {
        var sendNextItem = function (index) {
            var dataToSend = {};
            if (data.length > index) {
                dataToSend["index"] = index;
                var title =  data[index].title.replace(/[^\x00-\x7F]/g, "").substr(0,13);
                var subtitle =  data[index].title.replace(/[^\x00-\x7F]/g, "").substr(13, 13);
                dataToSend["title"] = title;
                dataToSend["subtitle"] = subtitle;
                console.log('Data to send: ' + JSON.stringify(dataToSend));
                Pebble.sendAppMessage(dataToSend, 
                  function () {
                    sendNextItem(index+1);
                  }, function () {
                    console.log('Item ' + index + ' fucked');
                    sendNextItem(index+1);
                  }
                );
            } else {
               sendEndList(1);
            }
        };

        var transactionId = Pebble.sendAppMessage({ "length": data.length },
          function (e) {
            console.log("Successfully delivered message with transactionId=" + e.data.transactionId);
            sendNextItem(0, 0);
          },
          function (e) {
            console.log("Unable to deliver message with transactionId=" + e.data.transactionId + " Error is: " + JSON.stringify(e));
          }
        );
        console.log("Sending message, transactionId=" + transactionId);
    };
  getNotes(function(notes) {
    sendResultsToPebble(notes);
  }, function(status) {
    sendEndList(status);
  }, id, forceReload);
};

var fetchSingleNote = function (index, page) {
  var note = notes[index];
  var text = note.pebble_text[page];
  console.log('PAGE: '+page+', Text will be sent: '+text);

  var data = {"text": text}
  data.pages = note.pebble_text.length;
  Pebble.sendAppMessage(data,
    function () {

    }, function () {
      console.log('Text fucked');
    }
  );
};


var lastNoteIndex;
Pebble.addEventListener("appmessage",
  function (e) {
    var type = e.payload.type;
    var id = e.payload.id;
    console.info('Got appmessage: type:'+type+', id:'+id);
    if(type==0) {
        fetchData(id);
    } else if(type==1) {
      lastNoteIndex = id;
      fetchSingleNote(id, 0);
    } else if(type==2) {
      fetchSingleNote(lastNoteIndex, id);
    } else if(type==3) {
      fetchData(id, true);
    }
    
  }
);

Pebble.addEventListener("showConfiguration",
  function (e) {
    var url = getUrl(2, token);
    console.log("Opening: " + url);
    Pebble.openURL(url);
  }
);

Pebble.addEventListener("webviewclosed",
  function(e) {
    console.log("Configuration window returned: " + e.response);
    if(e.response) {
     token = e.response;
     localStorage.setItem('token', token)
    }
  }
);


