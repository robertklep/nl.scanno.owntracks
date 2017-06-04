var globalVar = require("./global.js");
var logmodule = require("./logmodule.js");

module.exports = {
   registerConditions: function() {
      registerConditions();
   }
}

function registerConditions() {
   logmodule.writelog("registerConditions called");
   Homey.manager('flow').on('condition.inGeofence', function( callback, args ){
       var result = checkForPresenceInFence( args.geoFence.name );
       callback( null, result );
   });
}


function checkForPresenceInFence(geoFence) {
   logmodule.writelog("checkForPresenceInFence called");
   if (globalVar.searchGeoFence(geoFence) > 0) {
      return true;
   } else {
      return false;
   }
}

