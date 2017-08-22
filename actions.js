"use strict";

class actionOwntracks {
   constructor(app) {
      this.myItems = [];
      this.publishOwntracks = null;
      this.sayLocation = null;
      this.Homey = require('homey');
      this.geocoder  = require("geocoder/node_modules/geocoder"); 
      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;
      this.broker    = app.broker;
      
      this.OnInit();
   }

   OnInit() {
      this.registerActions();
      this.registerSpeech();
   }
      
   createAutocompleteActions() {
      const ref = this;
      this.logmodule.writelog('info', "createAutocompleteActions called");
      // Put all the autocomplte actions here. 

      this.sayLocation.getArgument('user').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve(ref.globalVar.searchUsersAutocomplete(query, true) );
      });
   }

   registerActions() {
      const ref = this;
      this.logmodule.writelog('debug', "registerActions called");

      this.publishOwntracks = new this.Homey.FlowCardAction('publishOwntracks');
      this.sayLocation = new this.Homey.FlowCardAction('sayLocation');

      this.publishOwntracks.register();
      this.sayLocation.register();

      // Put all the action trigger here for registering them and executing the action
      // Action for sending a message to the broker on the specified topic
      this.publishOwntracks.registerRunListener((args, state ) => {
         ref.logmodule.writelog('debug', "Listener publishOwntracks called");
         try {
            ref.broker.sendMessageToTopic(args);
            return Promise.resolve( true );
          } catch(err) {
            ref.logmodule.writelog('error', "Error in Listener publishOwntracks: " +err);
            return Promise.reject(err);
          }
      })

      // Action for speaking out the location of the specified user
      this.sayLocation.registerRunListener((args, state ) => {
         ref.logmodule.writelog('debug', "Listener sayLocation called");
         try {
            ref.homeySayLocation(args);
            return Promise.resolve( true );
         } catch(err) {
            ref.logmodule.writelog('error', "Error in Listener sayLocation: " +err);
            return Promise.reject(err);
          }
      })
      this.createAutocompleteActions();
   }

   registerSpeech() {
      const ref = this;
      this.logmodule.writelog('debug', "registerSpeech");

      this.Homey.ManagerSpeechInput.on('speechEval', function( speech, callback ) {
         ref.logmodule.writelog('debug', JSON.stringify(speech));
         callback( null, true );
      });
      this.Homey.ManagerSpeechInput.on('speechMatch', function( speech, onSpeechEvalData ) {
         ref.logmodule.writelog('debug', "Speech input");
         ref.logmodule.writelog('debug', speech.transcript);

         // Search useraray to see if we can match the user in he transcript
         var foundUser = ref.globalVar.getUserFromString(speech.transcript);
         if (foundUser !== null) {
            ref.logmodule.writelog('debug', "Found user: " + foundUser.userName + "   Fence: " + foundUser.fence);
            return ref.getLocationString(foundUser.userName).then(function(speechline) {
               ref.logmodule.writelog('info', "Speech output: " + speechline);
               speech.say( speechline );
            });
         } else {
            ref.logmodule.writelog('debug', "No user found");
            return ref.getLocationString(null).then(function(speechline) {
               ref.logmodule.writelog("Speech output: " + speechline);
               speech.say( speechline );
            });
         }
      });
   }

   getLocationString(userName) {
      const ref = this;
      // We need to use a Promise because when the user is not within a known geoFence,
      // we are going to find the address based on coordinates. And this is an asynchronous
      // call and as such we need to wait till this is finished
      return new Promise(function (fulfill, reject){
         var locationString = '';
         ref.logmodule.writelog('info', "Create LocationString for user: " + userName);

         // First lets see if the user is in a kown geoFence before we do an expensive trip to
         // the outside world. We also check if the user is not null. If the user is null, that
         // means that we have not found a user.
         try {
            if ( userName !== null && ref.globalVar.getUser(userName) !== null) {
               if (ref.globalVar.getUser(userName).fence !== "" ) {
                  locationString = ref.Homey.__("location_known", {"name": userName, "location": ref.globalVar.getUser(userName).fence});
                  // We have found a user and the user is inside a known geoFence, so fulfill te request
                  fulfill(locationString);
               } else {
                  // We have a user, but the user is not inside a known geoFence, so we are
                  // going to see if we can find an address based on the known coordinates of 
                  // the user.
                  return ref.getLocationAdress(userName).then(function (foundAddress) {
                     ref.logmodule.writelog('debug', "getLocationAdress in getString enter");
                     if (foundAddress !== null) {
                        // We hebben een address ontvangen the async call
                        ref.logmodule.writelog('debug', "foundAddress !== null");
                        ref.logmodule.writelog('info', "geoAdress gevonden: " + foundAddress);
                        locationString = ref.Homey.__("location_known", {"name": userName, "location": foundAddress});
                        fulfill(locationString);
                     } else {
                        // We did not get an address from the async call
                        locationString = ref.Homey.__("location_unkown", {"name": userName});
                        fulfill(locationString);
                     }
                     ref.logmodule.writelog('debug', "getLocationAdress in getString quit");
                  });
               }
            } else {
               if (userName !== null) {
                  // This is a fallback when there is a user found, but no data is initialized\
                  // This should not really happen
                  locationString = ref.Homey.__("location_nodata", {"name": userName});
                  fulfill(locationString);
               } else {
                  // In this case no user has been found. Most likely due to the fact that the
                  // the name was not recognized by the speech recognition.
                  locationString= ref.Homey.__("location_nouser");
                  fulfill(locationString);
               }
            };
            ref.logmodule.writelog('info', "Locaton string generated: " + locationString);
         } catch(err) {
            ref.logmodule.writelog('error', "Error in getLocationString: " + err);
            reject(err);
         }
      });
   }

   getLocationAdress(userName) {
      // Here we make the call to the reverse geo lookup engine.
      // Also just to be sure, we use a Promise to try to get the response before the 
      // speech command is given.
      const ref = this;
      return new Promise(function (fulfill, reject){
         try {
            var getAddress = null;
            ref.logmodule.writelog('debug', "getLocationAdress promise enter" );
            ref.geocoder.reverseGeocode( ref.globalVar.getUser(userName).lat, ref.globalVar.getUser(userName).lon, function ( err, data ) {
               // do something with data
               ref.logmodule.writelog('info', "Address data retreived: " + data.results[0].formatted_address);
               getAddress = data.results[0].formatted_address;
               fulfill(getAddress);
            });
         } catch(err) {
            ref.logmodule.writelog('error', "Error in getLocationString: " + err);
            reject(err);
         }
         ref.logmodule.writelog('debug', "getLocationAdress promise quit" );
      });
      ref.logmodule.writelog('debug', "getLocationAdress quit");
   }

   homeySayLocation(args) {
      const ref = this;
      return this.getLocationString(args.user.name).then(function(speechline) {
         ref.logmodule.writelog('info', "Speech output: " + speechline)
         ref.Homey.ManagerSpeechOutput.say(speechline);
      });
   }
}

module.exports = actionOwntracks;