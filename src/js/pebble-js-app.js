Pebble.addEventListener("ready",
  function (e) {
    console.log("JavaScript app ready and running!");
  }
);

var getUrl = function(type, id) {
  if(type === 0) {
    return 'http://pebblenotes.apiary.io/notes';
  } else if(type === 1) {
    return 'http://pebblenotes.apiary.io/notes/'+id;
  }
};

var lastList;
var fetchData = function (id) {
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
  var lastNote;
  var parseText = function(text) {
    var newText = "";
    console.info("text.length: "+text.length);
    for(var i=0; i<text.length; i+=19) {
      newText += text.substr(i, 19)+"\n";
    }
    return newText;
  }

  var success = function(note, sendPagesInfo) {
    var text = note.text.substr(page+200, 200);
    console.log('PAGE: '+page+', Text will be sent: '+text);

    var data = {"text": text}
    if( sendPagesInfo) {
      data.pages = Math.ceil(note.text.length/200)
    }
    Pebble.sendAppMessage(data, 
      function () {

      }, function () {
        console.log('Text fucked');
      }
    );
  }
  if(!lastNote) {
    var req = new XMLHttpRequest();
    var id = lastList[index].id;
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
                var lastNote = response;
                success(lastNote, true)
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



Pebble.addEventListener("appmessage",
  function (e) {
    var type = e.payload.type;
    var id = e.payload.id;
    if(type==0) {
        fetchData(id);
    } else if(type==1) {
        fetchSingleNote(id, 0);
    }
    
  }
);