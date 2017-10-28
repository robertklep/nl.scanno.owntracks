"use strict";

class globalOwntracks {
   constructor(app) {
      this.topicArray = [];
      this.userArray = [];
      this.fenceArray = [];

      this.Homey     = require("homey");
      this.logmodule = app.logmodule;

      this.OnInit();
   }

   OnInit() {
      this.initVars();
   }

   /*
      initVars() is called as soon as the owntracks app is loaded and it will
      initialise the unload event that will persist the userArray and fenceArray
      It also loads the userArray and fenceArray from file and puts them in the
      array.
   */
   initVars() {
      const ref = this;
      this.saveOnCloseEvent();

      this.logmodule.writelog('debug', "initVars called");

      require('fs').readFile('/userdata/owntracks.json', 'utf8', function (err, data) {
         if (err) {
            ref.logmodule.writelog('error', "Retreiving userArray failed: "+ err);
         } else {
            try {
                ref.userArray = JSON.parse(data);
            } catch (err) {
               ref.logmodule.writelog('error', "Parsing userArray failed: "+ err);
               ref.userArray = [];
            }
         }
      });
      require('fs').readFile('/userdata/owntracks_fences.json', 'utf8', function (err, data) {
         if (err) {
            ref.logmodule.writelog('error', "Retreiving fenceArray failed: "+ err);
         } else {
            try {
               ref.fenceArray = JSON.parse(data);
            } catch(err) {
               ref.logmodule.writelog('error', "Parsing fenceArray failed: "+ err);
               ref.fenceArray = [];
            }
         }
      });
   }

   /*
      saveOnCloseEvent() is called during init and registeres the unload event. The unload
      event is called just before the app is being closes (for instance when the app is updated,
      homey is shutting down, and the current data in userArray and fenceArray are written to
      files on the filesystem.
   */
   saveOnCloseEvent() {
      const ref = this;
      this.Homey.on('unload', function(){
         ref.logmodule.writelog('info', "unload called");
         ref.saveUserData();
         ref.saveFenceData();
      });
   }

   /*
      saveUserData() saves the user data into a JSON file on the filesystem
   */
   saveUserData() {
      const ref = this;
      this.logmodule.writelog('info', "saveUserData called");
      require('fs').writeFile("/userdata/owntracks.json",  JSON.stringify(this.userArray), function (err) {
         if (err) {
            ref.logmodule.writelog('error', "Persisting userArray failed: "+ err);
         }
      });
   }

   /*
      saveFenceData() saves the list of geofences into a JSON file on the filesystem
   */
   saveFenceData() {
      const ref = this;
      this.logmodule.writelog('debug', "saveFenceData called");
      require('fs').writeFile("/userdata/owntracks_fences.json",  JSON.stringify(this.fenceArray), function (err) {
         if (err) {
            ref.logmodule.writelog('error', "Persisting fenceArray failed: "+ err);
         }
      });
   }

   /*
      deletePersistancyFiles() deletes the saved arrays from the filesystem. This
      can be used when the persistency files were borked.
   */
   deletePresistancyFiles() {
      const ref = this;
      var returnValue = false;

      try {
         require('fs').unlinkSync('/userdata/owntracks.json');
      } catch(err) {
            ref.logmodule.writelog('error', err);
            returnValue = true;
      }

      try {
         require('fs').unlinkSync('/userdata/owntracks_fences.json');
      } catch(err) {
         ref.logmodule.writelog('error', err);
         returnValue = true;
      }

      return returnValue;
   }

   /*
      Return the data for the given user
   */
   getUser(userName) {
      for (var i=0; i < this.userArray.length; i++) {
         if (this.userArray[i].userName === userName) {
            return this.userArray[i];
         }
      }
      // User has not been found, so return null
      return null
   }

   /*
      Return the data for the given user by token id
   */
   getUserByToken(userToken) {
      for (var i=0; i < this.userArray.length; i++) {
         if (this.userArray[i].userToken === userToken) {
            return this.userArray[i];
         }
      }
      // User has not been found, so return null
      return null
   }


   /*
      Update the user, or if the user does not exist, add the user
      to the user array
   */
   setUser(userData, persistUser) {
      const ref = this;
      try {
         var entryArray = ref.getUser(userData.userName);

         if (entryArray !== null) {
            entryArray = userData;
         } else {
            // User has not been found, so assume this is a new user
            ref.userArray.push(userData);

            ref.Homey.ManagerNotifications.registerNotification({
               excerpt: ref.Homey.__("notifications.user_added", {"name": userData.userName})
            }, function( err, notification ) {
               if( err ) return console.error( err );
                  console.log( 'Notification added' );
            });
         }
         if (persistUser == true) {
            ref.saveUserData();
         }
      } catch(err) {
         ref.logmodule.writelog('error', "setUser: " +err);
      }
   }

