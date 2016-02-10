/*
  This file contains utilities for calibrating and working with data from ph sensors.

  Note: we might differentiate between analog and digital sensors.
*/

// https://en.wikipedia.org/wiki/Errors-in-variables_model

var regression = require('regression');
var time = require('time')(Date);

GROWJS.prototype.ph = {
  phData: [],

  // Defaults
  params: {
    vRef: 4.096,
    opampGain: 5.25,
    pH7Cal: 2048,
    pH4Cal: 1286,
    pHStep: 59.16 
  },

  // Adds readings to ph Data.
  addReading: function(reading) {
    var self = this;
    self.phData.push([new time.Date(), reading])
  },

  // Log ph and clear short term data store.
  log_ph: function () {
    var self = this;
    self.readableStream.push({
      name: "Ph",
      type: "ph",
      unit: "ph",
      value: self.ph.calcPh()
    });
    delete self.phData;
  },

  //Lets read our raw reading while in pH7 calibration fluid and store it
  //We will store in raw int formats as this math works the same on pH step calcs
  calibratepH7: function (calnum){
    var self = this;
    self.params.pH7Cal = calnum;
    self.calcpHSlope();
  },

  //Lets read our raw reading while in pH7 calibration fluid and store it
  //We will store in raw int formats as this math works the same on pH step calcs
  calibratepH7: function (calnum){
    var self = this;
    self.params.pH7Cal = calnum;
    self.calcpHSlope();
  },

  //This is really the heart of the calibration process, we want to capture the
  //probes "age" and compare it to the Ideal Probe, the easiest way to capture two readings,
  //at known point(4 and 7 for example) and calculate the slope.
  //If your slope is drifting too much from ideal (59.16) its time to clean or replace!
  calcpHSlope: function () {
    var self = this;

    //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain /pH step difference 7-4
    self.params.pHStep = ((((self.vRef*(self.params.pH7Cal - self.params.pH4Cal))/4096)*1000)/self.opampGain)/3;
  },

  //Now that we know our probe "age" we can calculate the proper pH Its really a matter of applying the math
  //We will find our millivolts based on ADV vref and reading, then we use the 7 calibration
  //to find out how many steps that is away from 7, then apply our calibrated slope to calculate real pH
  calcpH: function() {
    var self = this;
    var result = regression('linear', self.phData);
    console.log(result);
    var miliVolts = ((result/4096)*self.vRef)*1000;
    var temp = ((((self.vRef*self.params.pH7Cal)/4096)*1000)- miliVolts)/self.opampGain;
    var pH = 7-(temp/self.params.pHStep);
    console.log(pH);
  }
};
