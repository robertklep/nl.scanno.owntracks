
const handleOwntracks = require("./messagehandling.js");
const Homey = require('homey');
//const {ManagerCloud} = require('homey');

class httpOwntracks {

   constructor(app) {
      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.handleMessage = new handleOwntracks(app);
      this.myWebhook = null;
      this.id = '5c487bd3d25fcd0e0e2b9421';
      this.secret = '852b3ab49b09a11c898fd1539cd29661'
      this.cloudId=null;
      this.data = {id:'abcdef'};
      this.onInit();
   }

   onInit() {
     const ref=this;
     Homey.ManagerCloud.getHomeyId(function(err, cloudId) {
       ref.cloudId = cloudId;
       ref.logmodule.writelog('debug', 'Cloud-id: '+ ref.cloudId);
       ref.data = {id: ref.cloudId};
       ref.myWebhook = new Homey.CloudWebhook( ref.id, ref.secret, ref.data );
       ref.myWebhook.on('message', args => {
         ref.logmodule.writelog('debug','Got a webhook message!');
         ref.logmodule.writelog('debug','headers:'+ JSON.stringify(args.headers));
         ref.logmodule.writelog('debug','query:'+ JSON.stringify(args.query));
         ref.logmodule.writelog('debug','body:'+ JSON.stringify(args.body));

         args.body=ref.handleOwntracksEvents(args);
       })
       .register()
       .then(() => {
         ref.logmodule.writelog('debug','Webhook registered!');
       })
       .catch( ref.error )

     });

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
            var result = this.createOwntracksLocationResponse();
            this.logmodule.writelog('debug', "createOwntracksLocationResponse: "+  JSON.stringify(result));
            return result;
//             return true;
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
      return userLocationArray;
   }
}

module.exports = httpOwntracks;
