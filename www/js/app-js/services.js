angular.module('datacenterManager.services', [])

.value('profitbricksServerLink', 'https://my.profitbricks.com/dashboard/dcdr2/')
.value('profitbricksFingerprint', '8B C8 8D 64 9B 9D 6D 70 88 9B D2 37 E4 12 7C 0B 64 7F C6 CA')
.value('sslCheckTimeInterval', 3600000)
// 1 minute = 60000 miliseconds


.service("SSLFingerprintValidatorService", function ($window, $state, $q, profitbricksServerLink, profitbricksFingerprint) {
  this.validateSSLbyFingerPrint = function () {
    var defer = $q.defer();
    window.plugins.sslFingerprintValidator.check(
      function successCallback(result) {
        //console.log("Verification Successful");
        defer.resolve(result);
      },
      function errorCallback(result) {
        //console.log("Verification Failed");
        defer.reject(result);
      },
      profitbricksServerLink,
      profitbricksFingerprint);
    return defer.promise;
  };

  //NEED ALLOWED FINGERPRINTS
  this.getAllowedFingerPrints = function(){
    return profitbricksFingerprint ;
  }
})

.service('SSLValidatedAPICall', function(DemoFactory,sslCheckTimeInterval, PopUpService, $translate, SSLFingerprintValidatorService, $q, $http,UserData,$ionicPopup,$ionicLoading ) {

  var self = this;

  self.ProcessHTTPRequest = function(requestObject) {
    var defer = $q.defer();

    var currentTime = new Date();
    //console.log("currentTime: ",currentTime);

    var timeDifference = currentTime - DemoFactory.GetTime() ;
    //console.log("Time Difference" + timeDifference);


    if(DemoFactory.GetIsSSLRequired() !== true)
    {
      if(timeDifference<sslCheckTimeInterval)
      {
        DemoFactory.SetIsSSLRequired(false);
      }
      else {
        DemoFactory.SetIsSSLRequired(true);
      }
    }


    if(DemoFactory.GetIsSSLRequired() === true) {

      SSLFingerprintValidatorService.validateSSLbyFingerPrint().then(function successCallback(response) {
        //console.log("Validation successful before API Call" + response);

        DemoFactory.SetIsSSLRequired(true);
        DemoFactory.SetSSLStatus(true);

        $http.defaults.headers.common['Authorization'] = 'Basic ' + btoa(UserData.GetUsername() + ':' + UserData.GetPassword());
        $http.defaults.headers.common['ContentType'] = 'application/vnd.profitbricks.resource+json';

        $http(requestObject).then(function successCallback(response) {
            //console.log("API Call Successful" + response);
            defer.resolve(response);
          },
          function errorCallback(response) {
            //console.log("API Call Unsuccessful" + response);

            defer.reject(response);

          });


      },function errorCallback(response)
      {
        //console.log("Validation NOT successful before API Call" + response);

        DemoFactory.GetScope().allowedFingerprints =response.allowedFingerprints;
        DemoFactory.GetScope().serverCertFingerprints =response.serverCertFingerprints;

        DemoFactory.SetSSLStatus(false);

        var i,j;
        for (i = 0; i < response.allowedFingerprints.length; i++) {
          //console.log("Allowed:" + response.allowedFingerprints[i].toString());
        }

        for (j = 0; j < response.serverCertFingerprints.length; j++) {
          //console.log("From Server:" + response.serverCertFingerprints[j].toString());
        }

        $ionicLoading.hide();
        defer.reject(response);

      });

    }
    else
    {
      $http.defaults.headers.common['Authorization'] = 'Basic ' + btoa(UserData.GetUsername() + ':' + UserData.GetPassword());
      $http.defaults.headers.common['ContentType'] = 'application/vnd.profitbricks.resource+json';

      $http(requestObject).then(function successCallback(response) {
          //console.log("API Call Successful" + response);
          defer.resolve(response);
        },
        function errorCallback(response) {
          //console.log("API Call Unsuccessful" + response);
          defer.reject(response);
        });
    }

    return defer.promise;
  }
})

