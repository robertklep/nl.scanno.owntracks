"use strict";

class handleOwntracks {
   constructor(app) {
      this.Homey = require('homey');
      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.triggers  = app.triggers;
   
   }

   receiveMessage(topic, message, args, state) {
      const ref = this;
      var validJSON = true;
      var validTransition = false;
      var topicArray = topic.split('/');
      var currentUser = {};
   
      ref.logmodule.writelog('info', "received '" + message.toString() + "' on '" + topic + "'");

      // parse the JSON message and put it in an object that we can use
      try {
         var jsonMsg = JSON.parse(message.toString());
      } catch(e) {
         ref.logmodule.writelog('error', "Received message is not a valid JSON string");
         validJSON = false;
      };

      // owntracks has several different mesages that can be retreived and that should be handeld 
      // differently. For now we only support the transition message. But prepare for more.
      // for more information see http://owntracks.org/booklet/tech/json/
      if (validJSON && jsonMsg._type !== undefined) {
         // get the user this message is from. This can be found in the topic the message is published in
         currentUser = ref.globalVar.getUser(topicArray[1]);
         if (currentUser === null) {
            currentUser = ref.globalVar.createEmptyUser(topicArray[1]);
         }
      
         switch (jsonMsg._type) {
            case 'transition':
               var fenceData = {};
               validTransition = true;
               // check the accuracy. If it is too low (i.e a high amount is meters) then perhaps we should skip the trigger
               if (jsonMsg.acc <= parseInt(ref.Homey.ManagerSettings.get('accuracy'))) {
                  // The accuracy of location is lower then the treshold value, so the location change will be trggerd
                  ref.logmodule.writelog('info', "Accuracy is within limits")

                  currentUser.lon = jsonMsg.lon;
                  currentUser.lat = jsonMsg.lat;
                  currentUser.timestamp = jsonMsg.tst;

                  // Set fenceData. This is done to update or add new
                  // fences so they can be selected in an autocomplete box
                  fenceData.fenceName = jsonMsg.desc;
                  fenceData.lon = jsonMsg.lon;
                  fenceData.lat = jsonMsg.lat;
                  fenceData.rad = jsonMsg.rad;
                  fenceData.timestamp = jsonMsg.tst;
                  ref.globalVar.setFence(fenceData);

                  switch (jsonMsg.event) {
                     case 'enter':
                        if (ref.Homey.ManagerSettings.get('double_enter') == true) {
                           ref.logmodule.writelog('info', "Double enter event check enabled");
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
                             ref.triggers.getEnterGeofenceAC().trigger(tokens,state,null).catch( function(e) {
                               ref.logmodule.writelog('error', "Error occured: " +e);
                             })

                             ref.logmodule.writelog('info', "Trigger enter card for " + jsonMsg.desc);
                        } else {
                           ref.logmodule.writelog('info', "The user is already within the fence. No need to trigger again");
                        }
                        break;
                     case 'leave':
                        if (ref.Homey.ManagerSettings.get('double_leave') == true) {
                           ref.logmodule.writelog('info', "Double leave event check enabled");
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
                           ref.triggers.getLeaveGeofenceAC().trigger(tokens,state,null)

                           ref.logmodule.writelog('info', "Trigger leave card for " + jsonMsg.desc);
                        } else {
                           ref.logmodule.writelog('info', "The user is already outside the fence. No need to trigger again");
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
                     ref.triggers.getEventOwntracksAC().trigger(tokens,state,null)
                                                                  
                     ref.logmodule.writelog('info', "Trigger generic card for " + jsonMsg.desc);
                  } else {
                     ref.logmodule.writelog('info', "This trigger is not needed because the transition is not valid");
                  }
               } else {
                  ref.logmodule.writelog ('info', "Accuracy is "+ jsonMsg.acc + " and needs to be below " + parseInt(ref.Homey.ManagerSettings.get('accuracy')))
               }
               break;
            case 'location':
               // This location object describes the location of the device that published it.
               ref.logmodule.writelog('info', "We have received a location message");
               currentUser.lon = jsonMsg.lon;
               currentUser.lat = jsonMsg.lat;
               currentUser.timestamp = jsonMsg.tst;
               currentUser.tid = jsonMsg.tid;
               if (jsonMsg.batt !== undefined) {
                  currentUser.battery = jsonMsg.batt;
                  ref.logmodule.writelog('info', "Set battery percentage for "+ currentUser.userName +" to "+ currentUser.battery+ "%");
               
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
                  ref.triggers.getEventBattery().trigger(tokens,state, null)
               }
               break;
            case 'waypoint' :
               // Waypoints denote specific geographical locations that you want to keep track of. You define a way point on the OwnTracks device, 
               // and OwnTracks publishes this waypoint (if the waypoint is marked shared)
               ref.logmodule.writelog('info', "We have received a waypoint message");

               // Set fenceData. This is done to update or add new
               // fences so they can be selected in an autocomplete box
               var fenceData = {}
               fenceData.fenceName = jsonMsg.desc;
               fenceData.lon = jsonMsg.lon;
               fenceData.lat = jsonMsg.lat;
               fenceData.rad = jsonMsg.rad;
               fenceData.timestamp = jsonMsg.tst;
               ref.globalVar.setFence(fenceData);
               break;
            case 'waypoints' :
               // The message type waypoints is send when publish waypoints is selected in the owntracks phone app.
               // The phone app sends all regions to homey. So lets handle that message and add all the regions 
               // as geofence. Also store the coordinates and radius. 
               var fenceData = {}
               for (let i=0; i < jsonMsg.waypoints.length; i++) {
                  ref.logmodule.writelog('debug', "Waypoint "+i+": "+JSON.stringify(jsonMsg.waypoints[i]));
                  fenceData = {};
                  fenceData.fenceName = jsonMsg.waypoints[i].desc;
                  fenceData.lon = jsonMsg.waypoints[i].lon;
                  fenceData.lat = jsonMsg.waypoints[i].lat;
                  fenceData.rad = jsonMsg.waypoints[i].rad;
                  fenceData.timestamp = jsonMsg.waypoints[i].tst;
                  ref.globalVar.setFence(fenceData);
               }
            case 'encrypted' :
               // This payload type contains a single data element with the original JSON object _type (e.g. location, beacon, etc.) encrypted payload in it.
               break;
            case 'beacon' :
               // This payload contains information about detected iBeacon
               ref.logmodule.writelog('info', "Beacon message detected:");
               ref.logmodule.writelog('info', "uuid: "+jsonMsg.uuid+"major: "+jsonMsg.major+" minor: "+jsonMsg.minor+" tst: "+jsonMsg.tst+" acc: "+jsonMsg.acc+" rssi: "+jsonMsg.rssi+" prox: "+jsonMsg.prox);
               break;
            default:
               break;
         }
         ref.globalVar.setUser(currentUser, validTransition);
      }
   }
   updateRef(app) {
      this.triggers = app.triggers;
   }
}

module.exports = handleOwntracks;
