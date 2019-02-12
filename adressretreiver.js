"use strict";

const GeoCode = require('./geo-code.js');

class AdressRetreiver {
  constructor(logmodule) {
    this.geocoder = new GeoCode();
    this.logmodule = require("./logmodule.js");
//    this.globalVar = globalVar;
  }

  getCurrentAdress(lat, lon) {
    const ref = this;
    this.geocoder.reverse(lat, lon).then(result => {
      ref.logmodule.writelog('debug', "result: " + JSON.stringify(result.raw.address));
      getAddress = result.raw.address.road+' '+result.raw.address.house_number+', '+result.raw.address.postcode+', '+result.raw.address.city;
      ref.logmodule.writelog('debug',getAddress);
      return getAddress;
    }).catch(error => {
      ref.logmodule.writelog('error', "Could not retreive addres: " + error);
      return null;
    })
  }
}
module.exports = AdressRetreiver;
