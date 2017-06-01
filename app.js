"use strict";
//var mqtt      = require("mqtt");
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");
var actions   = require("./actions.js");
var triggers  = require("./triggers.js");
var condition = require("./conditions.js");

// At this time i do not have another idea on how to control the client connection when changing the
// settings besides to have the client connection available globally.
//var connectedClient = null;

exports.init = function() {
   
   triggers.getTriggerArgs().then(function() {
      broker.connectToBroker();
      triggers.listenForMessage()
      actions.registerActions();
      actions.registerSpeech();
      condition.registerConditions();
   });
}

function testBroker(callback, args) {
   var urlBroker = [];
   logmodule.writelog("testBroker reached");
   logmodule.writelog(args);
   if (args.body.otbroker == true) {
      urlBroker.push("mqtt://");
      urlBroker.push("broker.hivemq.com:1883");
   } else {
      if (args.body.tls == true) {
        urlBroker.push("mqtts://");
      } else {
         urlBroker.push("mqtt://");
      };
      urlBroker.push(args.body.url);
      urlBroker.push(":" + args.body.ip_port);
   }

   var connect_options = "[{ username: '" + args.body.user + "', password: '" + args.body.password + "', connectTimeout: '1' }]"
   logmodule.writelog("Testing "+ urlBroker.join('') + " with " + connect_options);
   
   if (args.body.otbroker == true) {
      connect_options = "";
   }
   var client  = mqtt.connect(urlBroker.join(''), connect_options);

   client.on('connect', function() {
      client.on('error', function (error) {
         logmodule.writelog("Error occured during connection to the broker");
         client.end();
         callback(false, null);
      });

      logmodule.writelog("Connection to the broker sucesfull");
      client.end();
      callback(true, null);
   });
//   client.end();
//   callback(false, null);

}

function changedSettings(callback, args) {
   logmodule.writelog("changedSettings called");
   logmodule.writelog(args.body);
   logmodule.writelog("topics:" + globalVar.getTopicArray())

   if (globalVar.getTopicArray().length > 0) {
      broker.getConnectedClient().unsubscribe("owntracks/#");
      globalVar.clearTopicArray();
   };

   if (broker.getConnectedClient() !== null) {
      broker.getConnectedClient().end(true);
   }

   logmodule.writelog("topics:" + globalVar.getTopicArray());
   broker.clearConnectedClient();
   triggers.getTriggerArgs().then(function() {
      broker.connectToBroker();
   });
   callback(false, null);
}


module.exports.testBroker = testBroker;
module.exports.changedSettings = changedSettings;
module.exports.getLogLines = logmodule.getLogLines;
module.exports.getUserArray = globalVar.getUserArray;


