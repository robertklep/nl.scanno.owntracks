"use strict";

/**
 * Trigger: Base Trigger class that handles TriggerCarsds.
 * This class should not be instantiated. Instead use the derived
 * classes.
 */
class Trigger {

  /**
   * constructor - Constructor for the TriggerCards
   *
   * @param  {type} trigger instance of a Homey triggercard
   * @param  {type} app     referece to the main app class.
   */
  constructor(trigger, app) {
    app.logmodule.writelog('debug', "Trigger constructor called")
    this.trigger   = trigger;
    this.logmodule = app.logmodule;
    this.users = app.users;
    this.fences = app.fences;
    this.onInit();
  }

  /**
   * onInit - Do basic initialisation, such as register the triggercard and
   *          register the RunListener.The RunListener processMessage() should
   *          be implemented in the subclasses that implement the specific
   *          triggercards.
   *
   */
  onInit() {
    this.logmodule.writelog('debug', "Trigger onInit() called")
    this.trigger.register();
    this.trigger.registerRunListener((args, state ) => {
       this.logmodule.writelog('info', "Trigger listener called");
       try {
          if (this.processMessage(args, state)) {
             return Promise.resolve( true );
          } else {
             return Promise.resolve( false );
          }
        } catch(err) {
          this.logmodule.writelog('error', "Error in Trigger Listener: " +err);
          return Promise.reject(err);
        }
    })
    this.setAutocompleteActions();
  }

  /**
   * setAutocompleteActions - set the autocomplete actions that are defined in
   *                          the specific TriggerCard implementation.
   *
   */
  setAutocompleteActions() {
    this.logmodule.writelog('debug', "setAutocompleteActions() Trigger");
  }

  /**
   * isMatch - checks if the current TriggerCard matches the conditions.
   *           The user from the received event should match the user set
   *           in the TriggerCard.
   *
   * @param  {type} args  Arguments of the Triggercard
   * @param  {type} state State of the trigger card
   * @return {type}       true when the card matches, otherwise false.
   */
  isMatchUser(args, state) {
    this.logmodule.writelog('debug', "isMatchUser called");
    var matchTopic = false;
    var arrTriggerTopic = state.triggerTopic.split('/');

    if (args.nameUser !== undefined ) {
       this.logmodule.writelog('info', "received user "+arrTriggerTopic[1]+"  trigger user: "+args.nameUser.user);
       if (arrTriggerTopic[1] === args.nameUser.user || args.nameUser.user == '*') {
          matchTopic = true;
       } else {
          matchTopic = false;
       }
    } else {
       this.logmodule.writelog('debug', "no match");
       matchTopic = false;
    }
    return matchTopic;
  }

  isMatchDevice(args, state) {
    this.logmodule.writelog('debug', "isMatchDevice called");
    var matchTopic = false;
    var arrTriggerTopic = state.triggerTopic.split('/');

    if (args.nameUser !== undefined ) {
       this.logmodule.writelog('info', "received device "+arrTriggerTopic[2]+"  trigger device: "+args.nameDevice.device);
       if (arrTriggerTopic[2] === args.nameDevice.device || args.nameDevice.device == '*') {
          matchTopic = true;
       } else {
          matchTopic = false;
       }
    } else {
       this.logmodule.writelog('debug', "no device match");
       matchTopic = false;
    }
    return matchTopic;
  }

  /**
   * processEventMessage - Generic piece of code used for the geofence cards.
   *
   * @param  {Object} args  Arguments of the Triggercard
   * @param  {Object} state State of the trigger card
   * @return {boolean}       true when the card matches, otherwise false.
   */
  processEventMessage(args,state) {
    if (this.isMatchUser(args, state)) {
      this.logmodule.writelog ('info', "Received Fence = "+state.triggerFence+"  trigger fence = "+args.nameGeofence.fence)
      if ( state.triggerFence == args.nameGeofence.fence || args.nameGeofence.fence == "*" ) {
         this.logmodule.writelog ('info', "triggerFence = equal")
         return true;
      } else {
         return false;
      }
    }
    return false;
  }

  getTrigger() {
    return this.trigger;
  }
}

/**
 * EventTrigger: Specific implementation of the Trigger class. This class
 * implements a generic enter/leave trigger card.
 */
class EventTrigger extends Trigger {

