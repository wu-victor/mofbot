var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
  res.send('Mobile Only Financial - Facebook Messenger Bot');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === 'mofbot_verify_token') {
    res.send(req.query['hub.challenge']);
  } else {
    res.send('Invalid verify token');
  }
});

// handler receiving messages
app.post('/webhook', function (request, response) {
  var events = request.body.entry[0].messaging;
  console.log('********* events **********');
  console.log(events);
  for (i = 0; i < events.length; i++) {
    var event = events[i];
      if (event.message && event.message.text) {

        var responseType = getResponseType(event.message.text);
        if (responseType === 'RATES') {
          sendMessage(event.sender.id, {text: 'These are MOF\'s awesome rates!'});
        }
        sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
      }
  }
  response.sendStatus(200);
});

function getResponseType(message) {
  if (message.toLowerCase().includes('rate')) {
    return 'RATES';
  } else {
    return 'SENTIMENT';
  }
};

// generic function sending messages
function sendMessage(recipientId, message) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: 'POST',
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
};
