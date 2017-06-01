var broker    = require("./broker.js");
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");

module.exports = {
   getTriggerArgs: function() {
      return getTriggerArgs();
   },
   listenForMessage: function() {
      listenForMessage();
   }
}

/*
   The function listenForMessage registers all the trigger events. As soon as an event is
   triggered it calls one of the triggers in this function.
*/
function listenForMessage () {
   // Start listening for the events.

   logmodule.writelog("listenForMessage called");
/*
   Homey.manager('flow').on('trigger.eventBattery', function( callback, args, state ) {
      logmodule.writelog("trigger.eventBattery called");
      if ( processMessage(args, state, 'eventBattery')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });
*/
   Homey.manager('flow').on('trigger.eventOwntracks', function( callback, args, state ) {
      logmodule.writelog("trigger.eventOwntracks called");
      if ( processMessage(args, state, 'eventOwntracks')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });
   Homey.manager('flow').on('trigger.enterGeofence', function( callback, args, state ) {
      logmodule.writelog("trigger.enterGeofence called");
      if ( processMessage(args, state, 'enterGeofence')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });

   Homey.manager('flow').on('trigger.leaveGeofence', function( callback, args, state ) {
      logmodule.writelog("trigger.leaveGeofence called");
      if ( processMessage(args, state, 'leaveGeofence')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });
}


/*
   The function getTriggerArgs() retreives all the arguments of the triggers that are defined
   by the user in the flows. As each trigger card can contain different trigger arguments, we
   need to walk through them. This is especially needed for getting the topics, so we know what
   topics we are waiting for.
*/
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

/*
   Get the arguments for the generic enter/leave trigger card(s)
*/
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

/*
   Get the arguments for the enter geoFence trigger card(s)
*/
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

/*
   Get the arguments for the leave geoFence trigger card(s)
*/
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

/*
   Get the arguments for the battery percentage warning trigger card(s)
*/
/*
function getBatteryEventArgs() {
   return new Promise(function (fulfill, reject) {
      Homey.manager('flow').getTriggerArgs('eventBattery', function( err, args ) {
         args.forEach(function(element) {
            logmodule.writelog("Trigger Arguments for eventBattery: " + element.mqttTopic);
            broker.subscribeToTopic(element.mqttTopic);
         });
         fulfill(true);
      });
   });
}
*/

function processMessage(args, state, triggerType) {
   var reconnectClient = false;

   // Make a connection to the broker. But only do this once. When the app is started, the connectedClient
   // variable is set to null, so there is no client connection yet to the broker. If so, then connect to the broker.
   // Otherwise, skip the connection.

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
      switch(triggerType) {
         case 'eventOwntracks':
         case 'enterGeofence':
         case 'leaveGeofence':
            if ( state.triggerFence == args.nameGeofence || args.nameGeofence == "*" ) {
               logmodule.writelog ("triggerFence = equal")
               return true;
            } else {
               return false;
            }
            break;
/*         case 'eventBattery':
            if ( state.battery < args.percBattery ) {
               logmodule.writelog ("battery percenatge ("+ state.battery +"%) is below trigger percentage of "+ args.percBattery +"%");
               return true;
            } else {
               return false;
            }
            break;
*/
      }
   }
   // This is not the topic I was waiting for and it is a known topic
   else if (state.triggerTopic !== args.mqttTopic & globalVar.getTopicArray().indexOf(args.mqttTopic) !== -1) {
      logmodule.writelog("We are not waiting for this topic");
      return false;
   }
   // this is (still) an unknown topic. We arrive her only 1 time for every topic. The next time the if and else if will
   // trigger first.
   else {
      // Add another check for the existence of the topic, just in case there is somehting falling through the 
      // previous checks...

      broker.subscribeToTopic(args.mqttTopic);
   }
   return false;
}

