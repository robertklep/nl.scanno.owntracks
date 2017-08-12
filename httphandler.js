var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var handleMessage = require("./messagehandling.js");

var DEBUG = true;

module.exports = {
   handleOwntracksEvents: function(args) {
      return handleOwntracksEvents(args);
   }
}

/*
   handleOwntracksEvents: Here an incoming http request is handled. The received token is
   looked up. If the token exists, then the request comes from a valid user/owntracks client
   and can be processed further.
   A dummy topic is created so the messagehandling can be the same as the handling of messages
   received from MQTT.
*/
function handleOwntracksEvents(args) {
   if (DEBUG) logmodule.writelog("handleOwntracksEvents called");
   if (DEBUG) logmodule.writelog(JSON.stringify(args.query));
   if (DEBUG) logmodule.writelog(JSON.stringify(args.body));

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
         var result = createOwntracksLocationResponse();
         if (DEBUG) logmodule.writelog("createOwntracksLocationResponse: "+ result);
         return result;	
       }
    } catch(err) {
       logmodule.writelog("Error: " +err);
       return err;
    }
}

/*
  createOwntracksLocationResponse: Create an array with location JSON strings. This array
  can be used to send the locations of other persons known on this Homey so their TID's are
  displayed as friends in the owntracks phone apps, just like when using MQTT. 
*/
function createOwntracksLocationResponse() {
   var userLocation = {};
   var userLocationArray = [];

   try {
      for (var i=0; i < globalVar.getUserArray().length; i++) {
         userLocation._type = "location";
         userLocation.tid = globalVar.getUserArray()[i].tid;
         userLocation.lat = globalVar.getUserArray()[i].lat;
         userLocation.lon = globalVar.getUserArray()[i].lon;
         userLocation.tst = globalVar.getUserArray()[i].timestamp;

         userLocationArray.push(userLocation);
         userLocation = {};
      }
      if (DEBUG) logmodule.writelog(JSON.stringify(userLocationArray));
   } catch(err) {
      logmodule.writelog("createOwntracksLocationResponse: "+ err);
      return err;
   }
   return userLocationArray
}
