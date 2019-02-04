
const handleOwntracks = require("./messagehandling.js");

class httpOwntracks {

   constructor(app) {
      //this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.users = app.users;

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
      this.logmodule.writelog('debug', JSON.stringify(args));
      //this.logmodule.writelog('debug', JSON.stringify(args.body));

      //var currentUser = this.globalVar.getUserByToken(args.query.token);
      var currentUser = this.users.getUserByToken(args.query.token);
      if (currentUser == null) {
         this.logmodule.writelog('info', "Token "+ args.query.token + " is not found");
         return false;
      }
      try {
         if (currentUser.token == args.query.token) {
           var dummyTopic = null;
            if (args.query.d !== undefined) {
              dummyTopic = "owntracks/"+currentUser.name+"/"+args.query.d;
            } else {
              dummyTopic = "owntracks/"+currentUser.name+"/httpendpoint";
            }
            this.handleMessage.receiveMessage(dummyTopic, JSON.stringify(args.body), null, null);
            this.logmodule.writelog('info', "User "+ currentUser.name + " authenticated");
            var result = this.createOwntracksLocationResponse();
            return result;
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
          for (var i=0; i < this.users.getUserArray().length; i++) {
            for (var j=0; j< this.users.getUserArray()[i].getDevices().length; j++) {
              userLocation._type = "location";
              userLocation.tid = this.users.getUserArray()[i].getDevices()[j].id;
              userLocation.lat = this.users.getUserArray()[i].getDevices()[j].getLocation().lat;
              userLocation.lon = this.users.getUserArray()[i].getDevices()[j].getLocation().lon;
              userLocation.tst = this.users.getUserArray()[i].getDevices()[j].getLocation().timestamp;
              userLocationArray.push(userLocation);
              userLocation = {};
            }
         }
      } catch(err) {
         this.logmodule.writelog('error', "createOwntracksLocationResponse: "+ err);
         return err;
      }
      return userLocationArray
   }
}

module.exports = httpOwntracks;
