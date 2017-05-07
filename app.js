"use strict";
//var mqtt      = require("mqtt");
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");
var actions   = require("./actions.js");

// At this time i do not have another idea on how to control the client connection when changing the
// settings besides to have the client connection available globally.
//var connectedClient = null;


function processMessage (callback, args, state) {
   var reconnectClient = false;

   // Make a connection to the broker. But only do this once. When the app is started, the connectedClient
   // variable is set to null, so there is no client connection yet to the broker. If so, then connect to the broker.
   // Otherwise, skip the connection.
   broker.connectToBroker(args, state);

   logmodule.writelog ("state.topic = " + state.triggerTopic + " topic = " + args.mqttTopic + " state.fence = " + state.triggerFence + " geofence = " + args.nameGeofence)

   // MQTT subscription topics can contain "wildcards", i.e a + sign. However the topic returned
   // by MQTT brokers contain the topic where the message is posted on. In that topic, the wildcard
   // is replaced by the actual value. So we will have to take into account any wildcards when matching the topics.

   var arrTriggerTopic = state.triggerTopic.split('/');
   var arrMQTTTopic = args.mqttTopic.split('/');
   var matchTopic = true;

   for (var value in arrTriggerTopic) {
      if ((arrTriggerTopic[value] !== arrMQTTTopic[value]) && (arrMQTTTopic[value] !== '+')) {
         // This is a bit dirty because it would allow events to be delivered also to topics that do not have
         // the trailing event. In de future, when allowing the other message types, this would cause problems
         if (arrMQTTTopic[value] !== undefined) {
            matchTopic = false;
         }
      }
   };

   // If the topic that triggered me the topic I was waiting for?
   if (matchTopic == true) {
      console.log ("triggerTopic = equal" )
      // The topic is equal, but we also need the geofence to be equal as well, if not then the 
      // callback should be false
      if ( state.triggerFence == args.nameGeofence) {
         logmodule.writelog ("triggerFence = equal")
         callback ( null, true);
      } else {
         callback ( null, false);
      }
      callback( null, true )
   }
   // This is not the topic I was waiting for and it is a known topic
   else if (state.triggerTopic !== args.mqttTopic & globalVar.getTopicArray().indexOf(args.mqttTopic) !== -1) {
      logmodule.writelog("We are not waiting for this topic");
      callback( null, false )
   }
   // this is (still) an unknown topic. We arrive her only 1 time for every topic. The next time the if and else if will
   // trigger first.
   else {
      // Add another check for the existence of the topic, just in case there is somehting falling through the 
      // previous checks...

      broker.subscribeToTopic(args.mqttTopic);
   };
   callback (null, false);
}

function listenForMessage () {
   // Start listening for the events.
   Homey.manager('flow').on('trigger.eventOwntracks', processMessage)
   Homey.manager('flow').on('trigger.enterGeofence', processMessage)
   Homey.manager('flow').on('trigger.leaveGeofence', processMessage)    
}

function getTriggerArgs() {
   return new Promise(function (fulfill, reject) {
      if (globalVar.getTopicArray().length > 0) {
        globalVar.clearTopicArray();
      };
      logmodule.writelog("Registered topics:" + globalVar.getTopicArray());
      return getEventOwntracksArgs().then(function() {
         return getEnterGeofenceArgs().then(function() {
            return getLeaveGeofenceArgs().then(function() {
               logmodule.writelog("Registered topics:" + globalVar.getTopicArray());
               fulfill(true);
            });
         });
      });
   });
}

function getEventOwntracksArgs() {
   return new Promise(function (fulfill, reject) {
      Homey.manager('flow').getTriggerArgs('eventOwntracks', function( err, args ) {
         args.forEach(function(element) {
            logmodule.writelog("Trigger Arguments for eventOwntracks: " + element.mqttTopic);
            broker.subscribeToTopic(element.mqttTopic);
         });
         fulfill(true);
      });
   });
}

function getEnterGeofenceArgs() {
   return new Promise(function (fulfill, reject) {
      Homey.manager('flow').getTriggerArgs('enterGeofence', function( err, args ) {
         args.forEach(function(element) {
            logmodule.writelog("Trigger Arguments for enterGeofence: " + element.mqttTopic);
            broker.subscribeToTopic(element.mqttTopic);
         });
         fulfill(true);
      });
   });
}

function getLeaveGeofenceArgs() {
   return new Promise(function (fulfill, reject) {
      Homey.manager('flow').getTriggerArgs('leaveGeofence', function( err, args ) {
         args.forEach(function(element) {
            logmodule.writelog("Trigger Arguments for leaveGeofence: " + element.mqttTopic);
            broker.subscribeToTopic(element.mqttTopic);
         });
         fulfill(true);
      });
   });
}

exports.init = function() {
   
   getTriggerArgs().then(function() {
      broker.connectToBroker();
      listenForMessage()
      actions.registerActions();
      actions.registerSpeech();
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
   getTriggerArgs().then(function() {
      broker.connectToBroker();
   });
   callback(false, null);
}


module.exports.testBroker = testBroker;
module.exports.changedSettings = changedSettings;
module.exports.getLogLines = logmodule.getLogLines;
module.exports.getUserArray = globalVar.getUserArray;