.service("CipherService", function () {

  /*
   * Encrypt a message with a passphrase or password
   *
   * @param    string message
   * @param    string password
   * @return   object
   */

  this.encrypt = function (message, password) {
    var salt = forge.random.getBytesSync(128);
    var key = forge.pkcs5.pbkdf2(password, salt, 4, 16);
    var iv = forge.random.getBytesSync(16);
    var cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(message));
    cipher.finish();
    var cipherText = forge.util.encode64(cipher.output.getBytes());
    return {cipher_text: cipherText, salt: forge.util.encode64(salt), iv: forge.util.encode64(iv)};
  }

  /*
   * Decrypt cipher text using a password or passphrase and a corresponding salt and iv
   *
   * @param    string (Base64) cipherText
   * @param    string password
   * @param    string (Base64) salt
   * @param    string (Base64) iv
   * @return   string
   */

  this.decrypt = function (cipherText, password, salt, iv) {
    var key = forge.pkcs5.pbkdf2(password, forge.util.decode64(salt), 4, 16);
    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({iv: forge.util.decode64(iv)});
    decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
    var pass = decipher.finish();

    var result = "";

    //alert("result is "+pass);
    if (pass == true)
      result = decipher.output.toString();
    else
      result = "error";

    return result;
  }
})

.factory('UserData', function ($q, $http, $ionicLoading, $ionicPopup, CipherService,DemoFactory,PopUpService, SSLFingerprintValidatorService) {

  var _username = '';
  var _password = '';
  var _pinCode = '';
  var _numberOfDatacenters = 0;
  var _datacenters = {};
  var _datacenterSelectedId = '';
  var _datacenterSelectedName = '';
  var _usePINProtection = false;
  var _serverSelectedId = '';
  var _serverSelectedName = '';
  var _volumeSelectedId = '';
  var _volumeSelectedName = '';
  var _selectedServer = {};
  var _serverSelectedAttachedVolumes = [];
  var _selectedLanguage = '';

  return {

    SetUsername: function (newUsername) {

      _username = newUsername;
    },

    GetUsername: function () {

      return _username;
    },

    SetPassword: function (newPassword) {

      _password = newPassword;
    },

    GetPassword: function () {

      return _password;
    },

    SetPinCode: function (newPinCode) {

      _pinCode = newPinCode;
    },

    GetPinCode: function () {

      return _pinCode;
    },

    SetLanguage: function (newLanguage) {

      _selectedLanguage = newLanguage;
    },

    GetLanguage: function () {

      return _selectedLanguage;
    },

    SetNumberOfDatacenters: function (newNumberOfDatacenters) {

      _numberOfDatacenters = newNumberOfDatacenters;
    },

    GetNumberOfDatacenters: function () {

      return _numberOfDatacenters;
    },

    SetDatacenters: function (newDatacenters) {

      _datacenters = newDatacenters;
    },

    GetDatacenters: function () {

      return _datacenters;
    },
    // for  selected datacenter properties . . .
    SetDatacenterSelectedId: function (newId) {

      _datacenterSelectedId = newId;
    },

    GetDatacenterSelectedId: function () {

      return _datacenterSelectedId;
    },

    SetDatacenterSelectedName: function (newName) {

      _datacenterSelectedName = newName;
    },

    GetDatacenterSelectedName: function () {

      return _datacenterSelectedName;
    },
    // for selected server properties . . .
    SetServerSelectedId: function (newId) {

      _serverSelectedId = newId;
    },

    GetServerSelectedId: function () {

      return _serverSelectedId;
    },

    SetServerSelectedName: function (newName) {

      _serverSelectedName = newName;
    },

    GetServerSelectedName: function () {

      return _serverSelectedName;
    },

    SetServerSelectedAttachedVolumes: function (attachedVolumes) {

      _serverSelectedAttachedVolumes = attachedVolumes;
    },

    GetServerSelectedAttachedVolumes: function () {

      return _serverSelectedAttachedVolumes;
    },

    SetSelectedServer: function (selectedServer) {

      _selectedServer = selectedServer;
    },

    GetSelectedServer: function () {

      return _selectedServer;
    },
    // for selected volume properties . . .
    SetVolumeSelectedId: function (newId) {

      _volumeSelectedId = newId;
    },

    GetVolumeSelectedId: function () {

      return _volumeSelectedId;
    },

    SetVolumeSelectedName: function (newName) {

      _volumeSelectedName = newName;
    },

    GetVolumeSelectedName: function () {

      return _volumeSelectedName;
    },

    SetUsePINProtection: function (useProtection) {

      _usePINProtection = useProtection;
    },

    GetUsePINProtection: function (useProtection) {

      return _usePINProtection;
    },

    CheckIfSavedDataExists: function () {

      // Just check for one piece of data and also for the PIN
      var promise = localforage.getItem('username');
      return promise;
    },

    SaveLanguage: function () {
      localforage.setItem('language', _selectedLanguage, function (error, result) {

        if (error) {
          alert('Error when saving language change');
        }

      });
    },

    LoadSavedData: function () {

      var deferred = $q.defer();

      var currentPromise1, currentPromise2;

      currentPromise1 = localforage.getItem('username');
      currentPromise1.then(function sucessCallback(result) {

        if (result != null) {
          try {
            _username = CipherService.decrypt(result.cipher_text, _pinCode, result.salt, result.iv);
          } catch (e) {

          }

          if (_username != "error") {
            deferred.resolve(result);
          }
          else {
            deferred.reject(result);
          }
        }

      }, function errorCallback(result) {
        alert("Error loading username");
        deferred.reject(result);

      });

      var deferred2 = $q.defer();

      currentPromise2 = localforage.getItem('password');
      currentPromise2.then(function sucessCallback(result) {

        if (result != null) {
          try {
            _password = CipherService.decrypt(result.cipher_text, _pinCode, result.salt, result.iv);
          } catch (e) {

          }

          if (_password != "error") {
            deferred2.resolve(result);
          }
          else {
            deferred2.reject(result);
          }
        }

      }, function errorCallback(result) {

        alert("Error loading password");
        deferred2.reject(result);

      });

      return $q.all([deferred.promise, deferred2.promise]);
    },

    Login: function (saveCredentials) {

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      var defer = $q.defer();

      if( DemoFactory.GetSSLStatus() === true)
      {
        // Set the correct headers
        $http.defaults.headers.common['Authorization'] = 'Basic ' + btoa(_username + ':' + _password);
        $http.defaults.headers.common['ContentType'] = 'application/vnd.profitbricks.resource+json';

        // Create the request object
        var reqDatacenters = {

          method: 'GET',
          url: 'https://api.profitbricks.com/rest/datacenters?depth=5',
          timeout: 10000
        };

        // Send the request
        $http(reqDatacenters).then(function sucessCallback(response) {

          _numberOfDatacenters = response.data.items.length;
          _datacenters = response.data.items;

          if (saveCredentials == true) {
            _usePINProtection = true;

            var encryptedUsername = CipherService.encrypt(_username, _pinCode);
            var encryptedPassword = CipherService.encrypt(_password, _pinCode);

            localforage.setItem('username', encryptedUsername, function (error, result) {

              //alert(JSON.stringify(result));
              if (error) {
                alert('Error when saving username');
              }

            });

            localforage.setItem('password', encryptedPassword, function (error, result) {

              //alert(JSON.stringify(result));
              if (error) {
                alert('Error when saving password');
              }
            });

            localforage.setItem('pinProtection', true, function (error, result) {

              if (error) {
                alert('Error when saving pin protection change');
              }

            });
          }

          $ionicLoading.hide();
          defer.resolve(response);

        }, function errorCallback(response) {

          var message = '';

          switch (response.status) {
            case 0:
            case 401:
              message = "Could not log in with the provided credentials";
              break;
          }

          $ionicLoading.hide();
          defer.reject(response);

        });
      }
      else
      {
        SSLFingerprintValidatorService.validateSSLbyFingerPrint().then(function successCallback(response) {

          DemoFactory.SetSSLStatus(true);

          // Set the correct headers
          $http.defaults.headers.common['Authorization'] = 'Basic ' + btoa(_username + ':' + _password);
          $http.defaults.headers.common['ContentType'] = 'application/vnd.profitbricks.resource+json';

          // Create the request object
          var reqDatacenters = {

            method: 'GET',
            url: 'https://api.profitbricks.com/rest/datacenters?depth=5',
            timeout: 10000
          };

          // Send the request
          $http(reqDatacenters).then(function sucessCallback(response) {

            _numberOfDatacenters = response.data.items.length;
            _datacenters = response.data.items;

            if (saveCredentials == true) {
              _usePINProtection = true;

              var encryptedUsername = CipherService.encrypt(_username, _pinCode);
              var encryptedPassword = CipherService.encrypt(_password, _pinCode);

              localforage.setItem('username', encryptedUsername, function (error, result) {

                //alert(JSON.stringify(result));
                if (error) {
                  alert('Error when saving username');
                }

              });

              localforage.setItem('password', encryptedPassword, function (error, result) {

                //alert(JSON.stringify(result));
                if (error) {
                  alert('Error when saving password');
                }
              });

              localforage.setItem('pinProtection', true, function (error, result) {

                if (error) {
                  alert('Error when saving pin protection change');
                }

              });
            }

            $ionicLoading.hide();
            defer.resolve(response);

          }, function errorCallback(response) {

            var message = '';

            switch (response.status) {
              case 0:
              case 401:
                message = "Could not log in with the provided credentials";
                break;
            }

            $ionicLoading.hide();
            defer.reject(response);

          });
        },function errorCallback(response)
        {
          DemoFactory.SetSSLStatus(false);
          DemoFactory.GetScope().allowedFingerprints =response.allowedFingerprints;
          DemoFactory.GetScope().serverCertFingerprints =response.serverCertFingerprints;
          PopUpService.ShowSSLPopUp();

        });
      }


      return defer.promise;

    }
  }
})

