"use strict";
const Homey = require('homey');

var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");
var httpHandler = require("./httphandler.js");
var actions   = require("./actions.js");
var triggers  = require("./triggers.js");
var condition = require("./conditions.js");

const DEBUG = true;

class OwntracksApp extends Homey.App {

   /*
      Initialize the Owntracks app. Register all variables,
      Connect to the broker when the broker is used.
      Register triggers, actions and conditions
   */
   onInit() {
      this.log('Owntracks App is running!');
      globalVar.initVars();
      broker.connectToBroker();
      triggers.listenForMessage()
      actions.registerActions();
      actions.registerSpeech();
      condition.registerConditions();
   }

   /*
      getUserArray: Getter for returning the user array to settings.
   */
   getUserArray() {
      return globalVar.getUserArray();
   }

   /*
      getFenceArray: Getter for returning the fence array to settings.
   */
   getFenceArray() {
      return globalVar.getFenceArray();
   }

   getLogLines() {
      return logmodule.getLogLines();
   }

   changedSettings(args) {
      logmodule.writelog("changedSettings called");
      logmodule.writelog(args.body);
      logmodule.writelog("topics:" + globalVar.getTopicArray())

      try {
         if ((globalVar.getTopicArray().length > 0) && (broker.getConnectedClient() !== null)) {
            broker.getConnectedClient().unsubscribe("owntracks/#");
            globalVar.clearTopicArray();
         };

         if (broker.getConnectedClient() !== null) {
            broker.getConnectedClient().end(true);
         }

         logmodule.writelog("topics:" + globalVar.getTopicArray());
         broker.clearConnectedClient();
         broker.connectToBroker();
      } catch (e) {
         logmodule.writelog("changedSettings error: " +e)
         return e;
      }
      return true;
   }

   addNewUser(args) {
      return globalVar.addNewUser(args);
   }

   deleteUser(args) {
      return globalVar.deleteUser(args);
   }

   addNewFence(args) {
      return globalVar.addNewFence(args);
   }

   deleteFence(args) {
      return globalVar.deleteFence(args);
   }
   
   purgeUserData(args) {
      return globalVar.purgeUserData(args);
   }

   handleOwntracksEvents(args) {
      var result = httpHandler.handleOwntracksEvents(args);
      if (DEBUG) logmodule.writelog("handleOwntracksEvents: " + JSON.stringify(result));
      return result;
   }
}

module.exports = OwntracksApp;
