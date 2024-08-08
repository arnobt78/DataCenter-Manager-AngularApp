angular.module('datacenterManager.controllers')
  .controller('SettingsController', function (DemoFactory,$scope, $http, $state, $q, $ionicHistory, $translate, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, UserData, $filter, $ionicPopover, PollService, SSLValidatedAPICall)
  {

  	var self = this;

    DemoFactory.SetScope($scope);


    self.key = UserData.GetLanguage();
    self.username = UserData.GetUsername();

    if(DemoFactory.GetIsSSLRequired()=== true)
    {
      self.isActivateSSL = true;
    }
    else
    {
      self.isActivateSSL = false;
    }

    if(UserData.GetLanguage() == 'en') {
      self.selectedLanguage = 'English';
    }
    else {
      self.selectedLanguage = 'Deutsch';
    }

    if(UserData.GetUsePINProtection()) {
      self.appCodeText = $translate.instant('change-appcode-button-text');
    }
    else {
      self.appCodeText = $translate.instant('set-appcode-button-text');
    }

  	$ionicNavBarDelegate.showBackButton(true);

  	//select language
  	self.changeLanguage = function (selectedLanguage) {

      var key = '';

      switch (selectedLanguage) {
        case 'English':
          self.key = 'en';
          break;

        case 'Deutsch':
          self.key = 'de';
          break;
      }
      UserData.SetLanguage(self.key);
      UserData.SaveLanguage();
      $translate.use(self.key);
      if(UserData.GetUsePINProtection()) {
        self.appCodeText = $translate.instant('change-appcode-button-text');
        $state.transitionTo($state.current, $state.$current.params, {reload: true});
      }
      else {
        self.appCodeText = $translate.instant('set-appcode-button-text');
        $state.transitionTo($state.current, $state.$current.params, {reload: true});
      }
    }

    //change App Code
    self.changeAppCode = function () {

      var cancelText = $translate.instant('cancel-text');

      var confirmPopup;
      var popupConfirmationTitle = '';
      var popupConfirmationDescription = '';

      if(UserData.GetUsePINProtection()) {
        popupConfirmationTitle = $translate.instant('change-appcode-button-text');
        popupConfirmationDescription = $translate.instant('change-app-code-confirmation-text');

      }
      else {
        popupConfirmationTitle = $translate.instant('set-appcode-button-text');
        popupConfirmationDescription = $translate.instant('set-app-code-confirmation-text');

      }

      //var yesText = $translate.instant('yes-text');
      //var noText = $translate.instant('no-text');

      self.changePinActionsPopup = $ionicPopup.confirm({
          title: popupConfirmationTitle,
          template: popupConfirmationDescription,
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
          // buttons: [
          //   {text: noText},
          //   {text: yesText}]
      });

      self.changePinActionsPopup.then(function (res) {

        if (res) {
            $ionicLoading.show({templateUrl: 'templates/loading.html'});
            self.changePinActionsPopup.close();
            $ionicLoading.hide();
            $state.transitionTo('login.setAppCode', { resetAppCode: true }, {reload: true});
        }
        else {
            self.changePinActionsPopup.close();
            $ionicLoading.hide();
        }
      });
    }

    //clear cache
    self.clearCache = function () {

      var cancelText = $translate.instant('cancel-text');

      var confirmPopup;
      var popupConfirmationTitle = $translate.instant('clear-cache-button-text');
      //var yesText = $translate.instant('yes-text');
      //var noText = $translate.instant('no-text');

      self.clearCacheActionsPopup = confirmPopup = $ionicPopup.confirm({
          title: popupConfirmationTitle,
          template: $translate.instant('clear-cache-confirmation-text'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
          // buttons: [
          //   {text: noText},
          //   {text: yesText}]
      });

      confirmPopup.then(function (res) {

        if (res) {

          $ionicLoading.show({templateUrl: 'templates/loading.html'});
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            self.clearCacheActionsPopup.close();
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
                title: $translate.instant('clear-cache-button-text'),
                template: $translate.instant('success-message-clear-chache-text')
              });
        }
        else {
            self.clearCacheActionsPopup.close();
            $ionicLoading.hide();
        }
      });

    }

    //another account
    self.anotherAccount = function () {

      var cancelText = $translate.instant('cancel-text');

      var confirmPopup;
      var popupConfirmationTitle = $translate.instant('another-account-button-text');
      //var yesText = $translate.instant('yes-text');
      //var noText = $translate.instant('no-text');

      self.anotherAccountActionsPopup = confirmPopup = $ionicPopup.confirm({
          title: popupConfirmationTitle,
          template: $translate.instant('another-account-confirmation-text'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
          // buttons: [
          //   {text: noText},
          //   {text: yesText}]
      });

      confirmPopup.then(function (res) {

        if (res) {

          $ionicLoading.show({templateUrl: 'templates/loading.html'});

            localforage.clear(function () {
              UserData.SaveLanguage();
            });
            UserData.SetUsePINProtection(false);
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            self.anotherAccountActionsPopup.close();
            $ionicLoading.hide();
            $state.transitionTo('login.firstStartCredentials', {}, {reload: true});
        }
        else {
            self.anotherAccountActionsPopup.close();
            $ionicLoading.hide();
        }
      });
    }


    self.ResetApp = function () {

      var confirmPopup;
      var popupConfirmationTitle = $translate.instant('reset-app-button-text');

      self.resetAppPopup = confirmPopup = $ionicPopup.confirm({
        title: popupConfirmationTitle,
        template: $translate.instant('reset-app-confirmation-text'),
        cancelText: $translate.instant('no-text'),
        okText: $translate.instant('yes-text')
      });

      confirmPopup.then(function (res) {
        if (res) {
          $ionicLoading.show({templateUrl: 'templates/loading.html'});
          localforage.clear(function () {
            UserData.SaveLanguage();
          });
          UserData.SetUsePINProtection(false);
          $ionicHistory.clearCache();
          $ionicHistory.clearHistory();
          self.resetAppPopup.close();
          $ionicLoading.hide();
          $state.transitionTo('login.firstStartLanguage', {}, {reload: true});
        }
        else {
          $scope.resetAppPopup.close();
          $ionicLoading.hide();
        }
      });

    }

    self.DeactivateSSL= function () {

      if(self.isActivateSSL === true)
      {
        self.isActivateSSL = false;
        var sslInvalidFoundTime = new Date();
        //console.log("sslInvalidFoundTime in settings: ",sslInvalidFoundTime);
        DemoFactory.SetTime(sslInvalidFoundTime);
        DemoFactory.SetIsSSLRequired(false);
        DemoFactory.SetSSLStatus(true);
      }
      else
      {
        self.isActivateSSL = true;
        DemoFactory.SetIsSSLRequired(true);
        DemoFactory.SetSSLStatus(true);
      }


    }





  })
