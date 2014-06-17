Pebble.addEventListener("ready",
  function (e) {
    console.log("JavaScript app ready and running!");
  }
);

//var token = "7094623010";
var token = "5490506011";//wielgus

var getUrl = function(type, id) {
  if(type === 0) {
    return 'http://api.infnotes.hern.as/notes';
  } else if(type === 1) {
    return 'http://api.infnotes.hern.as/notes/'+id;
  }
};

var lastNote;
var lastList;
var fetchData = function (id) {
    lastNote = null;
    var sendResultsToPebble = function (data) {
        var sendNextItem = function (index) {
            var dataToSend = {};
            if (data.length > index) {
                dataToSend["index"] = index;
                dataToSend["title"] = data[0].title;
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
        if (req.readyState == 4 && req.status == 200) {
            if (req.status == 200) {
                var response = JSON.parse(req.responseText);
                lastList = response;
                sendResultsToPebble(response);
            } else {
                console.log("Error");
            }
        }
    };
    req.send(null);
};

var fetchSingleNote = function (index, page) {
  var parseText = function(text) {
      text = text.replace("\n", " ");
    var newText = text;
    return newText;
  }

  var success = function(note) {
    var text = note.text.substr(page*200, 200);
    console.log('PAGE: '+page+', Text will be sent: '+text);

    var data = {"text": text}
    data.pages = Math.ceil(note.text.length/200)
    Pebble.sendAppMessage(data,
      function () {

      }, function () {
        console.log('Text fucked');
      }
    );
  }
  if(!lastNote) {
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
                response.text = parseText(response.text);
                lastNote = response;
                success(lastNote)
            } else {
                console.log("Error");
            }
        }
    };
    req.send(null);
  } else {
    success(lastNote)
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