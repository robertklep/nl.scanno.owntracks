"use strict";

class triggerOwntracks {

   constructor(app) {
      this.Homey     = require('homey');
      this.broker    = app.broker;
      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;

      var eventOwntracksAC = null;
      var enterGeofenceAC = null;
      var leaveGeofenceAC = null;
      var eventBattery = null;

      this.OnInit();
   }

   OnInit() {
      this.listenForMessage();
   }

   /*
      The function listenForMessage registers all the trigger events. As soon as an event is
      triggered it calls one of the triggers in this function.
   */
   listenForMessage () {
      const ref = this;
      // Start listening for the events.

      this.logmodule.writelog('info', "listenForMessage called");

      this.eventOwntracksAC = new this.Homey.FlowCardTrigger('eventOwntracks_AC');
      this.enterGeofenceAC = new this.Homey.FlowCardTrigger('enterGeofence_AC');
      this.leaveGeofenceAC = new this.Homey.FlowCardTrigger('leaveGeofence_AC');
      this.eventBattery = new this.Homey.FlowCardTrigger('eventBattery');

      this.eventOwntracksAC.register();
      this.enterGeofenceAC.register();
      this.leaveGeofenceAC.register();
      this.eventBattery.register();


      ref.eventOwntracksAC.registerRunListener((args, state ) => {
         ref.logmodule.writelog('info', "Listener eventOwntracksAC called");
         try {
            if (ref.processMessage(args, state, 'eventOwntracks_ac')) {
               return Promise.resolve( true );
            } else {
               return Promise.resolve( false );
            }
          } catch(err) {
            ref.logmodule.writelog('error', "Error in Listener enterGeofenceAC: " +err);
            return Promise.reject(err);
          }
      })

      ref.enterGeofenceAC.registerRunListener( ( args, state ) => {
         ref.logmodule.writelog('info', "Listener enterGeofence_AC called");
         try {
            if ( ref.processMessage(args, state, 'enterGeofence_ac')) {
               return Promise.resolve( true );
            } else {
              return Promise.resolve( false );
            }
         } catch(err) {
            ref.logmodule.writelog('error', "Error in Listener enterGeofenceAC: " +err);
            return Promise.reject(err);
         }
      })
   
      ref.leaveGeofenceAC.registerRunListener( ( args, state ) => {
         ref.logmodule.writelog('info', "Listener leaveGeofenceAC called");
         try {
            if (ref.processMessage(args, state, 'leaveGeofence_ac')) {
               return Promise.resolve( true );
            } else {
               return Promise.resolve( false );
            }
         } catch(err) {
            ref.logmodule.writelog('error', "Error in Listener leaveGeofenceAC: " +err);
            return Promise.reject(err);
         }
      })
   
      ref.eventBattery.registerRunListener( ( args, state ) => {
         ref.logmodule.writelog('info', "Listener eventBattery called");
         try {
            if ( ref.processMessage(args, state, 'eventBattery')) {
               return Promise.resolve( true );
            } else {
               return Promise.resolve( false );
            }
         } catch(err) {
            ref.logmodule.writelog('error', "Error in Listener leaveGeofenceAC: " +err);
            return Promise.reject(err);
         }
      })

      ref.createAutocompleteActions()
   }  

