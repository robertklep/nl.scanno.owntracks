
var topicArray = [];
var userArray = [];
var fenceArray = [];

const Homey     = require("homey");
const logmodule = require("./logmodule.js");

module.exports = {
   initVars: function() {
      initVars();
   },
   setUser: function(userData, persistUser) {
      setUser(userData, persistUser);
   },
   getUser: function(userName) {
      return getUser(userName);
   },
   getUserByToken: function(userToken) {
      return getUserByToken(userToken);
   },
   createEmptyUser: function(userName) {
      return createEmptyUser(userName);
   },
   addNewUser: function(args) {
      return addNewUser(args);
   },
   deleteUser: function(args) {
      return deleteUser(args);
   },
   setFence: function(fenceData) {
      setFence(fenceData);
   },
   addNewFence: function(args) {
      return addNewFence(args);
   },
   deleteFence: function(args) {
      return deleteFence(args);
   },
   getUserArray: function() {
      return getUserArray();
   },
   getFenceArray: function() {
      return getFenceArray();
   },
   purgeUserData: function(args) {
      return purgeUserData(args);
   },
   getTopic: function(topicName) {
      return getTopic(topicName);
   },
   setTopic: function(topicData) {
      setTopic(topicData);
   },
   getTopicArray: function() {
      return topicArray;
   },
   clearTopicArray: function() {
      clearTopicArray();
   },
   searchUsersAutocomplete: function(key, wildcards) {
      return searchUsersAutocomplete(key, wildcards);
   },
   searchFenceAutocomplete: function(key, wildcards) {
      return searchFenceAutocomplete(key, wildcards);
   },
   getUserFromString: function(key) {
      return getUserFromString(key);
   },
   searchGeoFence: function(geoFence) {
      return searchGeoFence(geoFence);
   }
}

