"use strict";
var mqtt      = require("mqtt");
var connectedTopics = [];
var logArray = [];

// At this time i do not have another idea on how to control the client connection when changing the
// settings besides to have the client connection available globally.
var connectedClient = null;

var userArray = [];

function getUser(userName) {
   for (var i=0; i < userArray.length; i++) {
      if (userArray[i].userName === userName) {
         return userArray[i];
      }
   }
   // User has not been found, so return null
   return null
}

function setUser(userData) {
   var entryArray = getUser(userData.userName);
   if (entryArray !== null) {
      entryArray = userData;
      
   } else {
      // User has not been found, so assume this is a new user
      userArray.push(userData);
   }
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + month + day + "-" + hour + ":" + min + ":" + sec;
}

function writelog(line) {
   var logLine = getDateTime() + "   " + line;
   console.log( logLine );

   if (logArray.length >= 20) {
      logArray.shift();
   }
   logArray.push(logLine);
}

function receiveMessage(topic, message, args, state) {
   var validJSON = true;
   var topicArray = topic.split('/');
   var currentUser = {};
   
   writelog("received '" + message.toString() + "' on '" + topic + "'");

   // parse the JSON message and put it in an object that we can use
   try {
      var jsonMsg = JSON.parse(message.toString());
   } catch(e) {
      writelog("Received message is not a valid JSON string");
      validJSON = false;
   };

   // owntracks has several different mesages that can be retreived and that should be handeld 
   // differently. For now we only support the transition message. But prepare for more.
   // for more information see http://owntracks.org/booklet/tech/json/
   if (validJSON && jsonMsg._type !== undefined) {
      // get the user this message is from. This can be found in the topic the message is published in
      currentUser = getUser(topicArray[1]);
      if (currentUser === null) {
         currentUser = {};
         currentUser.userName = topicArray[1];
         currentUser.fence = "";
      }
      currentUser.lon = jsonMsg.lon;
      currentUser.lat = jsonMsg.lat;
//      currentUser.fence ="";
      currentUser.adres = "";
      currentUser.timestamp = jsonMsg.tst;
      
      switch (jsonMsg._type) {
         case 'transition':
            // check the accuracy. If it is too low (i.e a high amount is meters) then perhaps we should skip the trigger
            if (jsonMsg.acc <= parseInt(Homey.manager('settings').get('accuracy'))) {
               // The accuracy of location is lower then the treshold value, so the location change will be trggerd
               writelog("Accuracy is within limits")
               switch (jsonMsg.event) {
                  case 'enter':
                     currentUser.fence = jsonMsg.desc;
                     Homey.manager('flow').trigger('enterGeofence', { user: currentUser.userName }, { triggerTopic: topic, triggerFence: jsonMsg.desc });
                     writelog("Trigger enter card for " + jsonMsg.desc);
                     break;
                  case 'leave':
                     currentUser.fence = "";
                     Homey.manager('flow').trigger('leaveGeofence', { user: currentUser.userName }, { triggerTopic: topic, triggerFence: jsonMsg.desc });
                     writelog("Trigger leave card for " + jsonMsg.desc);
                     break;
               }
               Homey.manager('flow').trigger('eventOwntracks', { user: currentUser.userName, event: jsonMsg.event }, { triggerTopic: topic, triggerFence: jsonMsg.desc });
               writelog("Trigger generic card for " + jsonMsg.desc);
            } else {
               writelog ("Accuracy is "+ jsonMsg.acc + " and needs to be below " + parseInt(Homey.manager('settings').get('accuracy')))
            }
            break;
         case 'location':
            // This location object describes the location of the device that published it.
            writelog("We have received a location message");
            break;
         case 'waypoint' :
            // Waypoints denote specific geographical locations that you want to keep track of. You define a waypoint on the OwnTracks device, 
            // and OwnTracks publishes this waypoint (if the waypoint is marked shared)
            writelog("We have received a waypoint message");
            break;
         case 'encrypted' :
            // This payload type contains a single data element with the original JSON object _type (e.g. location, beacon, etc.) encrypted payload in it.
            break;
         case 'beacon' :
            // This payload contains information about detected iBeacon
            writelog("Beacon message detected:");
            writelog("uuid: "+jsonMsg.uuid+"major: "+jsonMsg.major+" minor: "+jsonMsg.minor+" tst: "+jsonMsg.tst+" acc: "+jsonMsg.acc+" rssi: "+jsonMsg.rssi+" prox: "+jsonMsg.prox);
            break;
         default:
            break;
      }
      setUser(currentUser);
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
   writelog("Broker URL: "+ urlBroker.join(''));
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

function processMessage (callback, args, state) {
   var reconnectClient = false;
   // Make a connection to the broker. But only do this once. When the app is started, the connectedClient
   // variable is set to null, so there is no client connection yet to the broker. If so, then connect to the broker.
   // Otherwise, skip the connection.
   if (connectedClient == null) {
      writelog("connectedClient == null");
      connectedClient = mqtt.connect(getBrokerURL(), getConnectOptions());

      connectedClient.on('reconnect', function() {
         writelog("MQTT Reconnect");
         reconnectClient = true;
       });

      connectedClient.on('close', function() {
         writelog("MQTT Closed");
         reconnectClient = true;
       });

      connectedClient.on('offline', function() {
         writelog("MQTT Offline");
         reconnectClient = true;
       });

      connectedClient.on('error', function(error) {
         writelog("MQTT error occured: " + error);
      });

      connectedClient.on('message',function(topic, message, packet) {
         // When a message is received, call receiveMessage for further processing
         writelog("OnMessage called");
         receiveMessage(topic, message, args, state);
      });
   };
   writelog ("state.topic = " + state.triggerTopic + " topic = " + args.mqttTopic + " state.fence = " + state.triggerFence + " geofence = " + args.nameGeofence)

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
         writelog ("triggerFence = equal")
         callback ( null, true);
      } else {
         callback ( null, false);
      }
      callback( null, true )
   }
   // This is not the topic I was waiting for and it is a known topic
   else if (state.triggerTopic !== args.mqttTopic & connectedTopics.indexOf(args.mqttTopic) !== -1) {
      writelog("We are not waiting for this topic");
      callback( null, false )
   }
   // this is (still) an unknown topic. We arrive her only 1 time for every topic. The next time the if and else if will
   // trigger first.
   else {
      // Add another check for the existence of the topic, just in case there is somehting falling through the 
      // previous checks...
      if ( connectedTopics.indexOf(args.mqttTopic) == -1 ) {

         // Fill the array with known topics so I can check if I need to subscribe
         connectedTopics.push(args.mqttTopic)

         // On connection ...
         connectedClient.on('connect', function (connack) {
            writelog("MQTT client connected");
            writelog("Connected Topics: " + connectedTopics);
            writelog("reconnectedClient " + reconnectClient);

            connectedClient.subscribe(args.mqttTopic)
            writelog("waiting "+ args.mqttTopic );
         });
      } else {
         writelog("Fallback triggered");
         callback (null, false);
      };
   };
   callback (null, false);
}

