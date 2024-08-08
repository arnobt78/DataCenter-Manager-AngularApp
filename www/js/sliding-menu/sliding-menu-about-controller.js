angular.module('datacenterManager.controllers')
  .controller('AboutController', function (DemoFactory, $scope, $http, $state, $q, $translate, $ionicModal, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, UserData, $filter, $ionicPopover, SSLFingerprintValidatorService)
  {

    $ionicNavBarDelegate.showBackButton(true);
    var self = this;
    self.versionNumber = '';
    DemoFactory.SetScope($scope);


    //Terms and Condition Modal
    $ionicModal.fromTemplateUrl('templates/terms-and-conditions-modal.html', function($ionicModal) {
      $scope.modal = $ionicModal;
    },
      {
      scope: $scope,
      animation: 'slide-in-up'
    });

    self.allowedFingerprints = SSLFingerprintValidatorService.getAllowedFingerPrints();

    cordova.getAppVersion(function(version) {
     var text = $translate.instant('version-number-text') ;
      self.versionNumber = text + ": " + version.toString();
    });

  })