  /**
   * constructor - EventTrigger constructor
   *
   * @param  {type} app reference to the main App instance
   */
  constructor(app) {
    app.logmodule.writelog('debug', "EventTrigger constructor called")
    var Homey = require('homey');
    super(new Homey.FlowCardTrigger('eventOwntracks_AC'), app);
  }

  /**
   * processMessage - EventTrigger specific implementation.
   *
   * @param  {type} args  Arguments of the Triggercard
   * @param  {type} state State of the trigger card
   */
  processMessage(args, state) {
    this.logmodule.writelog('debug', "EventTrigger processMessage called")
    return this.processEventMessage(args,state);
  }

  /**
   * setAutocompleteActions - EventTrigger specific implementation
   *
   */
  setAutocompleteActions() {
    this.logmodule.writelog('debug', "EventTrigger setAutocompleteActions called");

    this.getTrigger().getArgument('nameUser').registerAutocompleteListener( (query, args ) => {
       return Promise.resolve(this.users.searchUsersAutocomplete(query, true) );
    });

    this.getTrigger().getArgument('nameGeofence').registerAutocompleteListener( (query, args ) => {
       return Promise.resolve( this.fences.searchFenceAutocomplete(query, true) );
    });

  }
}

/**
 *
 */
class EnterTrigger extends Trigger {

  /**
   * constructor - EnterTrigger constructor
   *
   * @param  {type} app reference to the main App instance
   */
  constructor(app) {
    app.logmodule.writelog('debug', "EnterTrigger constructor called")
    var Homey = require('homey');
    super(new Homey.FlowCardTrigger('enterGeofence_AC'), app);
  }

  /**
   * processMessage - EnterTrigger specific implementation.
   *
   * @param  {type} args  Arguments of the Triggercard
   * @param  {type} state State of the trigger card
   */
  processMessage(args, state) {
    this.logmodule.writelog('debug', "EnterTrigger processMessage called")
    return this.processEventMessage(args,state);
  }

  /**
   * setAutocompleteActions - EnterTrigger specific implementation
   *
   */
  setAutocompleteActions() {
    this.logmodule.writelog('debug', "EnterTrigger setAutocompleteActions called");

    this.getTrigger().getArgument('nameUser').registerAutocompleteListener( (query, args ) => {
       return Promise.resolve( this.users.searchUsersAutocomplete(query, true) );
    });

    this.getTrigger().getArgument('nameGeofence').registerAutocompleteListener( (query, args ) => {
       return Promise.resolve( this.fences.searchFenceAutocomplete(query, true) );
    });
  }
}



/**
 *
 */
class LeaveTrigger extends Trigger {

  /**
   * constructor - LeaveTrigger constructor
   *
   * @param  {type} app reference to the main App instance
   */
  constructor(app) {
    app.logmodule.writelog('debug', "LeaveTrigger constructor called")
    var Homey = require('homey');
    super(new Homey.FlowCardTrigger('leaveGeofence_AC'), app);
  }

  /**
   * processMessage - LeaveTrigger specific implementation.
   *
   * @param  {type} args  Arguments of the Triggercard
   * @param  {type} state State of the trigger card
   */
  processMessage(args, state) {
    this.logmodule.writelog('debug', "LeaveTrigger processMessage called")
    return this.processEventMessage(args,state);
  }

  /**
   * setAutocompleteActions - LeaveTrigger specific implementation
   *
   */
  setAutocompleteActions() {
    this.logmodule.writelog('debug', "LeaveTrigger setAutocompleteActions called");

    this.getTrigger().getArgument('nameUser').registerAutocompleteListener( (query, args ) => {
       return Promise.resolve( this.users.searchUsersAutocomplete(query, true) );
    });

    this.getTrigger().getArgument('nameGeofence').registerAutocompleteListener( (query, args ) => {
       return Promise.resolve( this.fences.searchFenceAutocomplete(query, true) );
    });
  }
}


/**
 *
 */
class BatteryTrigger extends Trigger {

  /**
   * constructor - BatteryTrigger constructor
   *
   * @param  {type} app reference to the main App instance
   */
  constructor(app) {
    app.logmodule.writelog('debug', "BatteryTrigger constructor called")
    var Homey = require('homey');
    super(new Homey.FlowCardTrigger('eventBattery'), app);
  }

