angular.module('datacenterManager.controllers')
  .controller('ListofDatacentersController', function (DemoFactory, PopUpService, $scope, $http, $state, $translate, $ionicHistory, $ionicPopup, $ionicLoading, UserData, $filter, $ionicPopover, HardwareBackButtonManager, SSLValidatedAPICall) {

    //HardwareBackButtonManager.disable();
    var self = this;
    self.numberOfDatacenters = UserData.GetNumberOfDatacenters();
    self.datacenters = UserData.GetDatacenters();

    self.theDataCenter = 0;
    self.numberOfCores = 0;
    self.totalRam = 0;
    self.totalVolumeSize = 0;

    DemoFactory.SetScope($scope);


    $scope.searchText = function () {
      $scope.$broadcast('searchFinished');
      self.popover.hide();
    }

    //Restart the application
    $scope.counter = 0;
    $scope.TappingForRestartApp = function() {
      $scope.counter++;

      if ($scope.counter==5) {

        var cancelText = $translate.instant('cancel-text');

        var confirmPopup;

        $scope.StartAppAgainActionsPopup = confirmPopup = $ionicPopup.confirm({
            title: $translate.instant('app-restart-text'),
            template: $translate.instant('app-restart-confirmation-text'),
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
            $scope.StartAppAgainActionsPopup.close();
            $ionicLoading.hide();
            $state.transitionTo('login.firstStartLanguage', {}, {reload: true});
          }
          else {
              $scope.StartAppAgainActionsPopup.close();
              $ionicLoading.hide();
              $scope.counter =0;
          }
        });
      }
      else {

      }
    };

    //Filter Menu Start
    $ionicPopover.fromTemplateUrl('templates/filter-menu/filter-menu-for-listof-datacenters.html', {
      scope: $scope,
    }).then(function(popover) {
      self.popover = popover;
    });

    self.searchTextofDatacentersFilter = '';

    self.DefaultData = function() {
      self.searchTextofDatacentersFilter = '';
      self.locationNameFilter = [];
    };

    self.locationNameFilter = [];

    self.locationFilterClicked = function (locationName) {
      if (self.locationNameFilter.indexOf(locationName) === -1) {
        self.locationNameFilter.push(locationName);
      } else {
        self.locationNameFilter.splice(self.locationNameFilter.indexOf(locationName), 1);
      }
    }

    self.filterByLocation = function(dataCenter) {
      if(self.locationNameFilter.length==0)
      {
        return true;
      }
      return (self.locationNameFilter.indexOf(dataCenter.properties.location) > -1);
    };
    //Filter Menu End

    angular.forEach(self.datacenters, function(dvalue, dkey){

      if(dvalue.properties.location == "de/fra")
      {
        dvalue.properties.location = "Frankfurt";
      }
      if(dvalue.properties.location == "de/fkb")
      {
        dvalue.properties.location = "Karlsruhe";
      }
      if(dvalue.properties.location == "us/las")
      {
        dvalue.properties.location = "Las Vegas";
      }

      var theDataCenter = $filter('filter')(self.datacenters, {id: dvalue.id})[0];

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      var reqServers = {
        method: 'GET',
        url: dvalue.entities.servers.href + "?depth=5"
      };

      SSLValidatedAPICall.ProcessHTTPRequest(reqServers).then(function sucessCallback(response) {

        $filter('filter')(self.datacenters, {id: dvalue.id})[0].numberOfServers = response.data.items.length;
        //self.numberOfServers += response.data.items.length;
        self.servers = response.data.items;

        theDataCenter.numberOfCores = 0;
        theDataCenter.totalRam = 0;

        angular.forEach(self.servers, function(svalue, skey){
          theDataCenter.numberOfCores = (theDataCenter.numberOfCores == undefined)? svalue.properties.cores:(theDataCenter.numberOfCores+svalue.properties.cores);
          theDataCenter.totalRam = (theDataCenter.totalRam == undefined)?svalue.properties.ram:(theDataCenter.totalRam+svalue.properties.ram);
        });

          $ionicLoading.hide();
      }, function errorCallback(response) {
          $ionicLoading.hide();
      });

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      var reqVolumes = {
        method: 'GET',
        url: dvalue.entities.volumes.href + "?depth=5"
      };

      SSLValidatedAPICall.ProcessHTTPRequest(reqVolumes).then(function sucessCallback(response) {

        $filter('filter')(self.datacenters, {id: dvalue.id})[0].numberOfStorages = response.data.items.length;
        //self.numberOfServers += response.data.items.length;
        self.volumes = response.data.items;

        theDataCenter.totalVolumeSize = 0;

        angular.forEach(self.volumes, function(vvalue, skey){
          theDataCenter.totalVolumeSize = (theDataCenter.totalVolumeSize == undefined)?vvalue.properties.size:(theDataCenter.totalVolumeSize+vvalue.properties.size);
        });
          $ionicLoading.hide();
      }, function errorCallback(response) {
          $ionicLoading.hide();
      });
    });

    // go to Servers page after clicking
    self.EnterDatacenter = function (datacenterId, datacenterName) {

      UserData.SetDatacenterSelectedName(datacenterName);
      UserData.SetDatacenterSelectedId(datacenterId);
      // $state.go('app.servers');
      $state.transitionTo('app.servers', {}, {reload: true});
    }

    // showing more info by using accordion
    self.toggleGroup = function(datacenter) {
      if (self.isGroupShown(datacenter)) {
        self.shownGroup = null;
      } else {
        self.shownGroup = datacenter;
      }
    };

    self.isGroupShown = function(datacenter) {
      return self.shownGroup === datacenter;
    };


    if(DemoFactory.GetSSLStatus() === false)
    {
      PopUpService.ShowSSLPopUp();
    }

  })
