"use strict";
const Homey = require('homey');
const Location = require("./location.js");
const SendQueue = require("./SendQueue.js");

class Device {
  constructor(name, id) {
    this.name = name;
    this.id = id;
    this.battery = 0;
    this.battTriggered = false;
    this.usesHttp = false;
    this.inregions = false;
    this.location = new Location(0,0,null);
    this.queue = new SendQueue();
    this.logmodule = require("./logmodule.js");

    this.logmodule.writelog('debug', "Device constructor called");
  }

  getLocation() {
    //this.logmodule.writelog('debug', "getLocation(): " + JSON.stringify(this.location));
    return this.location;
  }

  getName() {
    //this.logmodule.writelog('debug',"device.getName: "+ this.name);
    return this.name;
  }

  getId() {
    return this.id;
  }

  isBattTriggered() {
    return this.battTriggered;
  }

  setBattTriggered(triggered) {
      this.battTriggered = triggered;
  }

  isHttpDevice() {
    return this.usesHttp;
  }

  setHttpDevice(usesHttp) {
    this.usesHttp = true;
  }

  getJSON() {
    return {
      name: this.name,
      id: this.id,
      battery: this.battery,
      battTriggered: this.battTriggered,
      location: this.location.getJSON()
    }
  }

  setLocation(lat, lon, fence, timestamp) {
    this.logmodule.writelog('debug', "device setLocation called");
    this.location.setLocation(lat, lon, fence, timestamp);
  }

  getBattery() {
    return this.battery;
  }

  setBattery(battery) {
    this.battery = battery;
  }

  supportsInregions() {
    return this.inregions;
  }

  setInregionsSupport(inregions) {
    this.inregions = inregions;
  }
}


/**
 *
 */
class DeviceArray {

  constructor() {
    this.devices = [];
    this.logmodule = require("./logmodule.js");

    this.logmodule.writelog('debug', "DeviceArray constructor called");
  }

  /**
   * getDeviceByName - description
   *
   * @param  {type} name description
   * @return {type}      description
   */
  getDevice(name) {
    for (var i=0; i<this.devices.length; i++) {
      //this.logmodule.writelog('debug',"devices[i]: "+ this.devices[i].getName());
      if (name == this.devices[i].getName()) {
        return this.devices[i];
      }
    }
    return null;
  }

  getDevices() {
    return this.devices;
  }

  /**
   * getDeviceById - description
   *
   * @param  {type} id description
   * @return {type}    description
   */
  getDeviceById(id) {
    for (var i=0; i<this.devices.length; i++) {
      if (id === this.devices[i].getId()) {
        return this.devices[i];
      }
    }
    return null;
  }

  getJSON() {
    var values = [];
    for (var i=0; i < this.devices.length; i++) {
      values.push(this.devices[i].getJSON());
    }
    return JSON.parse(JSON.stringify(values));
  }

  /**
   * addDevice - description
   *
   * @param  {type} name     description
   * @param  {type} id       description
   * @param  {type} location description
   * @return {type}          description
   */
  addDevice(name, id) {
    this.logmodule.writelog('debug', "devices.addDevice called");
    if (this.getDevice(name) === null) {
      this.logmodule.writelog('debug', "New device: " + name);
      var device = new Device(name, id)
      this.devices.push(device);
      return device;
    }
    return null;
  }

  clear() {
    for (var i=0; i< this.devices.length; i++) {
      delete this.devices[i];
    }
  }

  searchDevicesAutocomplete(key, wildcards) {
     this.logmodule.writelog('debug', "searchDevices: "+ key);
     var matchDevices = [];
     var temp = [];

     // If the wildcards argument is set to true, Add an option to select all fences
     if (wildcards == true) {
       matchDevices.push({icon: '//', name: Homey.__("ac_all_devices"), description: 'Wildcard', device: '*' });
     }

     for (var i=0; i < this.devices.length; i++) {
        try {
           if (String(this.devices[i].name.toLowerCase()).includes(key.toLowerCase())) {
             this.logmodule.writelog('debug', "key: " + key + "    deviceArray: " + this.devices[i].name);
             temp.icon = '//';
             temp.name = this.devices[i].name;
             matchDevices.push({icon: temp.icon, name: temp.name, description: Homey.__("desc_all_devices"), device: temp.name});
           }
        } catch(err) {
            this.logmodule.writelog('error', "Fill device autocomplete failed: "+ err);
        }
     }
     return matchDevices;
   }
}

module.exports = DeviceArray;
