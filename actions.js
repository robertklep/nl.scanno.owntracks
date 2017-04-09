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
           logmodule.writelog("Speech DETECTED??");
           if( trigger.id == 'owntracks' || trigger.id == 'owntracks2' ) {
              logmodule.writelog(speech.transcript);

              // Search useraray to see if we can match the user in he transcript
              foundUser = globalVar.getUserFromString(speech.transcript);
              if (foundUser !== null) {
                 logmodule.writelog("Found user: " + foundUser.userName);
                 logmodule.writelog("GeoFence: " + foundUser.fence);
                 logmodule.writelog("LocationString: " + getLocationString(foundUser.userName)); 

                 speech.say( getLocationString(foundUser.userName) );
                 callback( null, true );
              } else {
                 logmodule.writelog("No user found");
                 speech.say( getLocationString(null) );
              }
            }
       });

       // to make Homey say something from within a speech event, always use the following to make the speech go to the input source:
       speech.say( __("ok") );
       // or: speech.confirm( __("are_you_sure"), function(){ ... } );

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
         locationString = "De locatie van " + userName + " is "  + globalVar.getUser(userName).fence;
      } else {
         locationString = "Locatie van " + userName + " is onbekend";
      }
      logmodule.writelog(locationString);
   } else {
      if (userName !== null) {
         locationString = "Er zijn geen gegevens van " + userName + " bekend.";
      } else {
         locationString = "Er zijn geen gegevens gevonden";
      }
      logmodule.writelog(locationString);
   }
   return locationString;
}


function homeySayLocation(args) {
   Homey.manager('speech-output').say( getLocationString(args.user), function (err, result ) {
      logmodule.writelog(err);
      logmodule.writelog(result);
   });
}

