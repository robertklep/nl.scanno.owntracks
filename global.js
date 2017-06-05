
var topicArray = [];
var userArray = [];
var fenceArray = [];

var logmodule = require("./logmodule.js");

module.exports = {
   initVars: function() {
      initVars();
   },
   setUser: function(userData) {
      setUser(userData);
   },
   getUser: function(userName) {
      return getUser(userName);
   },
   setFence: function(fenceData) {
      setFence(fenceData);
   },
   getUserArray: function(callback, args) {
      getUserArray(callback, args);
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

//   deletePresistancyFiles();

   logmodule.writelog("initVars called");

   require('fs').readFile('/userdata/owntracks.json', 'utf8', function (err, data) {
      if (err) {
         logmodule.writelog("Retreiving userArray failed: "+ err);
      } else {
         userArray = JSON.parse(data);
      }
   });
   require('fs').readFile('/userdata/owntracks_fences.json', 'utf8', function (err, data) {
      if (err) {
         logmodule.writelog("Retreiving fenceArray failed: "+ err);
      } else {
         fenceArray = JSON.parse(data);
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
      logmodule.writelog("unload called");
      require('fs').writeFile("/userdata/owntracks.json",  JSON.stringify(userArray), function (err) {
         if (err) {
            logmodule.writelog("Persisting userArray failed: "+ err);
         }
      });
      require('fs').writeFile("/userdata/owntracks_fences.json",  JSON.stringify(fenceArray), function (err) {
         if (err) {
            logmodule.writelog("Persisting fenceArray failed: "+ err);
         }
      });
   });
}

/*
   deletePersistancyFiles() deletes the saved arrays from the filesystem. This
   can be used when the persistency files were borked.
*/
function deletePresistancyFiles() {
   require('fs').unlink('/userdata/owntracks.json',function(err){
      if(err) return logmodule.writelog(err);
      logmodule.writelog('/userdata/owntracks.json deleted successfully');
   });  

   require('fs').unlink('/userdata/owntracks_fences.json',function(err){
      if(err) return logmodule.writelog(err);
      logmodule.writelog('/userdata/owntracks_fences.json deleted successfully');
   });  
}

function getUser(userName) {
   for (var i=0; i < userArray.length; i++) {
      if (userArray[i].userName === userName) {
         return userArray[i];
      }
   }
   // User has not been found, so return null
   return null
}

function setUser(userData) {
   var entryArray = getUser(userData.userName);
   if (entryArray !== null) {
      entryArray = userData;
      
   } else {
      // User has not been found, so assume this is a new user
      userArray.push(userData);
   }
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
      logmodule.writelog("Fence: " + fenceData.fenceName+" changed");   
   } else {
      // Fence has not been found, so assume this is a new fence
      logmodule.writelog("Fence: " + fenceData.fenceName+" Added");
      fenceArray.push(fenceData);
   }
}

function getUserArray(callback, args) {
   logmodule.writelog("getUserArray called");
   callback ( false, userArray);
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
//   logmodule.writelog("searchUsers: "+ key);
   var matchUsers = [];
   var temp = [];

   // If the wildcards argument is set to true, Add an option to select all fences
   if (wildcards == true) {
     matchUsers.push({icon: '//', name: __("ac_all_users"), description: 'Wildcard', user: '*' });
   }

   for (i=0; i < userArray.length; i++) {
      if (String(userArray[i].userName.toLowerCase()).includes(key.toLowerCase())) {
//        logmodule.writelog("key: " + key + "    userArray: " + userArray[i].userName);
        temp.icon = '//';
        temp.name = userArray[i].userName;
        temp.user = userArray[i].userName;
        matchUsers.push({icon: temp.icon, name: temp.name, description: __("desc_all_users"), user: temp.name});
      }
   }
   return matchUsers;
}

function searchFenceAutocomplete(key, wildcards) {
//   logmodule.writelog("searchFence: "+ key);
   var matchFence = [];
   var temp = [];

   // If the wildcards argument is set to true, Add an option to select all fences
   if (wildcards == true) {
     matchFence.push({icon: '//', name: __("ac_all_fences"), fence: '*' });
   }

   for (i=0; i < fenceArray.length; i++) {
      if (String(fenceArray[i].fenceName.toLowerCase()).includes(key.toLowerCase())) {
         if (fenceArray[i].fenceName !== '') {
//            logmodule.writelog("key: " + key + "    fenceArray: " + fenceArray[i].fenceName);
            temp.icon = '//';
            temp.name = fenceArray[i].fenceName;
            temp.fence = fenceArray[i].fenceName;
            matchFence.push({icon: temp.icon, name: temp.name, fence: temp.name});
         }
      }
   }
   return matchFence;
}

function getUserFromString(key) {
   logmodule.writelog("Get the user from string: "+ key);
   var userIndex = -1;
   for (i=0; i < userArray.length; i++) {
      if (String(key).includes(userArray[i].userName)) {
        logmodule.writelog("key: " + key + "    userArray: " + userArray[i].userName);
        userIndex = i;
      }
   }
   if (userIndex == -1) {
      logmodule.writelog("No users found");
      return null;
   } else {
      logmodule.writelog(userArray[userIndex].userName);
      return userArray[userIndex];
   }
}

function searchGeoFence(geoFence) {
   logmodule.writelog("searchGeoFence: "+ geoFence);
   var matchFence = 0;
   for (i=0; i < userArray.length; i++) {
      if (String(userArray[i].fence).includes(geoFence)) {
//        logmodule.writelog("key: " + geoFence + "    userArray: " + userArray[i].fence);
        matchFence++;
      }
   }
   logmodule.writelog("Number of matches: "+ matchFence);
   return matchFence;
}