   createAutocompleteActions() {
      const ref = this;
      ref.logmodule.writelog('info', "createAutocompleteActions called");
      // Put all the autocomplte actions here. 

      ref.eventOwntracksAC.getArgument('nameUser').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve(ref.globalVar.searchUsersAutocomplete(query, true) );
      });

      ref.enterGeofenceAC.getArgument('nameUser').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve( ref.globalVar.searchUsersAutocomplete(query, true) );
      });

      ref.leaveGeofenceAC.getArgument('nameUser').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve( ref.globalVar.searchUsersAutocomplete(query, true) );
      });

      ref.eventBattery.getArgument('nameUser').registerAutocompleteListener(( query, args ) => { 
         return Promise.resolve( ref.globalVar.searchUsersAutocomplete(query, true) );
      });

      ref.eventOwntracksAC.getArgument('nameGeofence').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve( ref.globalVar.searchFenceAutocomplete(query, true) );
      });

      ref.enterGeofenceAC.getArgument('nameGeofence').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve( ref.globalVar.searchFenceAutocomplete(query, true) );
      });

      ref.leaveGeofenceAC.getArgument('nameGeofence').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve( ref.globalVar.searchFenceAutocomplete(query, true) );
      });
   }


   processMessage(args, state, triggerType) {
      const ref = this;
      var reconnectClient = false;

      ref.logmodule.writelog ('info', "state.topic = " + state.triggerTopic + " topic = " + args.mqttTopic );

      // MQTT subscription topics can contain "wildcards", i.e a + sign. However the topic returned
      // by MQTT brokers contain the topic where the message is posted on. In that topic, the wildcard
      // is replaced by the actual value. So we will have to take into account any wildcards when matching the topics.

      var arrTriggerTopic = state.triggerTopic.split('/');
      var matchTopic = true;

      switch (triggerType) {
         case 'eventBattery':
         case 'eventOwntracks_ac':
         case 'enterGeofence_ac':
         case 'leaveGeofence_ac':
            if (args.nameUser !== undefined ) {
               ref.logmodule.writelog('info', "received user "+arrTriggerTopic[1]+"  trigger user: "+args.nameUser.user);
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
         console.log ('info', "triggerTopic = equal" )
         // The topic is equal, but we also need the geofence to be equal as well, if not then the 
         // callback should be false
         switch(triggerType) {
            case 'eventOwntracks_ac':
            case 'enterGeofence_ac':
            case 'leaveGeofence_ac':
               ref.logmodule.writelog ('info', "Received Fence = "+state.triggerFence+"  trigger fence = "+args.nameGeofence.fence)
               if ( state.triggerFence == args.nameGeofence.fence || args.nameGeofence.fence == "*" ) {
                  ref.logmodule.writelog ('info', "triggerFence = equal")
                  return true;
               } else {
                  return false;
               }
               break;
            case 'eventBattery':
               var currentUser = ref.globalVar.getUser(state.user);
               // Check if the battery percentage is below the trigger percentage
               if ( state.percBattery < args.percBattery ) {
                  // Check if the trigger has already fired. If so, do not fire again
                  if (currentUser.battTriggered == false) {
                     ref.logmodule.writelog ('info', "battery percentage ("+ state.percBattery +"%) of "+ state.user+" is below trigger percentage of "+ args.percBattery +"%");
                     currentUser.battTriggered = true;
                     ref.globalVar.setUser(currentUser, false);
                     return true;
                  } else {
                     ref.logmodule.writelog ('info', "battery trigger already triggered for "+ state.user);
                     return false;
                  }
               }
               // Check if the battery percentage if above the trigger percentage. If this is the case
               // set the state.Triggered to false in case the phone was been charged again
               if (state.percBattery >= args.percBattery && currentUser.battTriggered !== false) {
                  ref.logmodule.writelog ('info', "Reset battery triggered state for "+ state.user);
                  currentUser.battTriggered = false;
                  ref.globalVar.setUser(currentUser, false);
               }
               return false;
               break;
            default:
               return false;
               break;
         }
      }
      // This is not the topic I was waiting for and it is a known topic
      else if (state.triggerTopic !== args.mqttTopic & ref.globalVar.getTopicArray().indexOf(args.mqttTopic) !== -1) {
         ref.logmodule.writelog('info', "We are not waiting for this topic");
         return false;
      }
      // this is (still) an unknown topic. We arrive her only 1 time for every topic. The next time the if and else if will
      // trigger first.
      else {
         // Add another check for the existence of the topic, just in case there is somehting falling through the 
         // previous checks...

   //      broker.subscribeToTopic(args.mqttTopic);
      }
      return false;
   }

   getEventOwntracksAC() {
      return this.eventOwntracksAC;
   }

   getEnterGeofenceAC() {
      return this.enterGeofenceAC;
   }

   getLeaveGeofenceAC() {
      return this.leaveGeofenceAC;
   }

   getEventBattery() {
      return this.eventBattery;
   }
}

module.exports = triggerOwntracks;
