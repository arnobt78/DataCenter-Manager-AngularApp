#!/usr/bin/env node

//INSTALL npm install xml2js -g

var fs = require('fs');
var xml2js = require('xml2js');

// Read config.xml
fs.readFile('config.xml', 'utf8', function(err, data) {
  if(err) {
    return console.log(err);
  }

  // Get XML
  var xml = data;

  // Parse XML to JS Obj
  xml2js.parseString(xml, function (err, result) {
    if(err) {
      return console.log(err);
    }

    // Get JS Obj
    var obj = result;
    var versionNo = '';
    var majorNo = 0;
    var minorNo = 0;
    var patchNo = 0;



    if(typeof obj['widget']['$']['version'] === 'undefined') {
       majorNo = 0;
       minorNo = 0;
       patchNo = 0;
    }
    else
    {
      console.log("Build No fetch form config: " + obj['widget']['$']['version']);

      versionNo = obj['widget']['$']['version'];

      var totalVersionNumber = versionNo.split(".");

      majorNo = totalVersionNumber[0];
      console.log('majorNo: ' + majorNo);

      minorNo = totalVersionNumber[1];
      console.log('minorNo: ' + minorNo);

      patchNo = totalVersionNumber[2];
      console.log('patchNo: ' + patchNo);

      patchNo ++;

    }

    console.log("patchNo ++ Number " + patchNo);

    console.log("CORDOVA_CMDLINE: "+ process.env.CORDOVA_CMDLINE);
    var cmdline =  process.env.CORDOVA_CMDLINE ;

    if(cmdline.indexOf('--release') > -1)
    {
      minorNo ++ ;
    }

    obj['widget']['$']['version'] = majorNo.toString() +"."+ minorNo.toString() +"."+ patchNo.toString();

    console.log("New Version Number " + obj['widget']['$']['version'] );

    // Build XML from JS Obj
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(obj);

    // Write config.xml
    fs.writeFile('config.xml', xml, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log('Version number successfully incremented');
    });

  });
});
