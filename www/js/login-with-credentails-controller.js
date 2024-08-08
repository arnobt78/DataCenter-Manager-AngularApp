angular.module('datacenterManager.controllers')
  .controller('LoginWithCredentailsController', function (PopUpService,DemoFactory,$scope, $state, $filter, $ionicNavBarDelegate,SSLFingerprintValidatorService, $ionicPopup, $ionicLoading, $translate, UserData, CipherService, SSLFingerprintValidatorService) {

    var self = this;
    self.username = '';
    self.password = '';
    self.saveCredentials = false;
    self.pinCode = '';
    self.errorMessage = '';
    self.showError=true;
    self.showInfoInLoginCredentials = true;
    self.isPassword =false;
    self.inputType = 'password';

    self.HideShowPassword = function() {
      if (self.isPassword == true) {
        self.isPassword=false;
        self.inputType = 'password';
      } else {
        self.isPassword=true;
        self.inputType = 'text';
      }
    }

    DemoFactory.SetScope($scope);

    //var $translate = $filter('translate');
    $ionicNavBarDelegate.showBackButton(false);

    $scope.usernameEntered = function () {
      $scope.$broadcast('usernameEnterFinished');
    }

    $scope.passwordEntered = function () {
      if(!self.AreCredentialsEmpty()) {
        self.Login();
      }
      // else {
      //   $ionicPopup.alert({
      //     title: $translate.instant('login-title-text'),
      //     template: $translate.instant('login-check-message-text')
      //   });
      // }
    }

    // check username and password field whether it is empty or not
    self.AreCredentialsEmpty = function () {
      return (self.username === '' || self.password === '');
    }

    // for checkbox to save credentials
    self.ChangeSaveCridentials = function () {
      if(self.saveCredentials === false)
      {
        self.saveCredentials = true;
      }
      else
      {
        self.saveCredentials = false;
      }
    }

    self.ShowOrHideInformationDiv = function () {
      if( self.showInfoInLoginCredentials === true)
      {
        self.showInfoInLoginCredentials = false;
      }
      else {
        self.showInfoInLoginCredentials = true;
      }
    }

    // Save data from the model into the temporal user data factory
    self.Login = function () {

      localforage.clear(function () {
        UserData.SetUsername(self.username.toLowerCase());
        UserData.SetPassword(self.password);
        UserData.SaveLanguage();

          UserData.Login(false).then(function successcallback(response) {
            if(self.saveCredentials) {
              $state.transitionTo('login.setAppCode', {}, {reload: true});
            }
            else {
              $state.transitionTo('app.datacenters', {}, {reload: true});
            }
          }, function errorCallback(error) {

            if(error.status === 401 || error.status === 0) {
              self.errorMessage = $translate.instant('error-message-wrong-user-password-text');
              self.showError=false;
            }
            else {
              self.errorMessage = error.statusText;
              self.showError=false;
            }
          });



      });
    }
  })
