
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