function listenForMessage () {
   // Start listening for the events.
   Homey.manager('flow').on('trigger.eventOwntracks', processMessage)
   Homey.manager('flow').on('trigger.enterGeofence', processMessage)
   Homey.manager('flow').on('trigger.leaveGeofence', processMessage)    
}

function getArgs () {
   // Give all the triggers a kick to retrieve the arg(topic) defined on the trigger.
   Homey.manager('flow').trigger('eventOwntracks', { user: '', event: 'Hallo homey' }, { triggerTopic: 'x', triggerFence: 'x' }, function(err, result) {
      if( err ) {
         return Homey.error(err)
     }
   });

   Homey.manager('flow').trigger('enterGeofence', null, { user: '' }, { triggerTopic: 'x', triggerFence: 'x' }, function(err, result) {
      if( err ) {
         return Homey.error(err)
     }
   });

   Homey.manager('flow').trigger('leaveGeofence', null, { user: '' }, { triggerTopic: 'x', triggerFence: 'x' }, function(err, result) {
      if( err ) {
         return Homey.error(err)
     }
   });
}

function listenForAction () {
   writelog("listenFirAction called")
   Homey.manager('flow').on('action.publishOwntracks', function( callback, args ){
      writelog("Send flow triggered");
      // Read the URL from the settings.
      if (connectedClient == null) {
         var client = mqtt.connect(getBrokerURL(), getConnectOptions());
         client.on('connect', function () {
            client.publish(args.mqttTopic, args.mqttMessage, function() {
               writelog("send " + args.mqttMessage + " on topic " + args.mqttTopic);
               client.end();
            });
         });
      } else {
         connectedClient.publish(args.mqttTopic, args.mqttMessage, function() {
            writelog("send " + args.mqttMessage + " on topic " + args.mqttTopic);
         });
      }
      callback( null, true ); // we've fired successfully
   });
}