.factory('PollService', function ($q, $http, $interval) {

    var _pollingTime = 500;
    var _interval;

    return {

      Start: function (urlp, callback) {

        var defer = $q.defer();

        function tick() {

          var reqServerPoll = {

            method: 'GET',
            url: urlp
          };

          $http(reqServerPoll).then(function sucessCallback(response) {

            callback(response);

            defer.resolve(response);

          }, function errorCallback(response) {

            defer.reject(response);
            //alert("Error, Server couldn't get started");
          });
        }

        _interval = $interval(tick, _pollingTime);
      },

      Stop: function () {

        $interval.cancel(_interval);
      }
    };
})

.service("PopUpService", function ($ionicLoading, DemoFactory, $translate, $ionicPopup) {

  var self = this;
  self.ShowLoading = function()
  {
    $ionicLoading.show({templateUrl: 'templates/loading.html'});
  }
  self.HideLoading = function()
  {
    $ionicLoading.hide();
  }

  self.ShowSSLPopUp = function ()
  {
    $ionicLoading.hide();

    var sslPopUp = $ionicPopup.show({
      templateUrl: 'templates/pop-up/ssl-validator-popup.html',
      title: $translate.instant('ssl-validator-popup-title-text'),
      scope: DemoFactory.GetScope(),
      buttons: [
        {
          text: $translate.instant('cancel-text'),
          type: 'button-default',
          onTap: function(e) {
            DemoFactory.SetIsSSLRequired(true);
          }
        },
        {
          text: $translate.instant('ssl-proceed-text'),
          type: 'button-positive',
          onTap: function(e)
          {
            var sslInvalidFoundTime = new Date();
            //console.log("sslInvalidFoundTime: ",sslInvalidFoundTime);
            DemoFactory.SetTime(sslInvalidFoundTime);
            DemoFactory.SetIsSSLRequired(false);
            DemoFactory.SetSSLStatus(true);

          }
        }
      ]
    });

  }

})

.factory('DemoFactory', function () {

  var _scope = null;
  var _time = null;
  var _IsSSLRequired = null;
  var _SSLStatus = '';
  var _state = null;

  return {
    SetScope: function (scopeTemp) {
      _scope = scopeTemp;
    },
    GetScope: function () {
      return _scope;
    },
    SetTime: function (timeTemp) {
      _time = timeTemp;
    },
    GetTime: function () {
      return _time;
    },
    SetIsSSLRequired: function (sslReqTemp) {
      _IsSSLRequired = sslReqTemp;
    },
    GetIsSSLRequired: function () {
      return _IsSSLRequired;
    },
    SetSSLStatus: function (sslStatusTemp) {
      _SSLStatus = sslStatusTemp;
    },
    GetSSLStatus: function () {
      return _SSLStatus;
    }

}
})