/*
   initVars() is called as soon as the owntracks app is loaded and it will
   initialise the unload event that will persist the userArray and fenceArray
   It also loads the userArray and fenceArray from file and puts them in the 
   array.
*/
function initVars() {
   saveOnCloseEvent();

   logmodule.writelog('debug', "initVars called");

   require('fs').readFile('/userdata/owntracks.json', 'utf8', function (err, data) {
      if (err) {
         logmodule.writelog('error', "Retreiving userArray failed: "+ err);
      } else {
         try { 
             userArray = JSON.parse(data);
         } catch (e) {
            logmodule.writelog('error', "Parsing userArray failed: "+ e);
            userArray = [];
         }
      }
   });
   require('fs').readFile('/userdata/owntracks_fences.json', 'utf8', function (err, data) {
      if (err) {
         logmodule.writelog('error', "Retreiving fenceArray failed: "+ err);
      } else {
         try {
            fenceArray = JSON.parse(data);
         } catch(e) {
            logmodule.writelog('error', "Parsing fenceArray failed: "+ e);
            fenceArray = [];
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
function saveOnCloseEvent() {
   Homey.on('unload', function(){
      logmodule.writelog('info', "unload called");
      saveUserData();
      saveFenceData();
   });
}

/*
   saveUserData() saves the user data into a JSON file on the filesystem
*/
function saveUserData() {
   logmodule.writelog('info', "saveUserData called");
   require('fs').writeFile("/userdata/owntracks.json",  JSON.stringify(userArray), function (err) {
      if (err) {
         logmodule.writelog('error', "Persisting userArray failed: "+ err);
      }
   });
}

/*
   saveFenceData() saves the list of geofences into a JSON file on the filesystem
*/
function saveFenceData() {
   logmodule.writelog('debug', "saveFenceData called");
   require('fs').writeFile("/userdata/owntracks_fences.json",  JSON.stringify(fenceArray), function (err) {
      if (err) {
         logmodule.writelog('error', "Persisting fenceArray failed: "+ err);
      }
   });
}

/*
   deletePersistancyFiles() deletes the saved arrays from the filesystem. This
   can be used when the persistency files were borked.
*/
function deletePresistancyFiles() {
   var returnValue = false;

   try {
      require('fs').unlinkSync('/userdata/owntracks.json');
   } catch(err) {
         logmodule.writelog('error', err);
         returnValue = true;
   }

   try {
      require('fs').unlinkSync('/userdata/owntracks_fences.json');
   } catch(err) {
         logmodule.writelog('error', err);
         returnValue = true;
   }

   return returnValue; 
}

/*
   Return the data for the given user
*/
function getUser(userName) {
   for (var i=0; i < userArray.length; i++) {
      if (userArray[i].userName === userName) {
         return userArray[i];
      }
   }
   // User has not been found, so return null
   return null
}

/*
   Return the data for the given user by token id
*/
function getUserByToken(userToken) {
   for (var i=0; i < userArray.length; i++) {
      if (userArray[i].userToken === userToken) {
         return userArray[i];
      }
   }
   // User has not been found, so return null
   return null
}


/*
   Update the user, or if the user does not exist, add the user
   to the user array
*/
function setUser(userData, persistUser) {
   var entryArray = getUser(userData.userName);
   
   if (entryArray !== null) {
      entryArray = userData;
   } else {
      // User has not been found, so assume this is a new user
      userArray.push(userData);

      Homey.ManagerNotifications.registerNotification({
         excerpt: Homey.__("notifications.user_added", {"name": userData.userName})
      }, function( err, notification ) {
         if( err ) return console.error( err );
            console.log( 'Notification added' );
      });
   }
   if (persistUser == true) {
      saveUserData();
   }
}

function createEmptyUser(userName) {
   var newUser = {};
   newUser.userName = userName;
   newUser.userToken = require('crypto').randomBytes(16).toString('hex');
   newUser.fence = "";
   newUser.battery = 0;
   newUser.battTriggered = false;
   return newUser;
}

/*
   addNewUser is called from the settings page when a new user is added
   or when the token needs to be refreshed.
*/
function addNewUser(args) {
   logmodule.writelog('debug', "New user called: "+ args.body.userName);
   if (args.body.userName !== null && args.body.userName !== undefined && args.body.userName !== "" ) {
      var currentUser = getUser(args.body.userName);
      if (currentUser == null) {
         var newUser = createEmptyUser(args.body.userName);
         setUser(newUser, true);
         logmodule.writelog('info', "New user added: "+ newUser.userName);
        return true;
      } else {
         currentUser.userToken = require('crypto').randomBytes(16).toString('hex');
         saveUserData();
      }
   }
   return false;
}

function deleteUser(args) {
   logmodule.writelog('debug', "Delete user called: "+ args.body.userName);
   var result = false;
   for (var i=0; i < userArray.length; i++) {
      if (userArray[i].userName === args.body.userName) {
         var deletedUser = userArray.splice(i, 1);
         logmodule.writelog('info', "Deleted user: " + deletedUser.userName);
         result = true;
      }
   }
   saveUserData();
   return result;
}

function getFence(fenceName) {
   for (var i=0; i < fenceArray.length; i++) {
      if (fenceArray[i].fenceName === fenceName) {
         return fenceArray[i];
      }
   }
   // Fence has not been found, so return null
   return null
}

function setFence(fenceData) {
   var entryArray = getFence(fenceData.fenceName);
   if (entryArray !== null) {
      entryArray = fenceData;
      saveFenceData();
      logmodule.writelog('debug', "Fence: " + fenceData.fenceName+" changed");   
   } else {
      // Fence has not been found, so assume this is a new fence
      logmodule.writelog('info', "Fence: " + fenceData.fenceName+" Added");
      
      if (fenceData.fenceName.length > 0) {
         fenceArray.push(fenceData);
         saveFenceData();
         Homey.ManagerNotifications.registerNotification({
            excerpt: Homey.__("notifications.fence_added", {"name": fenceData.fenceName})
         }, function( err, notification ) {
            if( err ) return console.error( err );
               console.log( 'Notification added' );
         });
      }
   }
}

function addNewFence(args) {
   logmodule.writelog('debug', "New fence called: "+ args.body.fenceName);
   if (args.body.fenceName !== null && args.body.fenceName !== undefined && args.body.fenceName !== "" ) { 
      if (getFence(args.body.fenceName) == null) {
         var newFence = {};
         newFence.fenceName = args.body.fenceName;
         newFence.timestamp = 0;
         setFence(newFence);
         logmodule.writelog("New fence added: "+ newFence.fenceName);
         return true;
      }
   }
   return false;
}

function deleteFence(args) {
   logmodule.writelog('debug', "Delete fence called: "+ args.body.fenceName);
   var result = false;
   for (var i=0; i < fenceArray.length; i++) {
      if (fenceArray[i].fenceName === args.body.fenceName) {
         var deletedFence = fenceArray.splice(i, 1);
         logmodule.writelog('info', "Deleted fence: " + deletedFence.fenceName);
         result = true;
      }
   }
   saveFenceData();
   return result;
}

function getUserArray() {
   logmodule.writelog('debug', "getUserArray called");
   return userArray;
}

function getFenceArray() {
   logmodule.writelog('debug', "getFenceArray called");
   return fenceArray;
}

function purgeUserData(args) {
   logmodule.writelog('info', "purgeUserData called");

   var returnValue = deletePresistancyFiles();
   logmodule.writelog('debug', "Return value: "+returnValue);
   fenceArray = [];
   userArray = [];
   return returnValue;
}

function getTopic(topicName) {
   for (var i=0; i < topicArray.length; i++) {
      if (topicArray[i].topicName === topicName) {
         return topicArray[i];
      }
   }
   // User has not been found, so return null
   return null
}

function setTopic(topicData) {
   var entryArray = getTopic(topicData.topicName);
   if (entryArray !== null) {
      entryArray = topicData;
      
   } else {
      // User has not been found, so assume this is a new user
      topicArray.push(topicData);
   }
}

function clearTopicArray() {
   topicArray = [];
}

function searchUsersAutocomplete(key, wildcards) {
   logmodule.writelog('debug', "searchUsers: "+ key);
   var matchUsers = [];
   var temp = [];

   // If the wildcards argument is set to true, Add an option to select all fences
   if (wildcards == true) {
     matchUsers.push({icon: '//', name: Homey.__("ac_all_users"), description: 'Wildcard', user: '*' });
   }

   for (i=0; i < userArray.length; i++) {
      try {
         if (String(userArray[i].userName.toLowerCase()).includes(key.toLowerCase())) {
           logmodule.writelog('debug', "key: " + key + "    userArray: " + userArray[i].userName);
           temp.icon = '//';
           temp.name = userArray[i].userName;
           temp.user = userArray[i].userName;
           matchUsers.push({icon: temp.icon, name: temp.name, description: Homey.__("desc_all_users"), user: temp.name});
         }
      } catch(e) {
          logmodule.writelog('error', "Fill user autocomplete failed: "+ e);
      }
   }
   return matchUsers;
}

function searchFenceAutocomplete(key, wildcards) {
   logmodule.writelog('debug', "searchFence: "+ key);
   var matchFence = [];
   var temp = [];

   // If the wildcards argument is set to true, Add an option to select all fences
   if (wildcards == true) {
     matchFence.push({icon: '//', name: Homey.__("ac_all_fences"), description: 'Wildcard', fence: '*' });
   }

   for (i=0; i < fenceArray.length; i++) {
      try {
         if (String(fenceArray[i].fenceName.toLowerCase()).includes(key.toLowerCase())) {
            if (fenceArray[i].fenceName !== '') {
               logmodule.writelog('debug', "key: " + key + "    fenceArray: " + fenceArray[i].fenceName);
               temp.icon = '//';
               temp.name = fenceArray[i].fenceName;
               temp.fence = fenceArray[i].fenceName;
               matchFence.push({icon: temp.icon, name: temp.name, description: Homey.__("desc_all_fences"), fence: temp.name});
            }
         }
      } catch(e) {
         logmodule.writelog('error', "Fill fence autocomplete failed: "+ e);
      }
   }
   return matchFence;
}

function getUserFromString(key) {
   logmodule.writelog('debug', "Get the user from string: "+ key);
   var userIndex = -1;
   for (i=0; i < userArray.length; i++) {
      if (String(key).includes(userArray[i].userName)) {
        logmodule.writelog('debug', "key: " + key + "    userArray: " + userArray[i].userName);
        userIndex = i;
      }
   }
   if (userIndex == -1) {
      logmodule.writelog('info', "No users found");
      return null;
   } else {
      logmodule.writelog(userArray[userIndex].userName);
      return userArray[userIndex];
   }
}

function searchGeoFence(geoFence) {
   logmodule.writelog('debug', "searchGeoFence: "+ geoFence);
   var matchFence = 0;
   for (i=0; i < userArray.length; i++) {
      if (String(userArray[i].fence).includes(geoFence)) {
        logmodule.writelog('debug', "key: " + geoFence + "    userArray: " + userArray[i].fence);
        matchFence++;
      }
   }
   logmodule.writelog('info', "Number of matches: "+ matchFence);
   return matchFence;
}


