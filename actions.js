"use strict";
const Homey = require('homey');

var geocoder  = require("geocoder/node_modules/geocoder"); 
var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");
var broker    = require("./broker.js");

var myItems = [];
var publishOwntracks = null;
var sayLocation = null;

var DEBUG = true;

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

   sayLocation.getArgument('user').registerAutocompleteListener( (query, args ) => { 
      return Promise.resolve(globalVar.searchUsersAutocomplete(query, true) );
   });

}

function registerActions() {
   if (DEBUG) logmodule.writelog("registerActions called");

   publishOwntracks = new Homey.FlowCardAction('publishOwntracks');
   sayLocation = new Homey.FlowCardAction('sayLocation');

   publishOwntracks.register();
   sayLocation.register();

   // Put all the action trigger here for registering them and executing the action
   // Action for sending a message to the broker on the specified topic
   publishOwntracks.registerRunListener((args, state ) => {
      if (DEBUG) logmodule.writelog("Listener publishOwntracks called");
      try {
         broker.sendMessageToTopic(args);
         return Promise.resolve( true );
       } catch(err) {
         logmodule.writelog("Error in Listener publishOwntracks: " +err);
         return Promise.reject(err);
       }
   })

   // Action for speaking out the location of the specified user
   sayLocation.registerRunListener((args, state ) => {
      if (DEBUG) logmodule.writelog("Listener sayLocation called");
      try {
         homeySayLocation(args);
         return Promise.resolve( true );
       } catch(err) {
         logmodule.writelog("Error in Listener sayLocation: " +err);
         return Promise.reject(err);
       }
   })
   createAutocompleteActions();
}

function registerSpeech() {
   if (DEBUG) logmodule.writelog("registerSpeech");

   Homey.ManagerSpeechInput.on('speechEval', function( speech, callback ) {
      if (DEBUG) logmodule.writelog(JSON.stringify(speech));
      
      callback( null, true );
   });

   Homey.ManagerSpeechInput.on('speechMatch', function( speech, onSpeechEvalData ) {
      if (DEBUG) logmodule.writelog("Speech input");

      if (DEBUG) logmodule.writelog(speech.transcript);

      // Search useraray to see if we can match the user in he transcript
      var foundUser = globalVar.getUserFromString(speech.transcript);
      if (foundUser !== null) {
         if (DEBUG) logmodule.writelog("Found user: " + foundUser.userName + "   Fence: " + foundUser.fence);
         return getLocationString(foundUser.userName).then(function(speechline) {
            logmodule.writelog("Speech output: " + speechline);
            speech.say( speechline );
         });
      } else {
         if (DEBUG) logmodule.writelog("No user found");
         return getLocationString(null).then(function(speechline) {
            logmodule.writelog("Speech output: " + speechline);
            speech.say( speechline );
         });
      }
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
      try {
         if ( userName !== null && globalVar.getUser(userName) !== null) {
            if ( globalVar.getUser(userName).fence !== "" ) {
               locationString = Homey.__("location_known", {"name": userName, "location": globalVar.getUser(userName).fence});
               // We have found a user and the user is inside a known geoFence, so fulfill te request
               fulfill(locationString);
            } else {
               // We have a user, but the user is not inside a known geoFence, so we are
               // going to see if we can find an address based on the known coordinates of 
               // the user.
               return getLocationAdress(userName).then(function (foundAddress) {
                  if (DEBUG) logmodule.writelog("getLocationAdress in getString enter");
                  if (foundAddress !== null) {
                     // We hebben een address ontvangen the async call
                     if (DEBUG) logmodule.writelog("foundAddress !== null");
                     logmodule.writelog("geoAdress gevonden: " + foundAddress);
                     locationString = Homey.__("location_known", {"name": userName, "location": foundAddress});
                     fulfill(locationString);
                  } else {
                     // We did not get an address from the async call
                     locationString = Homey.__("location_unkown", {"name": userName});
                     fulfill(locationString);
                  }
                  if (DEBUG) logmodule.writelog("getLocationAdress in getString quit");
               });
            }
         } else {
            if (userName !== null) {
               // This is a fallback when there is a user found, but no data is initialized\
               // This should not really happen
               locationString = Homey.__("location_nodata", {"name": userName});
               fulfill(locationString);
            } else {
               // In this case no user has been found. Most likely due to the fact that the
               // the name was not recognized by the speech recognition.
               locationString= Homey.__("location_nouser");
               fulfill(locationString);
            }
         };
         logmodule.writelog("Locaton string generated: " + locationString);
      } catch(err) {
         logmodule.writelog("Error in getLocationString: " + err);
         reject(err);
      }
   });
}

function getLocationAdress(userName) {
   // Here we make the call to the reverse geo lookup engine.
   // Also just to be sure, we use a Promise to try to get the response before the 
   // speech command is given.
   return new Promise(function (fulfill, reject){
      try {
         var getAddress = null;
         if (DEBUG) logmodule.writelog("getLocationAdress promise enter" );
         geocoder.reverseGeocode( globalVar.getUser(userName).lat, globalVar.getUser(userName).lon, function ( err, data ) {
            // do something with data
            logmodule.writelog("Address data retreived: " + data.results[0].formatted_address);
            getAddress = data.results[0].formatted_address;
            fulfill(getAddress);
         });
      } catch(err) {
         logmodule.writelog("Error in getLocationString: " + err);
         reject(err);
      }
      if (DEBUG) logmodule.writelog("getLocationAdress promise quit" );
   });
   if (DEBUG) logmodule.writelog("getLocationAdress quit");
}

function homeySayLocation(args) {
   return getLocationString(args.user.name).then(function(speechline) {
      logmodule.writelog("Speech output: " + speechline)
      Homey.ManagerSpeechOutput.say(speechline);
   });
}

