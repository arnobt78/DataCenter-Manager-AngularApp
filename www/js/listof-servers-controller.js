angular.module('datacenterManager.controllers')
  .controller('ListofServersController', function (DemoFactory, PopUpService,$scope, $http, $state, $q, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, $translate, $ionicPopover, UserData, PollService, SSLValidatedAPICall) {

    $ionicNavBarDelegate.showBackButton(true);

    var self = this;
    self.numberOfServers = 0;
    self.servers = [];
    self.datacenterId = UserData.GetDatacenterSelectedId();
    self.datacenterName = UserData.GetDatacenterSelectedName();
    self.searchTextofServersFilter = '';
    self.onlineofflineFilter = [];

    DemoFactory.SetScope($scope);



    $scope.searchText = function () {
      $scope.$broadcast('searchFinished');
      self.popover.hide();
    }
    //Filter Menu Start
    $ionicPopover.fromTemplateUrl('templates/filter-menu/filter-menu-for-listof-servers.html', {
      scope: $scope,
    }).then(function(popover) {
      self.popover = popover;
    });

    self.DefaultData = function() {
      self.searchTextofServersFilter = '';
      self.onlineofflineFilter = [];

    };


    self.onlineofflineFilterClicked = function (state) {
      if (self.onlineofflineFilter.indexOf(state) === -1) {
        self.onlineofflineFilter.push(state);
      } else {
        self.onlineofflineFilter.splice(self.onlineofflineFilter.indexOf(state), 1);
      }
    }

    self.filteByOnlineOffline = function(server) {
      if(self.onlineofflineFilter.length==0)
      {
        return true;
      }
      return (self.onlineofflineFilter.indexOf(server.properties.vmState) > -1);
    };
    //Filter Menu End

    var reqServers = {

      method: 'GET',
      url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers?depth=2'
    };

    $ionicLoading.show({templateUrl: 'templates/loading.html'});

    SSLValidatedAPICall.ProcessHTTPRequest(reqServers).then(function sucessCallback(response) {

      self.numberOfServers = response.data.items.length;
      self.servers = response.data.items;

      $ionicLoading.hide();

    }, function errorCallback(response) {
      $ionicLoading.hide();
      var alertPopup = $ionicPopup.alert({
        title: $translate.instant('server-text'),
        template: $translate.instant('server-not-found-text')
      });
    });

    // go to single Server page after clicking
    self.EnterSingleServer = function (serverId, serverName) {

      UserData.SetServerSelectedName(serverName);
      UserData.SetServerSelectedId(serverId);
      // $state.go('app.singleServer');
      $state.transitionTo('app.singleServer', {}, {reload: true});
    }

    if(DemoFactory.GetSSLStatus() === false)
    {
      PopUpService.ShowSSLPopUp();
    }

  })
