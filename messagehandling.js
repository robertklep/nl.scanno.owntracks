var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");

module.exports = {
   receiveMessage: function(topic, message, args, state) {
      receiveMessage(topic, message, args, state);
   }
}


function receiveMessage(topic, message, args, state) {
   var validJSON = true;
   var topicArray = topic.split('/');
   var currentUser = {};
   
   logmodule.writelog("received '" + message.toString() + "' on '" + topic + "'");

   // parse the JSON message and put it in an object that we can use
   try {
      var jsonMsg = JSON.parse(message.toString());
   } catch(e) {
      logmodule.writelog("Received message is not a valid JSON string");
      validJSON = false;
   };

   // owntracks has several different mesages that can be retreived and that should be handeld 
   // differently. For now we only support the transition message. But prepare for more.
   // for more information see http://owntracks.org/booklet/tech/json/
   if (validJSON && jsonMsg._type !== undefined) {
      // get the user this message is from. This can be found in the topic the message is published in
      currentUser = globalVar.getUser(topicArray[1]);
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
               logmodule.writelog("Accuracy is within limits")
               switch (jsonMsg.event) {
                  case 'enter':
                     currentUser.fence = jsonMsg.desc;
                     Homey.manager('flow').trigger('enterGeofence', { user: currentUser.userName }, { triggerTopic: topic, triggerFence: jsonMsg.desc });
                     logmodule.writelog("Trigger enter card for " + jsonMsg.desc);
                     break;
                  case 'leave':
                     currentUser.fence = "";
                     Homey.manager('flow').trigger('leaveGeofence', { user: currentUser.userName }, { triggerTopic: topic, triggerFence: jsonMsg.desc });
                     logmodule.writelog("Trigger leave card for " + jsonMsg.desc);
                     break;
               }
               Homey.manager('flow').trigger('eventOwntracks', { user: currentUser.userName, event: jsonMsg.event }, { triggerTopic: topic, triggerFence: jsonMsg.desc });
               logmodule.writelog("Trigger generic card for " + jsonMsg.desc);
            } else {
               logmodule.writelog ("Accuracy is "+ jsonMsg.acc + " and needs to be below " + parseInt(Homey.manager('settings').get('accuracy')))
            }
            break;
         case 'location':
            // This location object describes the location of the device that published it.
            logmodule.writelog("We have received a location message");
            break;
         case 'waypoint' :
            // Waypoints denote specific geographical locations that you want to keep track of. You define a waypoint on the OwnTracks device, 
            // and OwnTracks publishes this waypoint (if the waypoint is marked shared)
            logmodule.writelog("We have received a waypoint message");
            break;
         case 'encrypted' :
            // This payload type contains a single data element with the original JSON object _type (e.g. location, beacon, etc.) encrypted payload in it.
            break;
         case 'beacon' :
            // This payload contains information about detected iBeacon
            logmodule.writelog("Beacon message detected:");
            logmodule.writelog("uuid: "+jsonMsg.uuid+"major: "+jsonMsg.major+" minor: "+jsonMsg.minor+" tst: "+jsonMsg.tst+" acc: "+jsonMsg.acc+" rssi: "+jsonMsg.rssi+" prox: "+jsonMsg.prox);
            break;
         default:
            break;
      }
      globalVar.setUser(currentUser);
   }
}

