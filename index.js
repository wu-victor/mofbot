var express = require("express");
var bodyParser = require("body-parser");
var request = require("request");
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

app.get("/", function (req, res) {
  res.send("Mobile Only Financial - Facebook Messenger Bot");
});

app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === "mofbot_verify_token") {
    res.send(req.query["hub.challenge"]);
  } else {
    res.send("Invalid verify token");
  }
});

app.post("/webhook", function (request, response) {
  var events = request.body.entry[0].messaging;
  console.log("********* events **********");
  console.log(events);
  for (i = 0; i < events.length; i++) {
    var event = events[i];
      if (event.message && event.message.text) {
        var responseType = getResponseType(event.message.text);
        if (responseType === "RATES") {
          sendRates(event.sender.id);
        } else if (responseType === "DIFFICULTY") {
          sendPaymentPlan(event.sender.id);
        } else if (responseType === "NEXT_PAYMENT") {
          sendNextPayment(event.sender.id);
        } else {
          sendMessage(event.sender.id, {text: "Sentiment response"});
        }
      } else if (event.postback) {
          sendMessage(event.sender.id, {text: event.postback.payload});
      }
  }
  response.sendStatus(200);
});

function getResponseType(message) {
  if (message.toLowerCase().includes("rate") || message.toLowerCase().includes("term")) {
    return "RATES";
  } else if (message.toLowerCase().includes("can't pay") || message.toLowerCase().includes("cannot pay")) {
    return "DIFFICULTY";
  } else if (message.toLowerCase().includes("next payment")) {
    return "NEXT_PAYMENT";
  } else {
    return "SENTIMENT";
  }
};

function sendRates(recipientId) {
  var message = {
    "attachment": {
      "type": "image",
      "payload": {
        "url": "https://dl.dropboxusercontent.com/u/6677157/rates.png"
      }
    }
  };
  sendMessage(recipientId, message);
}

function sendPaymentPlan(recipientId) {
  var message = {
    "attachment":{
      "type": "template",
      "payload":{
        "template_type": "button",
        "text": "We are sorry to hear that you are having financial difficulty. We can offer you a",
        "buttons":[
          {
            "type": "postback",
            "title": "Payment holiday",
            "payload": "PAYMENT_HOLIDAY"
          },
          {
            "type": "postback",
            "title": "Payment plan",
            "payload": "PAYMENT_PLAN"
          }
        ]
      }
    }
  }
  sendMessage(recipientId, message);
}

function sendNextPayment(recipientId) {
  sendMessage(recipientId, {text:
    "Your next payment is\n"
    + "Amount: $53.72\n"
    + "Date: August 15, 2016\n"
    + "With: Visa debit card ending in 4215\n"
  });
}

function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: ", error);
    } else if (response.body.error) {
      console.log("Error: ", response.body.error);
    }
  });
};
