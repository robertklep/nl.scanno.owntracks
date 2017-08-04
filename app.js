"use strict";
const Homey = require('homey');

var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");
var httpHandler = require("./httphandler.js");
//var actions   = require("./actions.js");
var triggers  = require("./triggers.js");
//var condition = require("./conditions.js");


class owntracks extends Homey.App {
 
   onInit() {
      this.log('My App is running!');
      globalVar.initVars();
//      triggers.getTriggerArgs().then(function() {
         broker.connectToBroker();
         triggers.listenForMessage()
 //        actions.registerActions();
  //       actions.registerSpeech();
 //        condition.registerConditions();
 //     });
   }  
}

function changedSettings(callback, args) {
   logmodule.writelog("changedSettings called");
   logmodule.writelog(args.body);
   logmodule.writelog("topics:" + globalVar.getTopicArray())

   if ((globalVar.getTopicArray().length > 0) && (broker.getConnectedClient() !== null)) {
      broker.getConnectedClient().unsubscribe("owntracks/#");
      globalVar.clearTopicArray();
   };

   if (broker.getConnectedClient() !== null) {
      broker.getConnectedClient().end(true);
   }

   logmodule.writelog("topics:" + globalVar.getTopicArray());
   broker.clearConnectedClient();
   triggers.getTriggerArgs().then(function() {
      broker.connectToBroker();
   });
   callback(false, null);
}

module.exports = owntracks;
module.exports.changedSettings = changedSettings;
module.exports.getLogLines = logmodule.getLogLines;
module.exports.getUserArray = globalVar.getUserArray;
module.exports.getFenceArray = globalVar.getFenceArray;
module.exports.purgeUserData = globalVar.purgeUserData;
module.exports.addNewUser = globalVar.addNewUser;
module.exports.deleteUser = globalVar.deleteUser;
module.exports.addNewFence = globalVar.addNewFence;
module.exports.deleteFence = globalVar.deleteFence;
module.exports.handleOwntracksEvents = httpHandler.handleOwntracksEvents;

