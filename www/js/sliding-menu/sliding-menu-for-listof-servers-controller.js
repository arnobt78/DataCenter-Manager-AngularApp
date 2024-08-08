angular.module('datacenterManager.controllers')
	.controller('MenuServerListsCtrl', function (DemoFactory, PopUpService,$window, $scope, $http, $state, $q, $translate, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, $ionicPopover, UserData, $filter, $ionicPopover, PollService, SSLValidatedAPICall) {

    $ionicNavBarDelegate.showBackButton(true);
    var self = this;

    DemoFactory.SetScope($scope);

    self.heightOfScreen = $window.innerHeight;

    $scope.searchText = function () {
      $scope.$broadcast('searchFinished');
      self.popover.hide();
    }
    //Filter Menu Start
    $ionicPopover.fromTemplateUrl('templates/filter-menu/filter-menu-for-sliding-menu-listof-servers.html', {
      scope: $scope,
    }).then(function(popover) {
      self.popover = popover;
    });


    self.showDC = false;
    self.toggleDC = function()
    {
      if (self.showDC === false) {
        self.showDC = true;
      } else {
        self.showDC = false;
      }
    }

    self.showOnOff = false;
    self.toggleOnOff = function()
    {
      if (self.showOnOff === false) {
        self.showOnOff = true;
      } else {
        self.showOnOff = false;
      }
    }



		self.datacenters = UserData.GetDatacenters();
    self.numberOfServers = 0;
    self.searchTextofServersFilter = '';

    self.DefaultData = function() {
      self.searchTextofServersFilter = '';
      self.locationNameFilter = [];
      self.datacenterNameFilter = [];
      self.onlineofflineFilter = [];
    };

    self.locationNameFilter = [];
    self.datacenterNameFilter = [];

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

    self.datacenterFilterClicked = function (dn) {
      if (self.datacenterNameFilter.indexOf(dn) === -1) {
        self.datacenterNameFilter.push(dn);
      } else {
        self.datacenterNameFilter.splice(self.datacenterNameFilter.indexOf(dn), 1);
      }
    }

    self.filterByDatacenter = function(dataCenter) {
      if(self.datacenterNameFilter.length==0)
      {
        return true;
      }
      return (self.datacenterNameFilter.indexOf(dataCenter.properties.name) > -1);
    };

    self.onlineofflineFilter = [];
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

    ///
		self.servers = [];

		angular.forEach(self.datacenters, function(dvalue, dkey) {
			var theDataCenter = $filter('filter')(self.datacenters, {id: dvalue.id})[0];

			var reqServers = {
				method: 'GET',
				url: dvalue.entities.servers.href + "?depth=5"
		    };

		    $ionicLoading.show({templateUrl: 'templates/loading.html'});

      SSLValidatedAPICall.ProcessHTTPRequest(reqServers).then(function sucessCallback(response) {

          self.numberOfServers += response.data.items.length;
		    	theDataCenter.servers = response.data.items;
		      	//self.servers.push.apply(self.servers, response.data.items);
		      	$ionicLoading.hide();

		    }, function errorCallback(response) {
		    	$ionicLoading.hide();
		    });
		});

		self.EnterDatacenter = function (datacenterId, datacenterName) {

		  UserData.SetDatacenterSelectedName(datacenterName);
		  UserData.SetDatacenterSelectedId(datacenterId);
		  // $state.go('app.servers');
      $state.transitionTo('app.servers', {}, {reload: true});
		}

		self.EnterSingleServer = function (serverId, serverName, datacenterId, datacenterName) {

			UserData.SetDatacenterSelectedName(datacenterName);
			UserData.SetDatacenterSelectedId(datacenterId);
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
