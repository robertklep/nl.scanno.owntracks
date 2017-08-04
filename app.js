"use strict";
const Homey = require('homey');

var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");
var httpHandler = require("./httphandler.js");
var actions   = require("./actions.js");
var triggers  = require("./triggers.js");
var condition = require("./conditions.js");


class OwntracksApp extends Homey.App {
 
   onInit() {
      this.log('My App is running!');
      globalVar.initVars();
//      triggers.getTriggerArgs().then(function() {
         broker.connectToBroker();
         triggers.listenForMessage()
         actions.registerActions();
         actions.registerSpeech();
         condition.registerConditions();
 //     });
   }

   getUserArray() {
      return globalVar.getUserArray();
   }

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
 //        triggers.getTriggerArgs().then(function() {
            broker.connectToBroker();
//         });
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
      return httpHandler.handleOwntracksEvents(args);
   }
}


module.exports = OwntracksApp;
//module.exports.purgeUserData = globalVar.purgeUserData;
//module.exports.addNewUser = globalVar.addNewUser;
//module.exports.deleteUser = globalVar.deleteUser;
//module.exports.addNewFence = globalVar.addNewFence;
//module.exports.deleteFence = globalVar.deleteFence;
//module.exports.handleOwntracksEvents = httpHandler.handleOwntracksEvents;

