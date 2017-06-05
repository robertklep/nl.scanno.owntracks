var geocoder  = require("geocoder/node_modules/geocoder"); 
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");

var myItems = [];

module.exports = {
   createAutocompleteActions: function() {
      createAutoComplteActions();
   },
   registerActions: function() {
      registerActions();
   },
   registerSpeech: function() {
      registerSpeech();
   }
}

function createAutocompleteActions() {
   logmodule.writelog("createAutocompleteActions called");
   // Put all the autocomplte actions here. 

   Homey.manager('flow').on('action.sayLocation.user.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchUsersAutocomplete(args.query, true));
   });

   Homey.manager('flow').on('condition.inGeofence.geoFence.autocomplete', function (callback, args) {
      logmodule.writelog("autocomplete called");
      callback(null, globalVar.searchFenceAutocomplete(args.query, false));
   });

}

function registerActions() {
   logmodule.writelog("registerActions called");

   createAutocompleteActions();		

   // Put all the action trigger here for registering them and executing the action
   
   // Action for sending a message to the broker on the specified topic
   Homey.manager('flow').on('action.publishOwntracks', function( callback, args ){
      logmodule.writelog("Send flow triggered");
      broker.sendMessageToTopic(args);
      callback( null, true ); // we've fired successfully
   });
   
   // Action for speaking out the location of the specified user
   Homey.manager('flow').on('action.sayLocation', function( callback, args ){
      logmodule.writelog("Say Locaton flow triggered");
      homeySayLocation(args);
      callback( null, true ); // we've fired successfully
   });   
}

function registerSpeech() {
   logmodule.writelog("registerSpeech");
   Homey.manager('speech-input').on('speech', function( speech, callback ) {
      logmodule.writelog("Speech input");

       // loop all triggers
       speech.triggers.forEach(function(trigger) {
           var foundUser = [];
           logmodule.writelog("Speech DETECTED");
           if( trigger.id == 'owntracks' || trigger.id == 'owntracks2' ) {
              logmodule.writelog(speech.transcript);

              // Search useraray to see if we can match the user in he transcript
              foundUser = globalVar.getUserFromString(speech.transcript);
              if (foundUser !== null) {
                 logmodule.writelog("Found user: " + foundUser.userName + "   Fence: " + foundUser.fence);
                 return getLocationString(foundUser.userName).then(function(speechline) {
                    logmodule.writelog("Speech output: " + speechline);
                    speech.say( speechline );
                    callback( null, true );
                 });
              } else {
                 logmodule.writelog("No user found");
                 return getLocationString(null).then(function(speechline) {
                    logmodule.writelog("Speech output: " + speechline);
                    speech.say( speechline );
                    callback( null, true );
                 });
              }
            }
       });
       // null, true when speech was meant for this app
       // true, null when speech wasn't meant for this app
       callback( true, null );
   });

}

function getLocationString(userName) {
   // We need to use a Promise because when the user is not within a known geoFence,
   // we are going to find the address based on coordinates. And this is an asynchronous
   // call and as such we need to wait till this is finished
   return new Promise(function (fulfill, reject){
      var locationString = '';
      logmodule.writelog("Create LocationString for user: " + userName);

      // First lets see if the user is in a kown geoFence before we do an expensive trip to
      // the outside world. We also check if the user is not null. If the user is null, that
      // means that we have not found a user.
      if ( userName !== null && globalVar.getUser(userName) !== null) {
         if ( globalVar.getUser(userName).fence !== "" ) {
            locationString = __("location_known", {"name": userName, "location": globalVar.getUser(userName).fence});
            // We have found a user and the user is inside a known geoFence, so fulfill te request
            fulfill(locationString);
         } else {
            // We have a user, but the user is not inside a known geoFence, so we are
            // going to see if we can find an address based on the known coordinates of 
            // the user.
            return getLocationAdress(userName).then(function (foundAddress) {
               logmodule.writelog("getLocationAdress in getString enter");
               if (foundAddress !== null) {
                  // We hebben een address ontvangen the async call
                  logmodule.writelog("foundAddress !== null");
                  logmodule.writelog("geoAdress gevonden: " + foundAddress);
                  locationString = __("location_known", {"name": userName, "location": foundAddress});
                  fulfill(locationString);
               } else {
                  // We did not get an address from the async call
                  locationString = __("location_unkown", {"name": userName});
                  fulfill(locationString);
               }
               logmodule.writelog("getLocationAdress in getString quit");
            });
         }
      } else {
         if (userName !== null) {
            // This is a fallback when there is a user found, but no data is initialized\
            // This should not really happen
            locationString = __("location_nodata", {"name": userName});
            fulfill(locationString);
         } else {
            // In this case no user has been found. Most likely due to the fact that the
            // the name was not recognized by the speech recognition.
            locationString= __("location_nouser");
            fulfill(locationString);
         }
      };
      logmodule.writelog("Locaton string generated: " + locationString);
   });
}

function getLocationAdress(userName) {
   // Here we make the call to the reverse geo lookup engine.
   // Also just to be sure, we use a Promise to try to get the response before the 
   // speech command is given.
   return new Promise(function (fulfill, reject){
      var getAddress = null;
      logmodule.writelog("getLocationAdress promise enter" );
      geocoder.reverseGeocode( globalVar.getUser(userName).lat, globalVar.getUser(userName).lon, function ( err, data ) {
         // do something with data
         logmodule.writelog("Address data retreived: " + data.results[0].formatted_address);
         getAddress = data.results[0].formatted_address;
         fulfill(getAddress);
      });
      logmodule.writelog("getLocationAdress promise quit" );
   });
   logmodule.writelog("getLocationAdress quit");
}

function homeySayLocation(args) {
   return getLocationString(args.user.name).then(function(speechline) {
      logmodule.writelog("Speech output: " + speechline);
      Homey.manager('speech-output').say(speechline, function (err, result ) {
         logmodule.writelog(err);
         logmodule.writelog(result);
      });
   });
}

