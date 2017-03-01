var mqtt      = require("mqtt");
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");

var connectedClient = null;
var reconnectClient = false;

module.exports = {
   connectToBroker: function() {
      connectToBroker();
   },
   subscribeToTopic: function(topicName) {
      subscribeToTopic(topicName);
   }
}


function getBrokerURL() {
   var urlBroker = []
    
   if (Homey.manager('settings').get('otbroker') == true) {
      urlBroker.push("mqtt://");
      urlBroker.push("broker.hivemq.com:1883");
   } else {
      if (Homey.manager('settings').get('tls') == true) {
        urlBroker.push("mqtts://");
      } else {
         urlBroker.push("mqtt://");
      };
      urlBroker.push(Homey.manager('settings').get('url'));
      urlBroker.push(":"+Homey.manager('settings').get('ip_port'));
   }
   logmodule.writelog("Broker URL: "+ urlBroker.join(''));
   return urlBroker.join('');
}

function getConnectOptions() {

  if (Homey.manager('settings').get('otbroker') == true) {
      return null;
   } else {
      var connect_options = {
         keepalive: 10,
         username: Homey.manager('settings').get('user'),
         password: Homey.manager('settings').get('password')
      };
      return connect_options
   };
}

function connectToBroker() {
   if (connectedClient == null) {
      logmodule.writelog("connectedClient == null");
      connectedClient = mqtt.connect(getBrokerURL(), getConnectOptions());

      connectedClient.on('reconnect', function() {
         logmodule.writelog("MQTT Reconnect");
         reconnectClient = true;
       });

      connectedClient.on('close', function() {
         logmodule.writelog("MQTT Closed");
         reconnectClient = true;
       });

      connectedClient.on('offline', function() {
         logmodule.writelog("MQTT Offline");
         reconnectClient = true;
       });

      connectedClient.on('error', function(error) {
         logmodule.writelog("MQTT error occured: " + error);
      });

      connectedClient.on('message',function(topic, message, packet) {
         // When a message is received, call receiveMessage for further processing
         logmodule.writelog("OnMessage called");
         receiveMessage(topic, message, args, state);
      });
   };
}

function subscribeToTopic(topicName) {
   if ( globalVar.getTopicArray().indexOf(topicName) == -1 ) {

      // Fill the array with known topics so I can check if I need to subscribe
      globalVar.getTopicArray().push(topicName);

      // On connection ...
      connectedClient.on('connect', function (connack) {
         logmodule.writelog("MQTT client connected");
         logmodule.writelog("Connected Topics: " + globalVar.getTopicArray());
         logmodule.writelog("reconnectedClient " + reconnectClient);

         connectedClient.subscribe(topicName)
         logmodule.writelog("waiting "+ topicName );
      });
   }
}



