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
//      var myItems=globalVar.searchUsers();
      // filter items to match the search query
       myItems = myItems.filter(function(item){
          return ( item.userName.toLowerCase().indexOf( args.query.toLowerCase() ) > -1 )
      });
//      callback(null, globalVar.searchUsers(args.query));
      callback( null, myItems );
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
                 speech.say( getLocationString(foundUser.userName) );
                 callback( null, true );
              } else {
                 logmodule.writelog("No user found");
                 speech.say( getLocationString(null) );
              }
            }
       });
       // null, true when speech was meant for this app
       // true, null when speech wasn't meant for this app
       callback( true, null );
   });

}

function getLocationString(userName) {
   var locationString = '';
   logmodule.writelog("Create LocationString for user: " + userName);
   if ( userName !== null && globalVar.getUser(userName).fence !== null && globalVar.getUser(userName).fence !== undefined ) {
      if ( globalVar.getUser(userName).fence !== "" ) {
         locationString = __("location_known", {"name": userName, "location": globalVar.getUser(userName).fence});
      } else {
         var foundAdress = null;
//         geocoder.reverseGeocode( globalVar.getUser(userName).lat, globalVar.getUser(userName).lon, function ( err, data ) {
            // do something with data
//            logmodule.writelog(data.results[0].formatted_address);
//            foundAdress = data.results[0].formatted_address;
         getLocationAdress(userName, function(foundAdress) {
            logmodule.writelog("getLocationAdress in getString enter");
            if (foundAdress !== null && foundAdress !== false) {
               logmodule.writelog("geoAdress gevonden: " + foundAdress);
               locationString = __("location_known", {"name": userName, "location": foundAdress});
            } else {
               if (foundAdress !== false) {
                  locationString = __("location_unkown", {"name": userName});
               }
            }
            logmodule.writelog("getLocationAdress in getString quit");
         });
      }
      logmodule.writelog("Locaton string generated: " +locationString);
   } else {
      if (userName !== null) {
         locationString = __("location_nodata", {"name": userName});
      } else {
         locationString= __("location_nouser");
      }
      logmodule.writelog("Locaton string generated: " + locationString);
   }
   return locationString;
}


function getLocationAdress(userName, callback) {
   logmodule.writelog("getLocationAdress enter" );
   var getAdress = null;
   geocoder.reverseGeocode( globalVar.getUser(userName).lat, globalVar.getUser(userName).lon, function ( err, data ) {
      // do something with data
      logmodule.writelog(data.results[0].formatted_address);
      getAdress = data.results[0].formatted_address;
      callback(getAdress);
   });
   callback(false);
   logmodule.writelog("getLocationAdress quit");
}

function homeySayLocation(args) {
   Homey.manager('speech-output').say( getLocationString(args.user), function (err, result ) {
      logmodule.writelog(err);
      logmodule.writelog(result);
   });
}

