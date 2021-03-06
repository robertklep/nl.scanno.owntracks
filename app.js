"use strict";

const Homey = require('homey');

var globalOwntracks = require("./global.js");

var brokerOwntracks = require("./broker.js");
var httpOwntracks = require("./httphandler.js");
var actionOwntracks = require("./actions.js");
var triggerOwntracks = require("./triggers.js");
var conditionOwntracks = require("./conditions.js");

class OwntracksApp extends Homey.App {

   /*
      Initialize the Owntracks app. Register all variables,
      Connect to the broker when the broker is used.
      Register triggers, actions and conditions
   */
   onInit() {
      this.log('Owntracks App is running!');
      this.logmodule = require("./logmodule.js");
      this.globalVar = new globalOwntracks(this);
      this.broker    = new brokerOwntracks(this);
      this.triggers  = new triggerOwntracks(this);
      this.actions   = new actionOwntracks(this);
      this.condition = new conditionOwntracks(this);
      this.httpHandler = new httpOwntracks(this);
      this.broker.updateRef(this);
   }

   /*
      getUserArray: Getter for returning the user array to settings.
   */
   getUserArray() {
      return this.globalVar.getUserArray();
   }

   /*
      getFenceArray: Getter for returning the fence array to settings.
   */
   getFenceArray() {
      return this.globalVar.getFenceArray();
   }

   getLogLines() {
      return this.logmodule.getLogLines();
   }

   changedSettings(args) {
      this.logmodule.writelog('info', "changedSettings called");
      this.logmodule.writelog('debug', args.body);
      this.logmodule.writelog('info', "topics:" + this.globalVar.getTopicArray())

      try {
         if ((this.globalVar.getTopicArray().length > 0) && (this.broker.getConnectedClient() !== null)) {
            this.broker.getConnectedClient().unsubscribe("owntracks/#");
            this.globalVar.clearTopicArray();
         };

         if (this.broker.getConnectedClient() !== null) {
            this.broker.getConnectedClient().end(true);
         }

         this.logmodule.writelog('info', "topics:" + this.globalVar.getTopicArray());
         this.broker.clearConnectedClient();
         this.broker.connectToBroker();
      } catch (err) {
         this.logmodule.writelog('error', "changedSettings error: " +err)
         return err;
      }
      return true;
   }

   addNewUser(args) {
      return this.globalVar.addNewUser(args);
   }

   deleteUser(args) {
      return this.globalVar.deleteUser(args);
   }

   addNewFence(args) {
      return this.globalVar.addNewFence(args);
   }

   deleteFence(args) {
      return this.globalVar.deleteFence(args);
   }

   purgeUserData(args) {
      return this.globalVar.purgeUserData(args);
   }

   handleOwntracksEvents(args) {
      var result = this.httpHandler.handleOwntracksEvents(args);
      this.logmodule.writelog('debug', "handleOwntracksEvents: " + JSON.stringify(result));
      return result;
   }

   /*
     uploadFenceData(args) is called from the settings page to push fench data to the
     device of the selected user.
   */
   uploadFenceData(args) {
     try {
       var topic = "owntracks/"+args.body.userName+"/"+args.body.deviceName+"/cmd";
       this.logmodule.writelog('debug',"Start fence data push on "+topic);
       const message = this.broker.handleMessage.createCommandMessage('setWaypoints');
       if( message instanceof Error ) return message;
       this.broker.sendMessageToTopic({"mqttTopic": topic, "mqttMessage": JSON.stringify(message)})
       return true;
     } catch(err) {
       this.logmodule.writelog('info', "uploadFenceData error: "+ err);
       return err;
     }
   }
}

module.exports = OwntracksApp;
