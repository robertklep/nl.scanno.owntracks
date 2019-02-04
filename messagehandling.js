"use strict";

class handleOwntracks {
   constructor(app) {
      this.Homey = require('homey');
//      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.triggers  = app.triggers;

      this.users = app.users;
      this.fences = app.fences;
   }

   /**
    * receiveMessage - Handles the received messages from the MQTT topic.
    * The message will be paesed as JSON and checked what event was received from the
    * Owntracks phone app.
    *
    * @param  {type} topic   topic where the messages was received on
    * @param  {type} message payload from the MQTT message.
    * @param  {type} args    array with arguments from trigger card.
    * @param  {type} state   array with parameters that are kept inside the triger card.
    * @return {type}         none.
    */
   receiveMessage(topic, message, args, state) {
      const ref = this;
      var validJSON = true;
      var validTransition = false;
      var topicArray = topic.split('/');
      var currentUser = {};
      var currentDevice = {};

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
         //currentUser = ref.globalVar.getUser(topicArray[1]);
         currentUser = ref.users.getUser(topicArray[1]);
         if (currentUser === null) {
            currentUser = ref.users.addUser(topicArray[1], topicArray[2], jsonMsg.tid);
            currentDevice = currentUser.getDevice(topicArray[2]);
         } else {
           // Check if we already know the device the user is using. If not, add the device to the
           // user data. If the known device differs from the actual device, update!

           if (currentUser.getDevices().length == 0 || currentUser.getDevice(topicArray[2]) == null) {
//           if (currentUser.userDevice == undefined || currentUser.userDevice !== topicArray[2]) {
             //currentUser.userDevice = topicArray[2];
             currentUser.addDevice(topicArray[2], jsonMsg.tid);
             ref.logmodule.writelog('error', "Device changed for user "+currentUser.name+" to " + currentUser.getDevices()[0]);
           }
           currentDevice = currentUser.getDevice(topicArray[2]);
         }
         ref.logmodule.writelog('debug', "currentDevice = " + JSON.stringify(currentDevice));

         switch (jsonMsg._type) {
            case 'transition':
               var fenceData = {};
               validTransition = true;
               // check the accuracy. If it is too low (i.e a high amount is meters) then perhaps we should skip the trigger
               if (jsonMsg.acc <= parseInt(ref.Homey.ManagerSettings.get('accuracy'))) {
                  // The accuracy of location is lower then the treshold value, so the location change will be trggerd
                  ref.logmodule.writelog('info', "Accuracy is within limits")

                  //currentUser.getDevices()[0].setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.desc,jsonMsg.tst);
                  //currentUser.lon = jsonMsg.lon;
                  //currentUser.lat = jsonMsg.lat;
                  //currentUser.timestamp = jsonMsg.tst;

                  // Set fenceData. This is done to update or add new
                  // fences so they can be selected in an autocomplete box
                  this.checkAndAddFence(jsonMsg);

                  switch (jsonMsg.event) {
                     case 'enter':
                        if (ref.Homey.ManagerSettings.get('double_enter') == true) {
                           ref.logmodule.writelog('info', "Double enter event check enabled");
                           //if (currentUser.fence !== jsonMsg.desc)  {
                           if (currentDevice.getLocation().fence !== jsonMsg.dec) {
                              validTransition = true;
                           } else {
                              validTransition = false;
                           }
                        }
                        if (validTransition == true) {
                             //currentUser.fence = jsonMsg.desc;
                             let tokens = {
                                user: currentUser.name,
                                fence: jsonMsg.desc,
                                percBattery: currentDevice.getBattery()
                             }
                             let state = {
                                triggerTopic: topic,
                                triggerFence: jsonMsg.desc
                             }
                             ref.triggers.getEnterGeofenceAC().trigger(tokens,state,null).catch( function(e) {
                               ref.logmodule.writelog('error', "Error occured: " +e);
                             })

                             currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.desc, jsonMsg.tst);

                             ref.logmodule.writelog('info', "Trigger enter card for " + jsonMsg.desc);
                        } else {
                           ref.logmodule.writelog('info', "The user is already within the fence. No need to trigger again");
                        }
                        break;
                     case 'leave':
                        if (ref.Homey.ManagerSettings.get('double_leave') == true) {
                           ref.logmodule.writelog('info', "Double leave event check enabled");
                           if (currentDevice.getLocation().fence !== "")  {
                              validTransition = true;
                           } else {
                              validTransition = false;
                           }
                        }
                        if (validTransition == true) {
                           //currenDevice.getLocation().fence = "";
                           currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, "", jsonMsg.tst);

                           let tokens = {
                              user: currentUser.name,
                              fence: "",
                              percBattery: currentDevice.getBattery()
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
                        user: currentUser.name,
                        fence: currentDevice.getLocation().fence,
                        percBattery: currentDevice.getBattery()
                     }
                     let state = {
                        triggerTopic: topic,
                        triggerFence: jsonMsg.desc
                     }

                     //currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.desc,jsonMsg.tst);
                     this.logmodule.writelog('debug', "Transition user: " + JSON.stringify(this.users.getUser(currentUser.name)));
                     //this.updateUser(currentUser, currentDevice, jsonMsg);

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
               ref.handleLocationMessage(topic, currentUser, currentDevice, jsonMsg);
               break;
            case 'waypoint' :
               // Waypoints denote specific geographical locations that you want to keep track of. You define a way point on the OwnTracks device,
               // and OwnTracks publishes this waypoint (if the waypoint is marked shared)
               ref.logmodule.writelog('info', "We have received a waypoint message");

               // Set fenceData. This is done to update or add new
               // fences so they can be selected in an autocomplete box
               this.checkAndAddFence(jsonMsg);

//               var fenceData = {}
//               fenceData.fenceName = jsonMsg.desc;
//               fenceData.lon = jsonMsg.lon;
//               fenceData.lat = jsonMsg.lat;
//               fenceData.rad = jsonMsg.rad;
//               fenceData.timestamp = jsonMsg.tst;
//               ref.globalVar.setFence(fenceData);
               break;
            case 'waypoints' :
               // The message type waypoints is send when publish waypoints is selected in the owntracks phone app.
               // The phone app sends all regions to homey. So lets handle that message and add all the regions
               // as geofence. Also store the coordinates and radius.
               var fenceData = {}
               for (let i=0; i < jsonMsg.waypoints.length; i++) {
                  ref.logmodule.writelog('debug', "Waypoint "+i+": "+JSON.stringify(jsonMsg.waypoints[i]));
//                  fenceData = {};
//                  fenceData.fenceName = jsonMsg.waypoints[i].desc;
//                  fenceData.lon = jsonMsg.waypoints[i].lon;
//                  fenceData.lat = jsonMsg.waypoints[i].lat;
//                  fenceData.rad = jsonMsg.waypoints[i].rad;
//                  fenceData.timestamp = jsonMsg.waypoints[i].tst;
//                  ref.globalVar.setFence(fenceData);

                  this.checkAndAddFence(jsonMsg.waypoints[i]);
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
         //ref.globalVar.setUser(currentUser, validTransition);
         //this.updateUser(currentUser, currentDevice, jsonMsg);
      }
   }

   /**
    * handleLocationMessage - The received message is a location message.
    * The location message is further processed for battery percentage and inregions field.
    * The inregions field can be used to fix missed enter / leave events due to GPS or network
    * problems.
    *
    * @param  {type} topic       The topic the message was received on.
    * @param  {type} currentUser Reference to the currentUser array so fields can be accessed.
    * @param  {type} jsonMsg     The parsed MQTT message payload into JSON format.
    * @return {type}             none.
    */
   handleLocationMessage(topic, currentUser, currentDevice, jsonMsg) {
     const ref=this;
     this.logmodule.writelog('info', "We have received a location message");
//     currentUser.lon = jsonMsg.lon;
//     currentUser.lat = jsonMsg.lat;
//     currentUser.timestamp = jsonMsg.tst;
//     currentUser.tid = jsonMsg.tid;
     currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, currentDevice.getLocation().fence, jsonMsg.tst);
     if (jsonMsg.batt !== undefined) {
        currentDevice.setBattery(jsonMsg.batt);
        ref.logmodule.writelog('info', "Set battery percentage for "+ currentUser.name +" to "+ currentDevice.getBattery()+ "%");
        this.logmodule.writelog('debug', "currentDevice: " + JSON.stringify(currentDevice));
        let tokens = {
           user: currentUser.name,
           fence: currentDevice.getLocation().fence,
           percBattery: jsonMsg.batt
        }
        let state = {
           triggerTopic: topic,
           percBattery: jsonMsg.batt,
           user: currentUser.name,
           device: currentDevice.name
        }

        ref.triggers.getEventBattery().trigger(tokens,state, null).catch( function(e) {
          ref.logmodule.writelog('error', "Error occured: " +e);
        });
     }
     if (ref.Homey.ManagerSettings.get('use_inregions') == true) {
       // There is a field inregions that contains the region(s) the user is in.
       // If this field is available, check if the region reported, is the same as
       // the current region stored.
       if (jsonMsg.inregions !== undefined) {
         var bInRegion = false;
         var isCurrentRegionSet = false;
         var region = 0;
         // The client supports inregions, so for future calls, lets remember that.
         currentUser.inregions = true;

         ref.logmodule.writelog('info', "inregions: " + jsonMsg.inregions);
         for (region in jsonMsg.inregions) {
           ref.logmodule.writelog('info', "region " + jsonMsg.inregions[region]);
           if (currentDevice.getLocation().fence === jsonMsg.inregions[region]) {
             ref.logmodule.writelog('debug', "User "+currentUser.name+ " already is in region " + jsonMsg.inregions[region]);
             bInRegion = true;
           }
         }
         if (ref.isAccurate(jsonMsg)) {
           ref.logmodule.writelog('debug', "isAccurate");
         }
         if (ref.isAccurate(jsonMsg) && bInRegion === false) {
           // if currentUser.fence is set, but the current region is different, then we missed
           // a leave event.
           if (currentDevice.getLocation().fence !== "") {
             ref.logmodule.writelog('debug', "User "+currentUser.name+ " is in " + currentDevice.getLocation().fence+ " but should not be.");
             isCurrentRegionSet = true;
             ref.generateLeaveEvent(topic, currentUser, currentDevice, jsonMsg);
           }

           // If bInRegion is true, then at least one of the received regions is already set
           // If bInRegion is false, we must have missed a trigger event.
           ref.logmodule.writelog('debug', "LocationRequest Fence: "+currentDevice.getLocation().fence);
           if (currentDevice.getLocation().fence === "") {
             ref.logmodule.writelog('debug', "User "+currentUser.name+ " is not in a fence, but should be in: "+jsonMsg.inregions[0]);
             //currentDevice.getLocation().fence = jsonMsg.inregions[0];
             currentDevice.setLoaction(jsonMsg.lat, jsonMsg.lon, jsonMsg.inregions[0], jsonMsg.tst);
             let tokens = {
                event: "enter",
                user: currentUser.name,
                fence: jsonMsg.inregions[0],
                percBattery: currentDevice.getBattery()
             }
             let state = {
                triggerTopic: topic,
                triggerFence: jsonMsg.inregions[0]
             }
             ref.triggers.getEnterGeofenceAC().trigger(tokens,state,null).catch( function(e) {
               ref.logmodule.writelog('error', "Error occured: " +e);
             });
             ref.triggers.getEventOwntracksAC().trigger(tokens,state,null).catch( function(e) {
               ref.logmodule.writelog('error', "Error occured: " +e);
             });
           }
         }
       }
       else {
         // When there is no inregions field, but the inregions field IS supported,
         // then the phone is NOT inside any region. If the userdata shows a fence name,
         // we might have missed a leave event, so we can send one now.
         if (currentUser.inregions === true && currentDevice.getLocation().fence !== "" && ref.isAccurate(jsonMsg)) {
           ref.logmodule.writelog('debug', "handleLocationMessage - no inregions field, fence = "+currentDevice.getLocation().fence);
           ref.generateLeaveEvent(topic, currentUser, currentDevice, jsonMsg);
         }
       }
     }
   }

   /**
    * generateLeaveEvent - description
    *
    * @param  {type} topic       description
    * @param  {type} currentUser description
    * @param  {type} jsonMsg     description
    * @return {type}             description
    */
   generateLeaveEvent(topic, currentUser, currentDevice, jsonMsg) {
     const ref = this;
     ref.logmodule.writelog('debug', "generateLeaveEvent - for " + currentUser.name);
     let tokens = {
        event: "leave",
        user: currentUser.name,
        fence: "",
        percBattery: currentDevice.getBattery()
     }
     let state = {
        triggerTopic: topic,
        triggerFence: ""
     }

     currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, "", jsonMsg.tst);

     ref.triggers.getLeaveGeofenceAC().trigger(tokens,state,null).catch( function(e) {
       ref.logmodule.writelog('error', "Error occured: " +e);
     });
     ref.triggers.getEventOwntracksAC().trigger(tokens,state,null).catch( function(e) {
       ref.logmodule.writelog('error', "Error occured: " +e);
     });
   }

