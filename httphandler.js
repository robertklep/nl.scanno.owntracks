var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var handleMessage = require("./messagehandling.js");

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
   logmodule.writelog('debug', "handleOwntracksEvents called");
   logmodule.writelog('debug', JSON.stringify(args.query));
   logmodule.writelog('debug', JSON.stringify(args.body));

   var currentUser = globalVar.getUserByToken(args.query.token);
   if (currentUser == null) {
      logmodule.writelog('info', "Token "+ args.query.token + " is not found");
      return false;
   }
   try {
      if (currentUser.userToken == args.query.token) {
         var dummyTopic = "owntracks/"+currentUser.userName+"/httpendpoint";
         handleMessage.receiveMessage(dummyTopic, JSON.stringify(args.body), null, null);
         logmodule.writelog('info', "User "+ currentUser.userName + " authenticated");
//         var result = createOwntracksLocationResponse();
//         logmodule.writelog('debug', "createOwntracksLocationResponse: "+  JSON.stringify(result));
//         return result;	
          return true;
       }
    } catch(err) {
       logmodule.writelog('error', "Error: " +err);
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
      logmodule.writelog('debug', JSON.stringify(userLocationArray));
   } catch(err) {
      logmodule.writelog('error', "createOwntracksLocationResponse: "+ err);
      return err;
   }
   return userLocationArray
}
