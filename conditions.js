"use strict";

class conditionOwntracks {
   constructor(app) {
      this.Homey = require('homey');
      this.globalVar = app.globalVar;
      this.logmodule = app.logmodule;

      this.inGeofence = null;
      
      this.OnInit();
   }
   
   OnInit() {
      this.registerConditions();
   }
   
   registerConditions() {
      const ref = this;
      ref.logmodule.writelog('debug', "registerConditions called");
   
      ref.inGeofence = new ref.Homey.FlowCardCondition('inGeofence');
      ref.inGeofence.register();
      ref.inGeofence.registerRunListener((args, state ) => {
         ref.logmodule.writelog('info', "inGeofence.registerRunListener called");
         try {
           var result = ref.checkForPresenceInFence( args.geoFence.name );
           return Promise.resolve( result );
         } catch(err) {
            ref.logmodule.writelog('error', "Error in inGeofence.registerRunListener: " + err);
            return Promise.reject(err);
         }
      });

      ref.inGeofence.getArgument('geoFence').registerAutocompleteListener( (query, args ) => { 
         return Promise.resolve(ref.globalVar.searchFenceAutocomplete(query, false) );
      });
   }


   checkForPresenceInFence(geoFence) {
      this.logmodule.writelog('info', "checkForPresenceInFence called");
      if (this.globalVar.searchGeoFence(geoFence) > 0) {
         return true;
      } else {
         return false;
      }
   }
}

module.exports = conditionOwntracks;