  /**
   * processMessage - BatteryTrigger specific implementation.
   *
   * @param  {type} args  Arguments of the Triggercard
   * @param  {type} state State of the trigger card
   */
  processMessage(args, state) {
    this.logmodule.writelog('debug', "BatteryTrigger processMessage called")
    this.logmodule.writelog('debug', "args: " + JSON.stringify(args));
    if (this.isMatchUser(args, state) && this.isMatchDevice(args, state)) {
      var currentUser = this.users.getUser(state.user);
      var device = currentUser.getDevice(state.device);
      // Check if the battery percentage is below the trigger percentage
      if ( state.percBattery < args.percBattery ) {
         // Check if the trigger has already fired. If so, do not fire again
         //if (currentUser.battTriggered == false) {
         if (!device.isBattTriggered()) {
            this.logmodule.writelog ('info', "battery percentage ("+ device.getBattery() +"%) of "+ state.user+" is below trigger percentage of "+ args.percBattery +"%");
            device.setBattTriggered(true);
            //this.usrs.setUser(currentUser, false);
            return true;
         } else {
            this.logmodule.writelog ('info', "battery trigger already triggered for "+ state.user);
            return false;
         }
      }
      // Check if the battery percentage if above the trigger percentage. If this is the case
      // set the state.Triggered to false in case the phone was been charged again
      if (device.getBattery() >= args.percBattery && device.isBattTriggered()) {
         this.logmodule.writelog ('info', "Reset battery triggered state for "+ state.user);
         device.setBattTriggered(false);
         //currentUser.battTriggered = false;
         //this.users.setUser(currentUser, false);
      }
      return false;
    }
    return false;
  }

  /**
   * setAutocompleteActions - BatteryTrigger specific implementation
   *
   */
  setAutocompleteActions() {
    this.logmodule.writelog('debug', "BatteryTrigger setAutocompleteActions called");

    this.getTrigger().getArgument('nameUser').registerAutocompleteListener(( query, args ) => {
       this.logmodule.writelog('debug', "args for autocomplete: " + JSON.stringify(args));
       return Promise.resolve( this.users.searchUsersAutocomplete(query, true) );
    });

    this.getTrigger().getArgument('nameDevice').registerAutocompleteListener(( query, args ) => {
       this.logmodule.writelog('debug', "args for autocomplete: " + JSON.stringify(args));
       if (args.nameUser.user !== '*') {
         this.logmodule.writelog('debug', "Device autocomplete: normal user " + args.nameUser.user);
         var user = this.users.getUser(args.nameUser.name);
         if (user !== null) {
           return Promise.resolve( user.getDeviceArray().searchDevicesAutocomplete(query, true) );
         }
       } else {
         this.logmodule.writelog('debug', "Device autocomplete (*)? " + args.nameUser.user);
         return Promise.resolve( this.users.searchAllDevicesAutocomplete(query, true) );
       }
    });

  }
}


/**
 * TriggerHandler: Class that handles the construction of the several
 * trigger card types.
 */
class TriggerHandler {

  /**
   * constructor - Constructor of the TriggerHandler class.
   * All the other cards are created here.
   *
   * @param  {type} app Reference to the main application
   */
  constructor(app) {
    app.logmodule.writelog('debug', "TriggerHandler constructor called")
    this.eventTriggerCard = new EventTrigger(app);
    this.enterTriggerCard = new EnterTrigger(app);
    this.leaveTriggerCard = new LeaveTrigger(app);
    this.batteryTriggerCard = new BatteryTrigger(app);
  }

  getEventTriggerCard() {
    return this.eventTriggerCard;
  }

  getEnterTriggerCard() {
    return this.enterTriggerCard;
  }

  getLeaveTriggerCard() {
    return this.leaveTriggerCard;
  }

  getBatteryTriggerCard() {
    return this.batteryTriggerCard;
  }

  getEventOwntracksAC() {
     return this.eventTriggerCard.getTrigger();
  }

  getEnterGeofenceAC() {
     return this.enterTriggerCard.getTrigger();
  }

  getLeaveGeofenceAC() {
     return this.leaveTriggerCard.getTrigger();
  }

  getEventBattery() {
     return this.batteryTriggerCard.getTrigger();
  }
}

module.exports.Trigger = Trigger;
module.exports.EventTrigger = EventTrigger;
module.exports.EnterTrigger = EnterTrigger;
module.exports.LeaveTrigger = LeaveTrigger;
module.exports.BatteryTrigger = BatteryTrigger;
module.exports.TriggerHandler = TriggerHandler;
