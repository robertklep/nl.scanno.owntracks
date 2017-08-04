"use strict";
const Homey = require('homey');

const globalVar = require("./global.js");
const logmodule = require("./logmodule.js");
const triggers  = require("./triggers.js");

var DEBUG = false;

module.exports = {
   receiveMessage: function(topic, message, args, state) {
      receiveMessage(topic, message, args, state);
   }
}


function receiveMessage(topic, message, args, state) {
   var validJSON = true;
   var validTransition = false;
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
         currentUser = globalVar.createEmptyUser(topicArray[1]);
      }
      
      switch (jsonMsg._type) {
         case 'transition':
            var fenceData = {};
            validTransition = true;
            // check the accuracy. If it is too low (i.e a high amount is meters) then perhaps we should skip the trigger
            if (jsonMsg.acc <= parseInt(Homey.ManagerSettings.get('accuracy'))) {
               // The accuracy of location is lower then the treshold value, so the location change will be trggerd
               logmodule.writelog("Accuracy is within limits")

               currentUser.lon = jsonMsg.lon;
               currentUser.lat = jsonMsg.lat;
               currentUser.timestamp = jsonMsg.tst;

               // Set fenceData. This is done to update or add new
               // fences so they can be selected in an autocomplete box
               fenceData.fenceName = jsonMsg.desc;
               fenceData.timestamp = jsonMsg.tst;
               globalVar.setFence(fenceData);

               switch (jsonMsg.event) {
                  case 'enter':
                     if (Homey.ManagerSettings.get('double_enter') == true) {
                        logmodule.writelog("Double enter event check enabled");
                        if (currentUser.fence !== jsonMsg.desc)  {
                           validTransition = true;
                        } else {
                           validTransition = false;
                        }
                     }
                     if (validTransition == true) {
                          currentUser.fence = jsonMsg.desc;
                          let tokens = {
                             user: currentUser.userName, 
                             fence: jsonMsg.desc, 
                             percBattery: currentUser.battery
                          }
                          let state = {
                             triggerTopic: topic, 
                             triggerFence: jsonMsg.desc
                          }
                          triggers.getEnterGeofenceAC().trigger(tokens,state,null).catch( function(e) {
                            logmodule.writelog("Error occured: " +e);
                          })

                          logmodule.writelog("Trigger enter card for " + jsonMsg.desc);
                     } else {
                        logmodule.writelog("The user is already within the fence. No need to trigger again");
                     }
                     break;
                  case 'leave':
                     if (Homey.ManagerSettings.get('double_leave') == true) {
                        logmodule.writelog("Double leave event check enabled");
                        if (currentUser.fence !== "")  {
                           validTransition = true;
                        } else {
                           validTransition = false;
                        }
                     }
                     if (validTransition == true) {
                        currentUser.fence = "";
                        
                        let tokens = {
                           user: currentUser.userName, 
                           fence: jsonMsg.desc, 
                           percBattery: currentUser.battery
                        }
                        let state = {
                           triggerTopic: topic, 
                           triggerFence: jsonMsg.desc
                        }
                        triggers.getLeaveGeofenceAC().trigger(tokens,state,null)

                        logmodule.writelog("Trigger leave card for " + jsonMsg.desc);
                     } else {
                        logmodule.writelog("The user is already outside the fence. No need to trigger again");
                     }
                     break;
               }
               if (validTransition === true) {
                  let tokens = {
                     event: jsonMsg.event,
                     user: currentUser.userName, 
                     fence: jsonMsg.desc, 
                     percBattery: currentUser.battery
                  }
                  let state = {
                     triggerTopic: topic, 
                     triggerFence: jsonMsg.desc
                  }
                  triggers.getEventOwntracksAC().trigger(tokens,state,null)
                                                                  
                  logmodule.writelog("Trigger generic card for " + jsonMsg.desc);
               } else {
                  logmodule.writelog("This trigger is not needed because the transition is not valid");
               }
            } else {
               logmodule.writelog ("Accuracy is "+ jsonMsg.acc + " and needs to be below " + parseInt(Homey.ManagerSettings.get('accuracy')))
            }
            break;
         case 'location':
            // This location object describes the location of the device that published it.
            logmodule.writelog("We have received a location message");
            currentUser.lon = jsonMsg.lon;
            currentUser.lat = jsonMsg.lat;
            currentUser.timestamp = jsonMsg.tst;
            if (jsonMsg.batt !== undefined) {
               currentUser.battery = jsonMsg.batt;
               logmodule.writelog("Set battery percentage for "+ currentUser.userName +" to "+ currentUser.battery+ "%");
               
               let tokens = {
                  user: currentUser.userName, 
                  fence: jsonMsg.desc, 
                  percBattery: currentUser.battery
               }
               let state = {
                  triggerTopic: topic, 
                  percBattery: currentUser.battery,
                  user: currentUser.userName
               }
               triggers.getEventBattery().trigger(tokens,state, null)
            }
            break;
         case 'waypoint' :
            // Waypoints denote specific geographical locations that you want to keep track of. You define a waypoint on the OwnTracks device, 
            // and OwnTracks publishes this waypoint (if the waypoint is marked shared)
            logmodule.writelog("We have received a waypoint message");

            // Set fenceData. This is done to update or add new
            // fences so they can be selected in an autocomplete box
            var fenceData = {}
            fenceData.fenceName = jsonMsg.desc;
            fenceData.timestamp = jsonMsg.tst;
            globalVar.setFence(fenceData);
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
      globalVar.setUser(currentUser, validTransition);
   }
}

