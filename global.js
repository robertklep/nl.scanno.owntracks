
var topicArray = [];
var userArray = [];

var logmodule = require("./logmodule.js");

module.exports = {
   setUser: function(userData) {
      setUser(userData);
   },
   getUser: function(userName) {
      return getUser(userName);
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
   searchUsers: function(key) {
//   searchUsers: function() {
      return searchUsers(key);
//      return userArray;
   },
   getUserFromString: function(key) {
      return getUserFromString(key);
   }
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

function searchUsers(key) {
   logmodule.writelog("searchUsers: "+ key);
   var matchUsers = [];
   var temp = [];
   for (i=0; i < userArray.length; i++) {
      if (String(userArray[i].userName).includes(key)) {
        logmodule.writelog("key: " + key + "    userArray: " + userArray[i].userName);
        temp.icon = '//';
        temp.name = userArray[i].userName;
        matchUsers.push(temp);
      }
   }
   logmodule.writelog(matchUsers[0].name);
   return matchUsers;
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


