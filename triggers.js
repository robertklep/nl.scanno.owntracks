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

   createAutocompleteActions()
   // Start listening for the events.

   logmodule.writelog("listenForMessage called");

   Homey.manager('flow').on('trigger.eventBattery', function( callback, args, state ) {
      logmodule.writelog("trigger.eventBattery called");
      if ( processMessage(args, state, 'eventBattery')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });

   Homey.manager('flow').on('trigger.eventOwntracks_AC', function( callback, args, state ) {
      logmodule.writelog("trigger.eventOwntracks_AC called");
      if ( processMessage(args, state, 'eventOwntracks_ac')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });
   Homey.manager('flow').on('trigger.enterGeofence_AC', function( callback, args, state ) {
      logmodule.writelog("trigger.enterGeofence_AC called");
      if ( processMessage(args, state, 'enterGeofence_ac')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });

   Homey.manager('flow').on('trigger.leaveGeofence_AC', function( callback, args, state ) {
      logmodule.writelog("trigger.leaveGeofence_AC called");
      if ( processMessage(args, state, 'leaveGeofence_ac')) {
         callback(null, true);
      } else {
         callback(null, false);
      }
   });


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

function createAutocompleteActions() {
   logmodule.writelog("createAutocompleteActions called");
   // Put all the autocomplte actions here. 

   Homey.manager('flow').on('trigger.eventOwntracks_AC.nameUser.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchUsersAutocomplete(args.query, true));
   });

   Homey.manager('flow').on('trigger.eventOwntracks_AC.nameGeofence.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchFenceAutocomplete(args.query, true));
   });


   Homey.manager('flow').on('trigger.enterGeofence_AC.nameUser.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchUsersAutocomplete(args.query, true));
   });

   Homey.manager('flow').on('trigger.enterGeofence_AC.nameGeofence.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchFenceAutocomplete(args.query, true));
   });

   Homey.manager('flow').on('trigger.leaveGeofence_AC.nameUser.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchUsersAutocomplete(args.query, true));
   });

   Homey.manager('flow').on('trigger.leaveGeofence_AC.nameGeofence.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchFenceAutocomplete(args.query, true));
   });

   Homey.manager('flow').on('trigger.eventBattery.nameUser.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchUsersAutocomplete(args.query, true));
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
               return getBatteryEventArgs().then(function() {
                  logmodule.writelog("Registered topics:" + globalVar.getTopicArray());
                  fulfill(true);
               });
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

function processMessage(args, state, triggerType) {
   var reconnectClient = false;

   logmodule.writelog ("state.topic = " + state.triggerTopic + " topic = " + args.mqttTopic );

   // MQTT subscription topics can contain "wildcards", i.e a + sign. However the topic returned
   // by MQTT brokers contain the topic where the message is posted on. In that topic, the wildcard
   // is replaced by the actual value. So we will have to take into account any wildcards when matching the topics.

   var arrTriggerTopic = state.triggerTopic.split('/');
   var matchTopic = true;

   switch (triggerType) {
      case 'eventOwntracks':
      case 'enterGeofence':
      case 'leaveGeofence':
//      case 'eventBattery':
         var arrMQTTTopic = args.mqttTopic.split('/');
         for (var value in arrTriggerTopic) {
            if ((arrTriggerTopic[value] !== arrMQTTTopic[value]) && (arrMQTTTopic[value] !== '+')) {
               // This is a bit dirty because it would allow events to be delivered also to topics that do not have
               // the trailing event. In de future, when allowing the other message types, this would cause problems
               if (arrMQTTTopic[value] !== undefined) {
                  matchTopic = false;
               }
            }
         };
         break;
      case 'eventBattery':
      case 'eventOwntracks_ac':
      case 'enterGeofence_ac':
      case 'leaveGeofence_ac':
         if (args.nameUser !== undefined ) {
            logmodule.writelog("received user "+arrTriggerTopic[1]+"  trigger user: "+args.nameUser.user);
            if (arrTriggerTopic[1] === args.nameUser.user || args.nameUser.user == '*') {
               matchTopic = true;
            } else {
               matchTopic = false;
            }
         } else {
            matchTopic = false;
         }
         break;
      default:
         matchTopic = false;
         break;
   }

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
         case 'eventOwntracks_ac':
         case 'enterGeofence_ac':
         case 'leaveGeofence_ac':
            logmodule.writelog ("Received Fence = "+state.triggerFence+"  trigger fenve = "+args.nameGeofence.fence)
            if ( state.triggerFence == args.nameGeofence.fence || args.nameGeofence.fence == "*" ) {
               logmodule.writelog ("triggerFence = equal")
               return true;
            } else {
               return false;
            }

            break;
         case 'eventBattery':
            var currentUser = globalVar.getUser(state.user);
            // Check if the battery percentage is below the trigger percentage
            if ( state.percBattery < args.percBattery ) {
               // Check if the trigger has already fired. If so, do not fire again
               if (currentUser.battTriggered == false) {
                  logmodule.writelog ("battery percentage ("+ state.percBattery +"%) of "+ state.user+" is below trigger percentage of "+ args.percBattery +"%");
                  currentUser.battTriggered = true;
                  globalVar.setUser(currentUser);
                  return true;
               } else {
                  logmodule.writelog ("battery trigger already triggered for "+ state.user);
                  return false;
               }
            }
            // Check if the battery percentage if above the trigger percentage. If this is the case
            // set the state.Triggered to false in case the phone was been charged again
            if (state.percBattery >= args.percBattery && currentUser.battTriggered !== false) {
               logmodule.writelog ("Reset battery triggered state for "+ state.user);
               currentUser.battTriggered = false;
               globalVar.setUser(currentUser);
            }
            return false;
            break;
         default:
            return false;
            break;
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

