"use strict";
const Homey = require('homey');
const DeviceArray = require("./Device.js");

class User {
  constructor(name) {
    this.name = name;
    this.token = undefined;
    this.devices = new DeviceArray();
    this.inregions = false;
    this.httpuser = false;
    this.pushrequest = false;
    this.logmodule = require('./logmodule.js');
  }

  getName() {
    return this.name;
  }

  getToken() {
    return this.token;
  }

  getJSON() {
    return {
      name: this.name,
      token: this.token,
      devices: this.devices.getJSON(),
      battTriggered: this.battTriggered,
      inregions: this.inregions,
      httpuser: this.httpuser,
      pushrequest: this.pushrequest
    }
  }

  getDevices() {
    //this.logmodule.writelog('debug', "getDevices(): " + JSON.stringify(this.devices));
    return this.devices.getDevices();
  }

  getDevice(name) {
    return this.devices.getDevice(name);
  }

  getDeviceArray() {
    return this.devices;
  }

  isHTTPUser() {
    return this.httpuser;
  }

  setUser() {

  }

  addDevice(name, id) {
    return this.devices.addDevice(name, id);
  }

  generateToken() {
    this.token = require('crypto').randomBytes(16).toString('hex');
  }

  hasDeviceInFence(fence) {
    for (var i=0; i<this.devices; i++) {
      if (devices[i].getLocation().fence === fence) {
        return true;
      }
    }
    return false;
  }

  parseJSON(object) {
    try {
      this.name = object.name;
      this.location.parseJSON(object.location);
    } catch(err) {
      // parsing of object failed
    }

  }
}

class UserArray {
  constructor() {
    this.users = [];
    this.logmodule = require('./logmodule.js');

    this.initUserDataOld();
  }

  addUser(name, device, id) {
    const ref = this;

    if (this.getUser(name) == null) {
      let user = new User(name);
      if (device !== undefined) {
        user.addDevice(device, id);
      }
      user.generateToken();
      this.users.push(user);

      Homey.ManagerNotifications.registerNotification({
         excerpt: Homey.__("notifications.user_added", {"name": user.name})
      }, function( err, notification ) {
         if( err ) return console.error( err );
            console.log( 'Notification added' );
      });
      return user;
    }
    return null;
  }

  getUser(name) {
    for (var i=0; i<this.users.length; i++) {
      if (name === this.users[i].getName()) {
        return this.users[i];
      }
    }
    return null;
  }

  getUserByToken(token) {
    for (var i=0; i<this.users.length; i++) {
      if (token === this.users[i].getToken()) {
        return this.users[i];
      }
    }
    return null;
  }

  deleteUser(name) {
    var result = false;
    try {
      for (var i=0; i<this.users.length; i++) {
        if (name === this.users[i].getName()) {
          var user = this.users[i].getJSON();
          var deletedUser = this.users.splice(i, 1);
          this.logmodule.writelog('info', "Deleted user: " + user.name);
          result = true;
          // persist user data
        }
      }
    } catch (err) {
      this.logmodule.writelog('error', "deleteUser: " +err);
      return err;
    }
    return result;
  }

  getJSON() {
    var values = [];
    for (var i=0; i < this.users.length; i++) {
      values.push(this.users[i].getJSON());
    }
    return JSON.parse(JSON.stringify(values));
  }

  parseJSON(object) {

  }

  searchUsersAutocomplete(key, wildcards) {
     //this.logmodule.writelog('debug', "searchUsers: "+ key);
     var matchUsers = [];
     var temp = [];

     // If the wildcards argument is set to true, Add an option to select all fences
     if (wildcards == true) {
       matchUsers.push({icon: '//', name: Homey.__("ac_all_users"), description: 'Wildcard', user: '*' });
     }

     for (var i=0; i < this.users.length; i++) {
        try {
           if (String(this.users[i].name.toLowerCase()).includes(key.toLowerCase())) {
             this.logmodule.writelog('debug', "key: " + key + "    userArray: " + this.users[i].name);
             temp.icon = '//';
             temp.name = this.users[i].name;
             matchUsers.push({icon: temp.icon, name: temp.name, description: Homey.__("desc_all_users"), user: temp.name});
           }
        } catch(err) {
            this.logmodule.writelog('error', "Fill user autocomplete failed: "+ err);
        }
     }
     return matchUsers;
  }

