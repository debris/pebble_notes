Pebble.addEventListener("ready",
  function (e) {
    console.log("JavaScript app ready and running!");
  }
);
var sendResultsToPebble = function (data) {
    var dataToSend = {
        "length": data.length
    };
    
    var sendNextItem = function (index) {
        var dataToSend = {};
      if (data.length > index) {
        dataToSend["index"] = index;
        dataToSend["title"] = data[0].title;
        console.log('Data to send: ' + JSON.stringify(dataToSend));
        Pebble.sendAppMessage(dataToSend, function () {
          sendNextItem(index+1);
        }, function () {
          console.log('Item ' + index + ' fucked');
          sendNextItem(index+1);
        });
      } else {
        Pebble.sendAppMessage({"end": 1}, function () {
          console.log('End sent');
        }, function () {
          console.log('End fucked');
        });
      }
    };

  console.log('Data to send: ' + JSON.stringify(dataToSend));

  var transactionId = Pebble.sendAppMessage(dataToSend,
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

var getUrl = function(type, id) {
                      if(type === 0) {
                        return 'http://pebblenotes.apiary.io/notes';
                      }
};
                      
var fetchData = function (type, id) {
    console.info('Type: ' + type + ', id: ' + id);
    var req = new XMLHttpRequest();
    var url = getUrl(type, id);
    console.log('Loading "' + url + '"');
    req.open('GET', url, true);
    req.onload = function (e) {
      console.log('Loaded with status: ' + req.status + ', ready state: ' + req.readyState);
      if (req.readyState == 4 && req.status == 200) {
        if (req.status == 200) {
          var response = JSON.parse(req.responseText);
          console.log('Got ' + response.length + ' results');
          sendResultsToPebble(response);
        } else {
          console.log("Error");
        }
      }
    };
    req.send(null);
};



Pebble.addEventListener("appmessage",
  function (e) {
    console.log("Received message: " + JSON.stringify(e.payload));
    var currentType = e.payload.type;
    var id = e.payload.id;
    fetchData(currentType, id);
  }
);