exports.init = function() {
   // get the arguments of any trigger. Once triggered, the interval will stop
   Homey.log("Owntracks client ready")
   var myTim = setInterval(timer, 5000)
   function timer() {
      getArgs()
   }
   Homey.manager('flow').on('trigger.eventOwntracks', function( callback, args ){
      clearInterval(myTim)
   });
   Homey.manager('flow').on('trigger.enterGeofence', function( callback, args ){
      clearInterval(myTim)
   });
   Homey.manager('flow').on('trigger.leaveGeofence', function( callback, args ){
      clearInterval(myTim)
   });

   listenForMessage()
   listenForAction()
}

function testBroker(callback, args) {
   var urlBroker = [];
   writelog("testBroker reached");
   writelog(args);
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
   writelog("Testing "+ urlBroker.join('') + " with " + connect_options);
   
   if (args.body.otbroker == true) {
      connect_options = "";
   }
   var client  = mqtt.connect(urlBroker.join(''), connect_options);

   client.on('connect', function() {
      client.on('error', function (error) {
         writelog("Error occured during connection to the broker");
         client.end();
         callback(false, null);
      });

      writelog("Connection to the broker sucesfull");
      client.end();
      callback(true, null);
   });
//   client.end();
//   callback(false, null);

}

function changedSettings(callback, args) {
   writelog("changedSettings called");
   writelog(args.body);
   writelog("topics:" + connectedTopics)

/*   var urlBroker = []

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
      urlBroker.push(":"+args.body.ip_port);
   }
   console.log("Broker URL: " + urlBroker.join(''));

   var connect_options = "[{ username: '" + args.body.user + "', password: '" + args.body.password + "' }]"
   if (args.body.otbroker == true) {
      connect_options = "";
   }

   console.log("Connect options: " + connect_options);
   var client  = mqtt.connect(urlBroker.join(''), connect_options)
   client.on('connect', function () {
      console.log(client);
      // unsubscribe topics*
      client.unsubscribe(connectedTopics);*
   });*/
   if (connectedTopics.length > 0) {
      connectedClient.unsubscribe(connectedTopics);
      connectedTopics = [];
   };

   if (connectedClient !== null) {
      connectedClient.end(true);
   }

   writelog("topics:" + connectedTopics);
   connectedClient = null;
   getArgs();
   callback(false, null);
}

function getLogLines(callback, args) {
   writelog("getLogLines called");
   callback ( false, logArray);
}

function getUserArray(callback, args) {
   writelog("getUserArray called");
   callback ( false, userArray);
}

module.exports.testBroker = testBroker;
module.exports.changedSettings = changedSettings;
module.exports.getLogLines = getLogLines;
module.exports.getUserArray = getUserArray;


