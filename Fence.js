"use strict";
const Homey = require('homey');

class Fence {
  constructor(lat, lon, radius, name) {
    this.lat = lat;
    this.lon = lon;
    this.radius = radius;
    this.name = name;

    this.logmodule = require('./logmodule.js');
  }

  getFence() {
    return this;
  }

  getName() {
    return this.name;
  }

  getJSON() {
    return {
      lat: this.lat,
      lon: this.lon,
      radius: this.radius,
      name: this.name
    }
  }
}

class FenceArray {
  constructor() {
    this.fences = [];
    this.logmodule = require('./logmodule.js');

    this.initFencesOld();
  }

  addFence(lat, lon, radius, name) {
    if (this.getFence(name) === null) {
      this.fences.add(new Fence(lat, lon, radius, name));
    }
  }

  getFence(name) {
    for (var i=0; i<this.fences.length; i++) {
      if (name === this.fences[i].getName()) {
        return this.fences[i];
      }
    }
    return null;
  }

  deleteFence(name) {
     try {
        ref.logmodule.writelog('debug', "Delete fence called: "+ name);
        var result = false;
        for (var i=0; i < this.fences.length; i++) {
           if (this.fences[i].name === name) {
              var deletedFence = this.fences.splice(i, 1);
              this.logmodule.writelog('info', "Deleted fence: " + deletedFence.name);
              result = true;
           }
        }
        // persist fence data
        return result;
     } catch(err) {
        ref.logmodule.writelog('error', "deleteFence: " +err);
        return err;
     }
  }

  getJSON() {
    var values = [];
    for (var i=0; i < this.fences.length; i++) {
      values.push(this.fences[i].getJSON());
    }
    return JSON.parse(JSON.stringify(values));
  }

  searchFenceAutocomplete(key, wildcards) {
     this.logmodule.writelog('debug', "searchFence: "+ key);
     var matchFence = [];
     var temp = [];

     // If the wildcards argument is set to true, Add an option to select all fences
     if (wildcards == true) {
       matchFence.push({icon: '//', name: Homey.__("ac_all_fences"), description: 'Wildcard', fence: '*' });
     }

     for (var i=0; i < this.fences.length; i++) {
        try {
           this.logmodule.writelog('debug', "searchFenceAutocomplete Fence: "+ JSON.stringify(this.fences[i]));
           if (String(this.fences[i].name.toLowerCase()).includes(key.toLowerCase())) {
              if (this.fences[i].name !== '') {
                 this.logmodule.writelog('debug', "key: " + key + "    fenceArray: " + this.fences[i].name);
                 temp.icon = '//';
                 temp.name = this.fences[i].name;
                 matchFence.push({icon: temp.icon, name: temp.name, description: Homey.__("desc_all_fences"), fence: temp.name});
              }
           }
        } catch(err) {
           this.logmodule.writelog('error', "Fill fence autocomplete failed: "+ err);
        }
     }
     return matchFence;
  }

  initFencesOld() {
    const ref = this;

    ref.logmodule.writelog('debug', "initFencesOld entered ");
    require('fs').readFile('/userdata/owntracks_fences.json', 'utf8', function (err, data) {
       if (err) {
          ref.logmodule.writelog('error', "Retreiving fenceArray failed: "+ err);
       } else {
          try {
            var fenceArray = JSON.parse(data);
            for (var i=0; i<fenceArray.length; i++) {
              ref.fences.push(new Fence(fenceArray[i].lat, fenceArray[i].lon, fenceArray[i].rad, fenceArray[i].fenceName));
            }
          } catch(err) {
             ref.logmodule.writelog('error', "Parsing fenceArray failed: "+ err);
             ref.fenceArray = [];
          }
       }
       ref.logmodule.writelog('debug', "Fences: "+ JSON.stringify(ref.getJSON()));
    });
  }

  getFences() {
    return this.fences;
  }
}

module.exports = FenceArray;