  getUserFromString(key) {
     this.logmodule.writelog('debug', "Get the user from string: "+ key);
     var userIndex = -1;
     for (var i=0; i < this.users.length; i++) {
        if (String(key.toLowerCase()).includes(this.users[i].name.toLowerCase())) {
          this.logmodule.writelog('debug', "key: " + key + "    userArray: " + this.users[i].name);
          userIndex = i;
        }
     }
     if (userIndex == -1) {
        this.logmodule.writelog('info', "No users found");
        return null;
     } else {
        this.logmodule.writelog(this.users[userIndex].name);
        return this.users[userIndex];
     }
  }

  checkForPresenceInFence(fence) {
    var presence = 0;
    for (var i=0; i<this.users.length; i++) {
      if (this.users[i].hasDeviceInFence(fence)) {
        presence++;
      }
    }
    return presence;
  }

  initUserDataOld() {
    const ref = this;
    require('fs').readFile('/userdata/owntracks.json', 'utf8', function (err, data) {
       if (err) {
          ref.logmodule.writelog('error', "Retreiving userArray failed: "+ err);
       } else {
          try {
              var userArray = JSON.parse(data);
              for (var i=0; i<userArray.length; i++) {
                var user = new User(userArray[i].userName);
                user.token = userArray[i].userToken;
                user.inregions = userArray[i].inregionsSupported;
//                user.battery = userArray[i].battery;
                //user.battTriggered = userArray[i].battTriggered;
                user.addDevice(userArray[i].userDevice, userArray[i].tid);
                var device = user.getDevice(userArray[i].userDevice);
                if (device !== null) {
                  device.setLocation(userArray[i].lat, userArray[i].lon, userArray[i].fence)
                  device.setBattery(userArray[i].battery);
                } else {
                  ref.logmodule.writelog('debug', "Device NOT found");
                }
                ref.users.push(user);
              }
          } catch (err) {
             ref.logmodule.writelog('error', "Parsing userArray failed: "+ err);
             ref.userArray = [];
             ref.logmodule.writelog('debug', data);
          }
       }
       ref.logmodule.writelog('debug', "User data: "+ JSON.stringify(ref.getJSON()));
    });
  }

  getUserArray() {
    return this.users;
  }

  searchAllDevicesAutocomplete(key, wildcards) {
    this.logmodule.writelog('debug', "searchAllDevices: "+ key);
    var matchDevices = [];
    var temp = [];

    // If the wildcards argument is set to true, Add an option to select all fences
    if (wildcards == true) {
      matchDevices.push({icon: '//', name: Homey.__("ac_all_devices"), description: 'Wildcard', device: '*' });
    }

    for (var i=0; i < this.users.length; i++) {
      for (var j=0; j < this.users[i].devices.devices.length; j++) {
       try {
          if (String(this.users[i].devices.devices[j].name.toLowerCase()).includes(key.toLowerCase())) {
            this.logmodule.writelog('debug', "key: " + key + "    deviceArray: " + this.users[i].devices.devices[j].name);
            temp.icon = '//';
            temp.name = this.users[i].devices.devices[j].name;
            matchDevices.push({icon: temp.icon, name: temp.name, description: Homey.__("desc_all_devices"), device: temp.name});
          }
       } catch(err) {
           this.logmodule.writelog('error', "Fill device autocomplete failed: "+ err);
       }
     }
    }
    return matchDevices;
  }

}
module.exports = UserArray;