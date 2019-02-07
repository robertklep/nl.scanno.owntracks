"use strict";

const handleOwntracks = require("./messagehandling.js");
var TopicArray = require("./Topics.js");

class brokerOwntracks {
   constructor(app) {
      this.Homey     = require('homey');
      this.mqtt      = require("mqtt/node_modules/mqtt");
//      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.handleMessage = new handleOwntracks(app);
      this.topics = new TopicArray();
      this.fences = app.fences;
      this.users = app.users;

      this.connectedClient = null;
      this.brokerState = "DISCONNECTED";
      this.errorOccured = false;

      this.OnInit();
   }

   OnInit() {
      this.connectToBroker();
   }
  /**
   * getBrokerURL - create broker URL based on several settings.
   *
   * @return {type}  String with the URL of the broker to connect to.
   */
   getBrokerURL() {
      var urlBroker = []
      if (this.Homey.ManagerSettings.get('tls') == true) {
         urlBroker.push("mqtts://");
      } else {
         urlBroker.push("mqtt://");
      };
      urlBroker.push(this.Homey.ManagerSettings.get('url'));
      urlBroker.push(":"+this.Homey.ManagerSettings.get('ip_port'));
      this.logmodule.writelog('info', "Broker URL: "+ urlBroker.join(''));
      return urlBroker.join('');
   }

   /**
    * getConnectOptions - create structure with several options.
    * Options are depending on several settings from the settings page.
    *
    * @return {type}  returns structure with the options to use when connecting.
    */
   getConnectOptions() {
      var rejectUnauth = true;
      if ( this.Homey.ManagerSettings.get('selfsigned') == true) {
         rejectUnauth = false;
      }

      var keepalive = parseInt(this.Homey.ManagerSettings.get('keepalive'));
      if (isNaN(keepalive)) {
        keepalive = 60;
      }
      this.logmodule.writelog('info', "keepalive: " + keepalive);

      var connect_options = {};
      connect_options.keepalive = keepalive;
      connect_options.username = this.Homey.ManagerSettings.get('user');
      connect_options.password = this.Homey.ManagerSettings.get('password');
      connect_options.rejectUnauthorized = rejectUnauth;
      this.logmodule.writelog('info', "rejectUnauthorized: " + connect_options.rejectUnauthorized);
      return connect_options;
   }

