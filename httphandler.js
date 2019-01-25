
const handleOwntracks = require("./messagehandling.js");

class httpOwntracks {

   constructor(app) {
      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.handleMessage = new handleOwntracks(app);
   }
   /*
      handleOwntracksEvents: Here an incoming http request is handled. The received token is
      looked up. If the token exists, then the request comes from a valid user/owntracks client
      and can be processed further.
      A dummy topic is created so the messagehandling can be the same as the handling of messages
      received from MQTT.
   */
   handleOwntracksEvents(args) {
      this.logmodule.writelog('debug', "handleOwntracksEvents called");
      this.logmodule.writelog('debug', JSON.stringify(args.query));
      this.logmodule.writelog('debug', JSON.stringify(args.body));

      var currentUser = this.globalVar.getUserByToken(args.query.token);
      if (currentUser == null) {
         this.logmodule.writelog('info', "Token "+ args.query.token + " is not found");
         return false;
      }
      try {
         if (currentUser.userToken == args.query.token) {
            var dummyTopic = "owntracks/"+currentUser.userName+"/httpendpoint";
            this.handleMessage.receiveMessage(dummyTopic, JSON.stringify(args.body), null, null);
            this.logmodule.writelog('info', "User "+ currentUser.userName + " authenticated");
//            var result = this.createOwntracksLocationResponse();
//            this.logmodule.writelog('debug', "createOwntracksLocationResponse: "+  JSON.stringify(result));
//            return result;	
             return true;
          }
       } catch(err) {
          this.logmodule.writelog('error', "Error: " +err);
          return err;
       }
   }

   /*
     createOwntracksLocationResponse: Create an array with location JSON strings. This array
     can be used to send the locations of other persons known on this Homey so their TID's are
     displayed as friends in the owntracks phone apps, just like when using MQTT. 
   */
   createOwntracksLocationResponse() {
      var userLocation = {};
      var userLocationArray = [];

      try {
         for (var i=0; i < this.globalVar.getUserArray().length; i++) {
            userLocation._type = "location";
            userLocation.tid = this.globalVar.getUserArray()[i].tid;
            userLocation.lat = this.globalVar.getUserArray()[i].lat;
            userLocation.lon = this.globalVar.getUserArray()[i].lon;
            userLocation.tst = this.globalVar.getUserArray()[i].timestamp;
   
            userLocationArray.push(userLocation);
            userLocation = {};
         }
         this.logmodule.writelog('debug', JSON.stringify(userLocationArray));
      } catch(err) {
         this.logmodule.writelog('error', "createOwntracksLocationResponse: "+ err);
         return err;
      }
      return this.userLocationArray
   }
}

module.exports = httpOwntracks;
