const Homey     = require('homey');
var mqtt      = require("mqtt/node_modules/mqtt");
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var handleMessage = require("./messagehandling.js");

var connectedClient = null;
var reconnectClient = false;

module.exports = {
   connectToBroker: function(args, state) {
      connectToBroker(args, state);
   },
   subscribeToTopic: function(topicName) {
      subscribeToTopic(topicName);
   },
   sendMessageToTopic: function(args) {
      sendMessageToTopic(args);
   },
   getConnectedClient: function() {
      return connectedClient;
   },
   clearConnectedClient: function() {
      connectedClient = null;
   }
}


function getBrokerURL() {
   var urlBroker = []
   if (Homey.ManagerSettings.get('tls') == true) {
      urlBroker.push("mqtts://");
   } else {
      urlBroker.push("mqtt://");
   };
   urlBroker.push(Homey.ManagerSettings.get('url'));
   urlBroker.push(":"+Homey.ManagerSettings.get('ip_port'));
   logmodule.writelog('info', "Broker URL: "+ urlBroker.join(''));
   return urlBroker.join('');
}

function getConnectOptions() {
   var rejectUnauth = "true";
   if ( Homey.ManagerSettings.get('selfsigned') == true) {
      rejectUnauth = "false";
   }
   var connect_options = {
      keepalive: 10,
      username: Homey.ManagerSettings.get('user'),
      password: Homey.ManagerSettings.get('password'),
      rejectUnauthorized: rejectUnauth
   };
   logmodule.writelog('info', "rejectUnauthorized: " + connect_options.rejectUnauthorized);
   return connect_options;
}

function connectToBroker(args, state) {
//   if (Homey.manager('settings').get('usebroker') == true) {
   if (Homey.ManagerSettings.get('usebroker') == true) {
      if (connectedClient == null) {
         logmodule.writelog('info', "connectedClient == null");
         try {
            connectedClient = mqtt.connect(getBrokerURL(), getConnectOptions());
         } catch(err) {
            logmodule.writelog('error', "connectToBroker: " +err);
         }

         connectedClient.on('reconnect', function() {
            logmodule.writelog('info', "MQTT Reconnect");
            reconnectClient = true;
          });

         connectedClient.on('close', function() {
            logmodule.writelog('info', "MQTT Closed");
            reconnectClient = true;
          });

         connectedClient.on('offline', function() {
            logmodule.writelog('info', "MQTT Offline");
            reconnectClient = true;
          });

         connectedClient.on('error', function(error) {
            logmodule.writelog('error', "MQTT error occured: " + error);
         });

         // On connection ...
         connectedClient.on('connect', function (connack) {
            logmodule.writelog('info', "MQTT client connected");
            logmodule.writelog('info', "Connected Topics: " + globalVar.getTopicArray());
            logmodule.writelog('info', "reconnectedClient " + reconnectClient);
         });

         connectedClient.on('message',function(topic, message, packet) {
            // When a message is received, call receiveMessage for further processing
            logmodule.writelog('info', "OnMessage called");
            handleMessage.receiveMessage(topic, message, args, state);
         });
         // Since we are connecting here, we might as well subscribe to the generic
         // Owmntracks topic.
         // Since we subscribe to the generic owntracks topic, we do not have to subscribe to
         // the individual topics. We will get them anyway.
         subscribeToTopic("owntracks/#");
         try {
            connectedClient.subscribe("owntracks/#")
            logmodule.writelog('info', "Subscribed to owntracks/#" );
         } catch(err) {
            logmodule.writelog('error', "connectToBroker: " +err);
         }
      };
   }
}

function subscribeToTopic(topicName) {
   if ( globalVar.getTopicArray().indexOf(topicName) == -1 ) {

      // Fill the array with known topics.... We only fill the
      // topic array because on connection, wel already subsribe
      // to the generic owntracks topic
      globalVar.getTopicArray().push(topicName);
   }
}

function sendMessageToTopic(args) {
   // Check if there is already a connection to the broker
   if (connectedClient == null) {
      // There is no connection, so create a connection and send the message
      try {
         var client = mqtt.connect(getBrokerURL(), getConnectOptions());
         client.on('connect', function () {
            client.publish(args.mqttTopic, args.mqttMessage, function() {
               logmodule.writelog('info', "send " + args.mqttMessage + " on topic " + args.mqttTopic);
               client.end();
            });
         });
      } catch(err) {
         logmodule.writelog('error', "sendMessageToTopic: " +err);
      }
   } else {
      // There is already a connection, so the message can be send
      try {
         connectedClient.publish(args.mqttTopic, args.mqttMessage, function() {
            logmodule.writelog('info', "send " + args.mqttMessage + " on topic " + args.mqttTopic);
         });
      } catch(err) {
         logmodule.writelog('error', "sendMessageToTopic: " +err);
      }
   }
}