   /**
    * connectToBroker - description
    *
    * @param  {type} args  description
    * @param  {type} state description
    * @return {type}       description
    */
   connectToBroker(args, state) {
      const ref = this;
      if (ref.Homey.ManagerSettings.get('usebroker') == true) {
         if (ref.connectedClient == null) {
            ref.logmodule.writelog('info', "connectedClient == null");
            try {
               ref.connectedClient = ref.mqtt.connect(ref.getBrokerURL(), ref.getConnectOptions());
            } catch(err) {
               ref.logmodule.writelog('error', "connectToBroker: " +err);
            }

            ref.connectedClient.on('reconnect', function() {
               ref.brokerState = "RECONNECTING";
               ref.logmodule.writelog('info', "MQTT Reconnect");
               ref.logmodule.writelog('info', "Broker State: " + ref.brokerState);
             });

            ref.connectedClient.on('close', function() {
               ref.logmodule.writelog('info', "MQTT Closed");
               ref.brokerState = "DISCONNECTED";
               ref.logmodule.writelog('info', "Broker State: " + ref.brokerState);
             });

            ref.connectedClient.on('offline', function() {
               ref.logmodule.writelog('info', "MQTT Offline");
               if (ref.brokerState == "CONNECTED") {
                 ref.logmodule.writelog('error', ref.Homey.__("notifications.mqtt_offline"));
               }
               ref.brokerState = "DISCONNECTED";
               ref.logmodule.writelog('info', "Broker State: " + ref.brokerState);
             });

            ref.connectedClient.on('error', function(error) {
              if (!ref.errorOccured) {
                 ref.logmodule.writelog('error', "MQTT error occured: " + error);
                 ref.brokerState = "ERROR";
                 ref.errorOccured = true;
                 ref.logmodule.writelog('info', "Broker state: " + ref.brokerState);
              } else {
                 ref.logmodule.writelog('info', "MQTT error occured: " + error);
              }
            });

            // On connection ...
            ref.connectedClient.on('connect', function (connack) {
               if (ref.errorOccured || ref.brokerState == "RECONNECTING") {
                 ref.logmodule.writelog('error', ref.Homey.__("notifications.mqtt_online"));
               }
               ref.brokerState = "CONNECTED";
               ref.errorOccured = false;
               ref.logmodule.writelog('info', "MQTT client connected");
               ref.logmodule.writelog('info', "Connected Topics: " + ref.topics.getTopics());
               ref.logmodule.writelog('info', "Broker State: " + ref.brokerState);
            });

            ref.connectedClient.on('message',function(topic, message, packet) {
               // When a message is received, call receiveMessage for further processing
               ref.logmodule.writelog('info', "OnMessage called");
               ref.handleMessage.receiveMessage(topic, message, args, state);
            });
            // Since we are connecting here, we might as well subscribe to the generic
            // Owmntracks topic.
            // Since we subscribe to the generic owntracks topic, we do not have to subscribe to
            // the individual topics. We will get them anyway.
            ref.subscribeToTopic("owntracks/#");
            try {
               ref.connectedClient.subscribe("owntracks/#")
               ref.logmodule.writelog('info', "Subscribed to owntracks/#" );
            } catch(err) {
               ref.logmodule.writelog('error', "connectToBroker: " +err);
            }
         };
      }
   }

   /**
    * subscribeToTopic - description
    *
    * @param  {type} topicName description
    * @return {type}           description
    */
   subscribeToTopic(topicName) {
      //if ( this.globalVar.getTopicArray().indexOf(topicName) == -1 ) {
      if ( this.topics.getTopic(topicName) == null ) {
         // Fill the array with known topics.... We only fill the
         // topic array because on connection, wel already subsribe
         // to the generic owntracks topic
         //this.globalVar.getTopicArray().push(topicName);
         this.topics.addTriggerTopic(topicName);
      }
   }

   /**
    * sendMessageToTopic - description
    *
    * @param  {type} args description
    * @return {type}      description
    */
   sendMessageToTopic(args) {
      const ref = this;
      // Check if there is already a connection to the broker
      if (ref.connectedClient == null) {
         // There is no connection, so create a connection and send the message
         try {
            var client = ref.mqtt.connect(ref.getBrokerURL(), ref.getConnectOptions());
            client.on('connect', function () {
               client.publish(args.mqttTopic, args.mqttMessage, function() {
                  ref.logmodule.writelog('info', "send " + args.mqttMessage + " on topic " + args.mqttTopic);
                  client.end();
               });
            });
         } catch(err) {
            ref.logmodule.writelog('error', "sendMessageToTopic: " +err);
         }
      } else {
         // There is already a connection, so the message can be send
         try {
            ref.connectedClient.publish(args.mqttTopic, args.mqttMessage, function() {
               ref.logmodule.writelog('info', "send " + args.mqttMessage + " on topic " + args.mqttTopic);
            });
         } catch(err) {
            ref.logmodule.writelog('error', "sendMessageToTopic: " +err);
         }
      }
   }

   /**
    * getConnectedClient - description
    *
    * @return {type}  description
    */
   getConnectedClient() {
      return this.connectedClient;
   }

   /**
    * clearConnectedClient - description
    *
    * @return {type}  description
    */
   clearConnectedClient() {
      this.connectedClient = null;
   }

   /**
    * updateRef - description
    *
    * @param  {type} app description
    * @return {type}     description
    */
   updateRef(app) {
      this.handleMessage.updateRef(app);
   }

   getTopicArray() {
     return this.topics;
   }
}

module.exports = brokerOwntracks;
