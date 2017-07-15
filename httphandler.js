var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var handleMessage = require("./messagehandling.js");

module.exports = {
   handleOwntracksEvents: function(callback, args) {
      handleOwntracksEvents(callback, args);
   }
}

function handleOwntracksEvents(callback, args) {
   logmodule.writelog("handleOwntracksEvents called");
   logmodule.writelog(JSON.stringify(args.query));

   var currentUser = globalVar.getUserByToken(args.query.token);
   if (currentUser == null) {
      logmodule.writelog("Token "+ args.query.token + " is not found");
      return false;
   }
   try {
      if (currentUser.userToken == args.query.token) {
         var dummyTopic = "owntracks/"+currentUser.userName+"/httpendpoint";
         handleMessage.receiveMessage(dummyTopic, JSON.stringify(args.body), null, null);
         logmodule.writelog("User "+ currentUser.userName + " authenticated");
         return true;
       }
    } catch(e) {
       logmodule.writelog("Error: " +e);
       return false;
    }
}