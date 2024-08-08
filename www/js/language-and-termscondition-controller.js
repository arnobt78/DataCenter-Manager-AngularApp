angular.module('datacenterManager.controllers')
  .controller('LanguageAndTermsconditionsController', function (DemoFactory,$scope, $state, $q, $translate, UserData, $ionicModal, $ionicPopover, $ionicPopup, $ionicLoading) {

    var self = this;
    self.selectedLanguage = 'English';
    self.showError=true;
    self.showInfoInLoginCredentials = true;

    self.key = 'en';
    $scope.key = 'en';

    var userDeviceLanguage = navigator.language;

    //console.log(userDeviceLanguage);
    if(userDeviceLanguage === 'de-DE')
    {
      self.key = 'de';
      self.selectedLanguage = 'Deutsch';
    }
    else
    {
      self.key = 'en';
      self.selectedLanguage = 'English';
    }

    UserData.SetLanguage(self.key);
    $translate.use(self.key).then(function (translation) {
      self.agreeText = $translate.instant('agree-full-text');
    });

    self.agreeTerms = false;


    DemoFactory.SetScope($scope);

    if(DemoFactory.GetIsSSLRequired() === null)
    {
      DemoFactory.SetIsSSLRequired(true);
    }

    $scope.allowedFingerprints = null;
    $scope.serverCertFingerprints =null;

    //$ionicLoading.show({templateUrl: 'templates/loading.html'});
    //self.agreeText = '';

    $translate.use(self.key).then(function (translation) {
      self.agreeText = $translate.instant('agree-full-text');
    });

    // checkbox conformation
    self.ChangeAgreeStatus = function () {
      if (self.agreeTerms === false) {
        self.agreeTerms = true;
      }
      else {
        self.agreeTerms = false;
      }
    }

    self.ShowOrHideInformationDiv = function () {
      if( self.showInfoInLoginCredentials === true)
      {
        self.showInfoInLoginCredentials = false;
        self.showFilter = false;
      }
      else {
        self.showInfoInLoginCredentials = true;
        self.showFilter = true;
      }
    }

    //Terms and Condition Modal
    $ionicModal.fromTemplateUrl('templates/terms-and-conditions-modal.html', function($ionicModal) {
      $scope.modal = $ionicModal;
    },
      {
      scope: $scope,
      animation: 'slide-in-up'
    });

    localforage.getItem('language').then(function successCallback(result) {

      if(result != null) {
        UserData.SetLanguage(result);
        $translate.use(result);

        UserData.CheckIfSavedDataExists().then(function successCallback(response) {

          // We have not found any saved credentials
          if (response == null) {
            $state.transitionTo('login.firstStartCredentials', {}, {reload: true});
          }
          else // We have found saved credentials
          {

             localforage.getItem('pinProtection').then(function successCallback(result) {

              UserData.SetUsePINProtection(result);

              if (UserData.GetUsePINProtection() == true)
                $state.transitionTo('login.setAppCode', {}, {reload: true});
              else
                $state.transitionTo('login.firstStartCredentials', {}, {reload: true});

            }, function errorCallback() {

            });
          }
        }, function errorCallback(error) {

        });
      }

    }, function errorCallback() {

    });



    // select Language
    self.ChangeLanguage = function (selectedLanguage) {

      switch (selectedLanguage) {
        case 'English':
          self.key = 'en';
          $scope.key = 'en';
          break;

        case 'Deutsch':
          self.key = 'de';
          $scope.key = 'de';
          break;
      }
      UserData.SetLanguage(self.key);
      $translate.use(self.key).then(function (translation) {
        self.agreeText = $translate.instant('agree-full-text');
      });
    }

    // Check for Saved Credentials
    self.CheckForSavedCredentials = function () {

      if(self.agreeTerms == true) {
        self.showError=true;
        UserData.SaveLanguage();
        $state.transitionTo('login.firstStartCredentials', {}, {reload: true});
      }
      else {
        self.showError=false;
      }
    }
  })

