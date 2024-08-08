angular.module('datacenterManager.controllers')

  .controller('LoginWithPincodeController', function (DemoFactory, $scope, $state, $stateParams, $translate, $ionicNavBarDelegate, $ionicPopup, $window, UserData, SSLFingerprintValidatorService, profitbricksServerLink, profitbricksFingerprint, CipherService) {

    var self = this;
    self.pinCode = '';
    self.pinCode1 = '';
    self.pinCode2 = '';
    self.pinCode3 = '';
    self.pinCode4 = '';
    self.pinCounter = 0;
    self.isTyped = false;

    self.hideLogo = false;
    self.hideNormalFeedback = false;
    self.showInfoFeedback = true;
    self.showInfoBox = true;


    var heightOfScreen = $window.innerHeight;


    if(heightOfScreen < 600)
    {
      self.hideLogo = true;

      if(heightOfScreen<460)
      {
        self.hideNormalFeedback = true;
        self.showInfoFeedback = false;
      }
    }


    self.ShowOrHideInformationDiv = function () {
      if( self.showInfoBox === true)
      {
        self.showInfoBox = false;
      }
      else {
        self.showInfoBox = true;
      }
    }




      //Set the default value of inputType
    self.inputType = 'password';
    self.iconClass = 'icon eye-gray-image image-size-2 placeholder-icon';

    DemoFactory.SetScope($scope);

    $ionicNavBarDelegate.showBackButton(false);
    // check the credentials whether it is saved or not
    if($stateParams.resetAppCode) {
      self.isTyped = false;
      if(UserData.GetUsePINProtection()) {
        self.pinCodeTitle =  $translate.instant('reset-app-code-text');
      }
      else {
        self.pinCodeTitle =  $translate.instant('set-app-code-text');
      }
    }
    else {
      UserData.CheckIfSavedDataExists().then(function successCallback(response) {

        // We have not found any saved credentials
        if (response == null) {
          self.isTyped = false;
          self.pinCodeTitle = $translate.instant('set-app-code-text');
        }
        else // We have found saved credentials
        {
          self.pinCodeTitle = $translate.instant('type-app-code-text');
          self.isTyped = true;
        }
      }, function errorCallback(error) {

      });
    }

    // press or insert the pin code
    self.PressAppCode = function (pressedkeyValue) {

      if(pressedkeyValue == "verify") {

        self.pinCode = String(self.pinCode1) + String(self.pinCode2) +String(self.pinCode3) +String(self.pinCode4);

        UserData.SetPinCode(self.pinCode.toString());

        // We have not found any saved credentials
        if (self.isTyped === false) {
          UserData.Login(true).then(function successcallback(response) {
            if($stateParams.resetAppCode) {
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('change-appcode-button-text'),
                template: $translate.instant('success-message-change-app-code-text')
              });
              $state.transitionTo('app.settings', {}, {reload: true});
            }
            else {
              $state.transitionTo('app.datacenters', {}, {reload: true});
            }
          }, function errorCallback(error) {

          });
        }
        else // We have found saved credentials
        {
          // Since the app checked and found some saved credentials, we need
          // to first load all the data then
          UserData.LoadSavedData().then(function successCallback(response) {
            UserData.Login(false).then(function successcallback(response) {
              self.pinCounter = 0;
              if($stateParams.resetAppCode) {
                var alertPopup = $ionicPopup.alert({
                  title: $translate.instant('change-appcode-button-text'),
                  template: $translate.instant('success-message-change-app-code-text')
                });
                $state.transitionTo('app.settings', {}, {reload: true});
              }
              else {
                $state.transitionTo('app.datacenters', {}, {reload: true});
              }
            }, function errorCallback(error) {

            });

          }, function errorCallback(error) {
            self.clearPincode();
            self.pinCounter = self.pinCounter + 1;
            if (self.pinCounter == 2){
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('warning-text'),
                template: '<div translate> warning-pin-text </div>'
              });
            }

            else if (self.pinCounter == 3) {
              self.pinCounter = 0;
              $state.transitionTo('login.firstStartCredentials', {}, {reload: true});
            }

            else {
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('warning-text'),
                template: '<div translate> wrong-pin-text </div>'
              });
              alertPopup.then(function (res) {

              });
            }


          });
        }
        return;
      }

      if(pressedkeyValue === -1) {
        if(self.pinCode4 !== '') {
          self.pinCode4 = '';
        } else if(self.pinCode3 !== '') {
          self.pinCode3 = '';
        }
        else if(self.pinCode2 !== '') {
          self.pinCode2 = '';
        } else if(self.pinCode1 !== '') {
          self.pinCode1 = '';
        }
        return;
      }

      if(self.pinCode1 === '') {
        self.pinCode1 = pressedkeyValue;
      } else if(self.pinCode2 === '') {
        self.pinCode2 = pressedkeyValue;
      }
      else if(self.pinCode3 === '') {
        self.pinCode3 = pressedkeyValue;
      } else if(self.pinCode4 === '') {
        self.pinCode4 = pressedkeyValue;
      }
    }

    // Hide & show password function
    self.hideShowPassword = function(event) {
      if (self.inputType == 'password') {
        self.inputType = 'text';
        self.iconClass = 'icon eye-blue-image image-size-2 placeholder-icon';
      }
      else {
        self.inputType = 'password';
        self.iconClass = 'icon eye-gray-image image-size-2 placeholder-icon';
      }
    }

    self.clearPincode = function () {
      self.pinCode = '';
      self.pinCode1 = '';
      self.pinCode2 = '';
      self.pinCode3 = '';
      self.pinCode4 = '';
    }

    self.IsPinCodeComplete = function() {
      return (self.pinCode1 === "" || self.pinCode2 === "" || self.pinCode3 === "" || self.pinCode4 === "")
    }
  })
