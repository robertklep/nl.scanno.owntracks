"use strict";
const Homey = require('homey');

var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");

var inGeofence = null;

module.exports = {
   registerConditions: function() {
      registerConditions();
   }
}

function registerConditions() {
   logmodule.writelog("registerConditions called");
/*   Homey.manager('flow').on('condition.inGeofence', function( callback, args ){
       var result = checkForPresenceInFence( args.geoFence.name );
       callback( null, result );
   }); */
   
   inGeofence = new Homey.FlowCardCondition('inGeofence');
   inGeofence.register();
   inGeofence.registerRunListener((args, state ) => {
      logmodule.writelog('info', "inGeofence.registerRunListener called");
      try {
        var result = checkForPresenceInFence( args.geoFence.name );
        return Promise.resolve( result );
      } catch(err) {
         logmodule.writelog('error', "Error in inGeofence.registerRunListener: " + err);
         return Promise.reject(err);
      }
   });

   inGeofence.getArgument('geoFence').registerAutocompleteListener( (query, args ) => { 
      return Promise.resolve(globalVar.searchFenceAutocomplete(query, false) );
   });
}


function checkForPresenceInFence(geoFence) {
   logmodule.writelog('info', "checkForPresenceInFence called");
   if (globalVar.searchGeoFence(geoFence) > 0) {
      return true;
   } else {
      return false;
   }
}

