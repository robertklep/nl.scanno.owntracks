"use strict";

class handleOwntracks {
   constructor(app) {
      this.Homey = require('homey');
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
         currentUser = ref.users.getUser(topicArray[1]);
         if (currentUser === null) {
            currentUser = ref.users.addUser(topicArray[1], topicArray[2], jsonMsg.tid);
            currentDevice = currentUser.getDevice(topicArray[2]);
         } else {
           // Check if we already know the device the user is using. If not, add the device to the
           // user data. If the known device differs from the actual device, update!

           if (currentUser.getDevices().length == 0 || currentUser.getDevice(topicArray[2]) == null) {
             currentUser.addDevice(topicArray[2], jsonMsg.tid);
             ref.logmodule.writelog('error', "Device changed for user "+currentUser.name+" to " + currentUser.getDevice(topicArray[2]));
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

                  // Set fenceData. This is done to update or add new
                  // fences so they can be selected in an autocomplete box
                  this.checkAndAddFence(jsonMsg);

                  switch (jsonMsg.event) {
                     case 'enter':
                        if (ref.Homey.ManagerSettings.get('double_enter') == true) {
                           ref.logmodule.writelog('info', "Double enter event check enabled");
                           if (!currentDevice.getLocation().inFence(jsonMsg.desc)) {
                              validTransition = true;
                           } else {
                              validTransition = false;
                           }
                        }
                        if (validTransition == true) {
                             this.generateEnterEvent(topic, currentUser, currentDevice, jsonMsg.desc)
                             currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.tst);
                             currentDevice.getLocation().enterFence(jsonMsg.desc);

                             ref.logmodule.writelog('info', "Trigger enter card for " + jsonMsg.desc);
                        } else {
                           ref.logmodule.writelog('info', "The user is already within the fence. No need to trigger again");
                        }
                        break;
                     case 'leave':
                        if (ref.Homey.ManagerSettings.get('double_leave') == true) {
                           ref.logmodule.writelog('info', "Double leave event check enabled");
                           if (currentDevice.getLocation().inFence(jsonMsg.desc))  {
                              validTransition = true;
                           } else {
                              validTransition = false;
                           }
                        }
                        if (validTransition == true) {
                           this.generateLeaveEvent(topic, currentUser, currentDevice, jsonMsg.desc);
                           currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.tst);
                           currentDevice.getLocation().leaveFence(jsonMsg.desc);

                           ref.logmodule.writelog('info', "Trigger leave card for " + jsonMsg.desc);
                        } else {
                           ref.logmodule.writelog('info', "The user is already outside the fence. No need to trigger again");
                        }
                        break;
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

               break;
            case 'waypoints' :
               // The message type waypoints is send when publish waypoints is selected in the owntracks phone app.
               // The phone app sends all regions to homey. So lets handle that message and add all the regions
               // as geofence. Also store the coordinates and radius.
               var fenceData = {}
               for (let i=0; i < jsonMsg.waypoints.length; i++) {
                  ref.logmodule.writelog('debug', "Waypoint "+i+": "+JSON.stringify(jsonMsg.waypoints[i]));
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
    * @param  {string} topic       The topic the message was received on.
    * @param  {object} currentUser Reference to the currentUser array so fields can be accessed.
    * @param  {object} currentDevice Reference to the current device (from the users device array)
    * @param  {object} jsonMsg     The parsed MQTT message payload into JSON format.
    * @return {type}             none.
    */
   handleLocationMessage(topic, currentUser, currentDevice, jsonMsg) {
     const ref=this;
     var staleFences = [];
     this.logmodule.writelog('info', "We have received a location message");
     if (jsonMsg.batt !== undefined) {
        // Update battery percentage
        currentDevice.setBattery(jsonMsg.batt);
        ref.logmodule.writelog('info', "Set battery percentage for user: "+ currentUser.getName() +" with device: "+ currentDevice.getName()+ " to "+ currentDevice.getBattery()+ "%");
        let tokens = {
           user: currentUser.getName(),
           fence: currentDevice.getLocation().fence[0],
           percBattery: jsonMsg.batt
        }
        let state = {
           triggerTopic: topic,
           percBattery: jsonMsg.batt,
           user: currentUser.getName(),
           device: currentDevice.getName()
        }
        //currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, currentDevice.getLocation().fence, jsonMsg.tst);
        currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.tst);

        ref.triggers.getEventBattery().trigger(tokens,state, null).catch( function(e) {
          ref.logmodule.writelog('error', "Error occured: " +e);
        });
     }
     if (ref.Homey.ManagerSettings.get('use_inregions') == true) {
       // There is a field inregions that contains the region(s) the user is in.
       // If this field is available, check if the region reported, is the same as
       // the current region stored.
       if (jsonMsg.inregions !== undefined && ref.isAccurate(jsonMsg)) {
         // The client supports inregions, so for future calls, lets remember that.
         currentDevice.setInregionsSupport(true);

         ref.logmodule.writelog('info', "inregions: " + jsonMsg.inregions);
         for (var region in jsonMsg.inregions) {
           if (currentDevice.getLocation().inFence(jsonMsg.inregions[region])) {
             ref.logmodule.writelog('debug', "User "+currentUser.name+ " already is in region " + jsonMsg.inregions[region]);
           } else {
             ref.logmodule.writelog('debug', "User "+currentUser.name+ " is NOT in region " + jsonMsg.inregions[region]);
             // add fence to array
             // generate enter event
             currentDevice.getLocation().enterFence(jsonMsg.inregions[region]);
             currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.tst);
             this.generateEnterEvent(topic, currentUser, currentDevice, jsonMsg.inregions[region]);
           }
         }
         // Check for fences that are registered, but not received in the location message
         for (var fence in currentDevice.getLocation().fence) {
            var stale = true;
            for (var region in jsonMsg.inregions) {
              if (currentDevice.getLocation().fence[fence] === jsonMsg.inregions[region]) {
                // stale fence found
                ref.logmodule.writelog('debug', currentDevice.getLocation().fence[fence]+" found in inRegions");
                stale = false;
              }
            }
            if (stale) {
              // Fence is stale, add it to the array with stale fences
              staleFences.push(currentDevice.getLocation().fence[fence]);
            }
          }

          // For all stale fences, generate a leave event and remove from devices fence list
          for (var stale in staleFences) {
            ref.logmodule.writelog('debug', staleFences[stale]+ " is stale, leave it..");
            this.generateLeaveEvent(topic, currentUser, currentDevice, staleFences[stale]);
            currentDevice.setLocation(jsonMsg.lat, jsonMsg.lon, jsonMsg.tst);
            currentDevice.getLocation().leaveFence(staleFences[stale]);
          }
       } else {
          if (currentDevice.supportsInregions() && ref.isAccurate(jsonMsg)) {
             // current device uses inregions,but its not in the location message
             // this means that the device is not in any fence
             ref.logmodule.writelog('debug', "No inRegions found, but device supports it, so not inside any fence.");
             if (currentDevice.getLocation().fence.length > 0) {
                for (var stale in currentDevice.getLocation().fence) {
                   this.generateLeaveEvent(topic, currentUser, currentDevice, currentDevice.getLocation().fence[stale]);
                }
                currentDevice.getLocation().fence = [];
             }
          }
       }
     }
   }

   /**
    * generateLeaveEvent - description
    *
    * @param  {type} topic         description
    * @param  {type} currentUser   description
    * @param  {type} currentDevice description
    * @param  {type} fence         description
    * @return {type}               description
    */
   generateLeaveEvent(topic, currentUser, currentDevice, fence) {
     const ref = this;
     ref.logmodule.writelog('debug', "generateLeaveEvent "+fence+" - for " + currentUser.getName()+", "+currentDevice.getName());
     let tokens = {
        event: "leave",
        user: currentUser.getName(),
        fence: fence,
        percBattery: currentDevice.getBattery()
     }
     let state = {
        triggerTopic: topic,
        triggerFence: fence,
        event: "leave",
        user: currentUser.getName()
     }

     ref.triggers.getLeaveGeofenceAC().trigger(tokens,state,null).catch( function(e) {
       ref.logmodule.writelog('error', "Error occured: " +e);
     });
     ref.triggers.getEventOwntracksAC().trigger(tokens,state,null).catch( function(e) {
       ref.logmodule.writelog('error', "Error occured: " +e);
     });
   }

   /**
    * generateEnterEvent - description
    *
    * @param  {type} topic         description
    * @param  {type} currentUser   description
    * @param  {type} currentDevice description
    * @param  {type} fence         description
    * @return {type}               description
    */
   generateEnterEvent(topic, currentUser, currentDevice, fence) {
     const ref = this;
     ref.logmodule.writelog('debug', "generateEnterEvent "+fence+" - for " + currentUser.getName()+", "+currentDevice.getName());
     let tokens = {
        event: "enter",
        user: currentUser.getName(),
        fence: fence,
        percBattery: currentDevice.getBattery()
     }
     let state = {
        triggerTopic: topic,
        triggerFence: fence,
        event: "enter",
        user: currentUser.getName()
     }

     ref.triggers.getEnterGeofenceAC().trigger(tokens,state,null).catch( function(e) {
       ref.logmodule.writelog('error', "Error occured: " +e);
     });
     ref.triggers.getEventOwntracksAC().trigger(tokens,state,null).catch( function(e) {
       ref.logmodule.writelog('error', "Error occured: " +e);
     });
   }


   /**
    * checkAndAddFence - description
    *
    * @param  {type} jsonMsg description
    * @return {type}         description
    */
   checkAndAddFence(jsonMsg) {
     if (this.fences.getFence(jsonMsg.dec) == null) {
       this.fences.addFence(jsonMsg.lat, jsonMsg.lon, jsonMsg.rad, jsonMsg.desc, jsonMsg.tid);
     }
   }

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
               "rad": this.fences.getFences()[i].radius,
               "tst": this.fences.getFences()[i].timestamp
             }
             msgArray.push(waypoint);
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