   createEmptyUser(userName, userDevice) {
      try {
         var newUser = {};
         newUser.userName = userName;
         newUser.userToken = require('crypto').randomBytes(16).toString('hex');
         newUser.fence = "";
         newUser.battery = 0;
         newUser.battTriggered = false;
         newUser.userDevice = userDevice;
         return newUser;
      } catch(err) {
         this.logmodule.writelog('error', "createEmptyUser: " +err);
         return null;
      }
   }

   /*
      addNewUser is called from the settings page when a new user is added
      or when the token needs to be refreshed.
   */
   addNewUser(args) {
      const ref = this;
      try {
         ref.logmodule.writelog('debug', "New user called: "+ args.body.userName);
         if (args.body.userName !== null && args.body.userName !== undefined && args.body.userName !== "" ) {
            var currentUser = ref.getUser(args.body.userName);
            if (currentUser == null) {
               var newUser = ref.createEmptyUser(args.body.userName, args.body.userDevice);
               ref.setUser(newUser, true);
               ref.logmodule.writelog('info', "New user added: "+ newUser.userName);
              return true;
            } else {
               currentUser.userToken = require('crypto').randomBytes(16).toString('hex');
               ref.saveUserData();
            }
         }
         return false;
      } catch(err) {
         ref.logmodule.writelog('error', "addNewUser: " +err);
         return err;
      }
   }

   /*
      deleteUser is called from the settings page when a user is deleted
      by pressing the - button
   */
   deleteUser(args) {
      const ref = this;
      try {
         ref.logmodule.writelog('debug', "Delete user called: "+ args.body.userName);
         var result = false;
         for (var i=0; i < ref.userArray.length; i++) {
            if (ref.userArray[i].userName === args.body.userName) {
               var deletedUser = ref.userArray.splice(i, 1);
               ref.logmodule.writelog('info', "Deleted user: " + deletedUser.userName);
               result = true;
            }
         }
         ref.saveUserData();
         return result;
      } catch(err) {
         logmodule.writelog('error', "deleteUser: " +err);
         return err;
      }
   }

   getFence(fenceName) {
      for (var i=0; i < this.fenceArray.length; i++) {
         if (this.fenceArray[i].fenceName === fenceName) {
            return this.fenceArray[i];
         }
      }
      // Fence has not been found, so return null
      return null
   }

   setFence(fenceData) {
      const ref = this;
      var result = true;
      try {
         var entryArray = ref.getFence(fenceData.fenceName);
         if (entryArray !== null) {
            entryArray = fenceData;
            ref.saveFenceData();
            ref.logmodule.writelog('debug', "Fence: " + fenceData.fenceName+" changed");
         } else {
            // Fence has not been found, so assume this is a new fence
            ref.logmodule.writelog('info', "Fence: " + fenceData.fenceName+" Added");
            if (fenceData.fenceName !== undefined) {
               if (fenceData.fenceName.length > 0) {
                  ref.fenceArray.push(fenceData);
                  ref.saveFenceData();
                  ref.Homey.ManagerNotifications.registerNotification({
                     excerpt: ref.Homey.__("notifications.fence_added", {"name": fenceData.fenceName})
                  }, function( err, notification ) {
                     if( err ) return console.error( err );
                        console.log( 'Notification added' );
                  });
               }
            } else {
               result = false;
            }
         }
      } catch(err) {
         ref.logmodule.writelog('error', "setFence: " +err);
         return err;
      }
      return result;
   }

   addNewFence(args) {
      const ref = this;
      try {
         ref.logmodule.writelog('debug', "New fence called: "+ args.body.fenceName);
         if (args.body.fenceName !== null && args.body.fenceName !== undefined && args.body.fenceName !== "" ) {
            if (ref.getFence(args.body.fenceName) == null) {
               var newFence = {};
               newFence.fenceName = args.body.fenceName;
               if (args.body.lon == undefined) newFence.lon = 0;
               if (args.body.lat == undefined) newFence.lat = 0;
               if (args.body.rad == undefined) newFence.rad = 0;
               newFence.timestamp = 0;
               var result = ref.setFence(newFence);
               if (result === true) ref.logmodule.writelog("New fence added: "+ newFence.fenceName);
               return result;
            }
         }
         return false;
      } catch(err) {
         ref.logmodule.writelog('error', "addNewFence: " +err);
         return err;
      }
   }

   deleteFence(args) {
      const ref = this;
      try {
         ref.logmodule.writelog('debug', "Delete fence called: "+ args.body.fenceName);
         var result = false;
         for (var i=0; i < ref.fenceArray.length; i++) {
            if (ref.fenceArray[i].fenceName === args.body.fenceName) {
               var deletedFence = ref.fenceArray.splice(i, 1);
               ref.logmodule.writelog('info', "Deleted fence: " + deletedFence.fenceName);
               result = true;
            }
         }
         ref.saveFenceData();
         return result;
      } catch(err) {
         ref.logmodule.writelog('error', "deleteFence: " +err);
         return err;
      }
   }