   checkAndAddFence(jsonMsg) {
     if (this.fences.getFence(jsonMsg.dec) == null) {
       this.fences.addFence(jsonMsg.lat, jsonMsg.lon, jsonMsg.rad, jsonMsg.desc);
     }
   }

/*   updateUser(user, device, jsonMsg) {
     if (device !== null) {
       var fence = "";
       if (jsonMsg.desc !== undefined ) {
         fence = jsonMsg.desc;
       }
       this.logmodule.writelog('debug', "Fence: " + fence);
       device.setLocation(jsonMsg.lat, jsonMsg.lon, fence, jsonMsg.tst);

       if (jsonMsg.batt !== undefined) {
         device.setBattery(jsonMsg.batt);
       }
     }
     this.logmodule.writelog('debug', "Updated user: " + JSON.stringify(this.users.getUser(user.name)));
   }
*/
   /**
    * createCommandMessage - Creates a message that sends a command to a phone.
    * This command contains an array with all the fences that are registered. This way it is
    * easy to sync fences with phones that use the owntracks client
    *
    * @param  {type} command contains the command to send to the phone
    * @return {type}         the full command body that should be send with the command.
    */
   createCommandMessage(command) {
     var msgArray = [];
     var arrayContainer = {};
     var msgCommand = {};

     switch (command) {
       case 'setWaypoints':
         try {
           for (var i=0; i < this.fences.getFences().length; i++) {
             let waypoint = {
               "_type": "waypoint",
               "desc": this.fences.getFences()[i].name,
               "lat": this.fences.getFences()[i].lat,
               "lon": this.fences.getFences()[i].lon,
               "rad": this.fences.getFences()[i].rad,
               "tst": this.fences.getFences()[i].timestamp
             }
             msgArray.push(waypoint);
//             this.logmodule.writelog('debug', "waypoint: "+JSON.stringify(waypoint))
           }
           arrayContainer = {
             "_type": "waypoints",
             "waypoints": msgArray
           }
           msgCommand = {
             "_type": "cmd",
             "action": "setWaypoints",
             "waypoints": arrayContainer
           }
         } catch(err) {
           this.logmodule.writelog('error', "createCommandMessage error: "+err);
           return err;
         }
         break;
       default:
         break;
     }
     return msgCommand;
   }


   /**
    * isAccurate - Checks if the accuracy of the current message is within specified limits
    *
    * @return {type}  true if accuracy is within limits
    */
   isAccurate(jsonMsg) {
     return (jsonMsg.acc <= parseInt(this.Homey.ManagerSettings.get('accuracy')));
   }

   /**
    * updateRef - description
    *
    * @param  {type} app description
    * @return {type}     description
    */
   updateRef(app) {
      this.triggers = app.triggers;
   }
}

module.exports = handleOwntracks;
