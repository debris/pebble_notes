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

var lastNote={};
var lastList;
var fetchData = function (id) {
    lastNote = {};
    var sendResultsToPebble = function (data) {
        var sendNextItem = function (index) {
            var dataToSend = {};
            if (data.length > index) {
                dataToSend["index"] = index;
                dataToSend["title"] = data[index].title;
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
                Pebble.sendAppMessage({"end": 1}, 
                  function () {
                    console.log('End sent');
                  }, function () {
                    console.log('End fucked');
                  }
                );
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
    var req = new XMLHttpRequest();
    req.setRequestHeader('Authorization', token);

    var url = getUrl(0, id);
    console.info('Fetching notes with parent category: ' + id);
    console.log('Loading "' + url + '"');
    req.open('GET', url, true);
    req.onload = function (e) {
        console.log('Loaded with status: ' + req.status + ', ready state: ' + req.readyState);
        if (req.readyState == 4) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                lastList = response;
                sendResultsToPebble(response);
            } else {
                Pebble.sendAppMessage({"end": 0}, 
                  function () {
                  }, function () {
                  }
                );
            } 
        } else {
          Pebble.sendAppMessage({"end": 2}, 
            function () {
            }, function () {
            }
          );
        }
    };
    req.send(null);
};

var fetchSingleNote = function (index, page) {
  var success = function(note) {
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
  }
  if(!lastNote[index]) {
    var req = new XMLHttpRequest();
    req.setRequestHeader('Authorization', token);
    var id = lastList[index]._id;
    var url = getUrl(1, id);
    console.info('Fetching note with id: ' + id);
    console.log('Loading "' + url + '"');
    req.open('GET', url, true);
    req.onload = function (e) {
        console.log('Loaded with status: ' + req.status + ', ready state: ' + req.readyState);
        if (req.readyState == 4 && req.status == 200) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                lastNote[index] = response;
                success(lastNote[index])
            } else {
                console.log("Error");
            }
        }
    };
    req.send(null);
  } else {
    success(lastNote[index])
  }
};


var lastNoteIndex;
Pebble.addEventListener("appmessage",
  function (e) {
    var type = e.payload.type;
    var id = e.payload.id;
    if(type==0) {
        fetchData(id);
    } else if(type==1) {
      lastNoteIndex = id;
      fetchSingleNote(id, 0);
    } else if(type==2) {
      fetchSingleNote(lastNoteIndex, id);
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