   getUserArray() {
      this.logmodule.writelog('debug', "getUserArray called");
      return this.userArray;
   }

   getFenceArray() {
      this.logmodule.writelog('debug', "getFenceArray called");
      return this.fenceArray;
   }

   purgeUserData(args) {
      this.logmodule.writelog('info', "purgeUserData called");

      var returnValue = this.deletePresistancyFiles();
      this.logmodule.writelog('debug', "Return value: "+returnValue);
      this.fenceArray = [];
      this.userArray = [];
      return returnValue;
   }

   getTopic(topicName) {
      for (var i=0; i < this.topicArray.length; i++) {
         if (this.topicArray[i].topicName === topicName) {
            return this.topicArray[i];
         }
      }
      // Topic has not been found, so return null
      return null
   }

   setTopic(topicData) {
      var entryArray = this.getTopic(topicData.topicName);
      if (entryArray !== null) {
         entryArray = topicData;
      } else {
         // Topic has not been found, so assume this is a new user
         this.topicArray.push(topicData);
      }
   }

   clearTopicArray() {
      this.topicArray = [];
   }

   searchUsersAutocomplete(key, wildcards) {
      this.logmodule.writelog('debug', "searchUsers: "+ key);
      var matchUsers = [];
      var temp = [];

      // If the wildcards argument is set to true, Add an option to select all fences
      if (wildcards == true) {
        matchUsers.push({icon: '//', name: this.Homey.__("ac_all_users"), description: 'Wildcard', user: '*' });
      }

      for (var i=0; i < this.userArray.length; i++) {
         try {
            if (String(this.userArray[i].userName.toLowerCase()).includes(key.toLowerCase())) {
              this.logmodule.writelog('debug', "key: " + key + "    userArray: " + this.userArray[i].userName);
              temp.icon = '//';
              temp.name = this.userArray[i].userName;
              temp.user = this.userArray[i].userName;
              matchUsers.push({icon: temp.icon, name: temp.name, description: this.Homey.__("desc_all_users"), user: temp.name});
            }
         } catch(err) {
             this.logmodule.writelog('error', "Fill user autocomplete failed: "+ err);
         }
      }
      return matchUsers;
   }

   searchFenceAutocomplete(key, wildcards) {
      this.logmodule.writelog('debug', "searchFence: "+ key);
      var matchFence = [];
      var temp = [];

      // If the wildcards argument is set to true, Add an option to select all fences
      if (wildcards == true) {
        matchFence.push({icon: '//', name: this.Homey.__("ac_all_fences"), description: 'Wildcard', fence: '*' });
      }

      for (var i=0; i < this.fenceArray.length; i++) {
         try {
            if (String(this.fenceArray[i].fenceName.toLowerCase()).includes(key.toLowerCase())) {
               if (this.fenceArray[i].fenceName !== '') {
                  this.logmodule.writelog('debug', "key: " + key + "    fenceArray: " + this.fenceArray[i].fenceName);
                  temp.icon = '//';
                  temp.name = this.fenceArray[i].fenceName;
                  temp.fence = this.fenceArray[i].fenceName;
                  matchFence.push({icon: temp.icon, name: temp.name, description: this.Homey.__("desc_all_fences"), fence: temp.name});
               }
            }
         } catch(err) {
            this.logmodule.writelog('error', "Fill fence autocomplete failed: "+ err);
         }
      }
      return matchFence;
   }

   getUserFromString(key) {
      this.logmodule.writelog('debug', "Get the user from string: "+ key);
      var userIndex = -1;
      for (var i=0; i < this.userArray.length; i++) {
         if (String(key.toLowerCase()).includes(this.userArray[i].userName.toLowerCase())) {
           this.logmodule.writelog('debug', "key: " + key + "    userArray: " + this.userArray[i].userName);
           userIndex = i;
         }
      }
      if (userIndex == -1) {
         this.logmodule.writelog('info', "No users found");
         return null;
      } else {
         this.logmodule.writelog(this.userArray[userIndex].userName);
         return this.userArray[userIndex];
      }
   }

   searchGeoFence(geoFence) {
      this.logmodule.writelog('debug', "searchGeoFence: "+ geoFence);
      var matchFence = 0;
      for (var i=0; i < this.userArray.length; i++) {
         if (String(this.userArray[i].fence).includes(geoFence)) {
           this.logmodule.writelog('debug', "key: " + geoFence + "    userArray: " + this.userArray[i].fence);
           matchFence++;
         }
      }
      this.logmodule.writelog('info', "Number of matches: "+ matchFence);
      return matchFence;
   }

   getTopicArray() {
      return this.topicArray;
   }
}

module.exports = globalOwntracks;
