angular.module('datacenterManager.controllers')
  .controller('MenuStorageListsCtrl', function (DemoFactory, PopUpService,$window, $scope, $http, $state, $q, $translate, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, UserData, $filter, $ionicPopover, PollService, SSLValidatedAPICall) {

    $ionicNavBarDelegate.showBackButton(true);

    var self = this;
    self.datacenters = UserData.GetDatacenters();
    self.numberOfStorages = 0;

    self.volumes = [];
    self.servers = [];
    self.attachedVolumes = [];
    self.isAnyDetached = false;

    self.searchTextofSMStoragesFilter = '';
    self.heightOfScreen = $window.innerHeight;


    DemoFactory.SetScope($scope);

    self.data = {
      storageName: '',
      storageSize: '',
      storageLicenceType: $translate.instant('os-linux')
    };

    $scope.searchText = function () {
      $scope.$broadcast('searchFinished');
      self.popover.hide();
    }
    //Filter Menu Start
    $ionicPopover.fromTemplateUrl('templates/filter-menu/filter-menu-for-sliding-menu-listof-storages.html', {
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

    self.showServer = false;
    self.toggleServer = function()
    {
      if (self.showServer === false) {
        self.showServer = true;
      } else {
        self.showServer = false;
      }
    }

    self.showStatus = false;
    self.toggleStatus = function()
    {
      if (self.showStatus === false) {
        self.showStatus = true;
      } else {
        self.showStatus = false;
      }
    }

    self.DefaultData = function() {
      self.searchTextofSMStoragesFilter = '';
      self.locationNameFilter = [];
      self.datacenterNameFilter = [];
      self.serverNameFilter = [];
      self.isAttached = true;
      self.isDetached = true;
      self.showAttached = true;
      self.showDettached = true;
    };

    self.locationNameFilter = [];
    self.datacenterNameFilter = [];
    self.serverNameFilter = [];

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

    self.serverFilterClicked = function (dn) {
      if (self.serverNameFilter.indexOf(dn) === -1) {
        self.serverNameFilter.push(dn);
      } else {
        self.serverNameFilter.splice(self.serverNameFilter.indexOf(dn), 1);
      }
    }

    self.filterByServer = function(server) {
      if(self.serverNameFilter.length==0)
      {
        return true;
      }
      return (self.serverNameFilter.indexOf(server.properties.name) > -1);
    };

    self.isAttached = true;
    self.isDetached = true;

    self.showAttached = true;
    self.showDettached = true;

    self.attachedFilterClicked = function () {
      if (self.isAttached === true) {
        self.isAttached = false;
        self.showDettached = false;
      }
      else {
        self.isAttached = true;
        self.showDettached = true;
      }

      if (self.isAttached === false && self.isDetached === false ) {
        self.showAttached = true;
        self.showDettached = true;
      }

    }

    self.detachedFilterClicked = function () {
      if (self.isDetached === true) {
        self.isDetached = false;
        self.showAttached = false;

      }
      else {
        self.isDetached = true;
        self.showAttached = true;

      }

      if (self.isAttached === false && self.isDetached === false ) {
        self.showAttached = true;
        self.showDettached = true;
      }
    }
//Filter End

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
        angular.forEach(theDataCenter.servers, function(server, key) {
          self.attachedVolumes.push.apply(self.attachedVolumes, server.entities.volumes.items);
        });
        $ionicLoading.hide();

      }, function errorCallback(response) {
        $ionicLoading.hide();
      });
    });

    angular.forEach(self.datacenters, function(dvalue, dkey) {
      var theDataCenter = $filter('filter')(self.datacenters, {id: dvalue.id})[0];

      var reqVolumes = {
        method: 'GET',
        url: dvalue.entities.volumes.href + "?depth=5"
      };

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      SSLValidatedAPICall.ProcessHTTPRequest(reqVolumes).then(function sucessCallback(response) {

        self.numberOfStorages += response.data.items.length;
        theDataCenter.volumes = response.data.items;
        //self.servers.push.apply(self.servers, response.data.items);

        angular.forEach(theDataCenter.volumes, function(volumevalue, volumekey) {

          if(!self.isAnyDetached)
          {
            if(!self.checkIfConnected(volumevalue.id))
            {
              self.isAnyDetached=true;
            }
          }
        });

        $ionicLoading.hide();

      }, function errorCallback(response) {
        $ionicLoading.hide();
      });
    });

    // check status of connected or not connected Volumes
    self.checkIfConnected = function (volumeId) {
      var volume = $filter('filter')(self.attachedVolumes, {id: volumeId}, true);
      if(volume.length > 0) {
        return true;
      }
      return false;
    }

    self.isEmpty = function () {
      return (self.data.storageName === '' || self.data.storageSize === '' || self.data.storageLicenceType === '');
    }

    //show the list of datacenters
    self.DatacentersList = function () {

      self.data = {};

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      var reqDatacenters = {

        method: 'GET',
        url: 'https://api.profitbricks.com/rest/datacenters?depth=5'

      };

      SSLValidatedAPICall.ProcessHTTPRequest(reqDatacenters).then(function sucessCallback(response) {

        self.dataCentersList = response.data;

        self.datacenterActionsPopup = $ionicPopup.show({
          templateUrl: 'templates/pop-up/listof-datacenters-popup.html',
          title: $translate.instant('datacenters-text'),
          scope: $scope,
          buttons: [
            { text: $translate.instant('cancel-text') }
          ]
        });

        $ionicLoading.hide();
      }, function errorCallback(response) {

        var alertPopup = $ionicPopup.alert({
          title: $translate.instant('datacenters-text'),
          template: $translate.instant('error-message-retrieve-datacenter-text')
        });

        $ionicLoading.hide();
      });
    };

    // create a new Volume
    self.CreateNewVolume = function (datacenterId) {

    self.data = {
      storageName: '',
      storageSize: '',
      storageLicenceType: 'LINUX'
    };

    self.datacenterId = datacenterId;

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      templateUrl: 'templates/pop-up/create-storage-menu-popup.html',
      title: $translate.instant('create-new-volume-text'),
      scope: $scope,
      buttons: [
        {
          text: $translate.instant('cancel-text'),
          type: 'button-default',
          onTap: function(e) {
            // e.preventDefault() will stop the popup from closing when tapped.
            // e.preventDefault();
          }
        },
        {
          text: $translate.instant('create-text'),
          type: 'button-positive',
          onTap: function(e) {
            if (self.isEmpty()) {
              //don't allow the user to close unless he insters HDD info
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('create-only-storage-button-text'),
                template: $translate.instant('create-volume-empty-text')
              });
              e.preventDefault();
            } else {
              return self.data;
            }
          }
        }
      ]
    });

    myPopup.then(function (res) {

      if (res) {

        self.createStorageName = self.data.storageName;
        self.createStorageSize = self.data.storageSize;
        self.createStorageLicenceType = self.data.storageLicenceType;

        var reqCreateVolume = {
            method: 'POST',
            url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/volumes?depth=1',
            data: { properties: {name: self.createStorageName, size: self.createStorageSize, licenceType: self.createStorageLicenceType} },
            headers: {
              'Content-Type': "application/vnd.profitbricks.resource+json"
            }
        };
        self.datacenterActionsPopup.close();
        $ionicLoading.show({templateUrl: 'templates/loading.html'});

        SSLValidatedAPICall.ProcessHTTPRequest(reqCreateVolume).then(function sucessCallback(response) {

          var done = false;
          PollService.Start(response.headers('Location'), function (result) {

              if (result.data.metadata.status == 'DONE' && !done) {
                done = true;
                PollService.Stop();
                //self.datacenterActionsPopup.close();
                $ionicLoading.hide();

                var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('create-only-storage-button-text'),
                    template: $translate.instant('successful-message-create-volume-text')
                  });
                $state.transitionTo($state.current, $state.$current.params, {reload: true});
              }
            });

        }, function errorCallback(response) {
            self.datacenterActionsPopup.close();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('create-only-storage-button-text'),
              template: $translate.instant('error-message-create-volume-text')
            });
            $ionicLoading.hide();
        });
      } else {
            $ionicLoading.hide();
      }
    })
  }

    // self.EnterDatacenter = function (datacenterId, datacenterName) {

    //   UserData.SetDatacenterSelectedName(datacenterName);
    //   UserData.SetDatacenterSelectedId(datacenterId);
    //   $state.transitionTo('app.servers', {}, {reload: true});
    // }

    // self.EnterSingleServer = function (serverId, serverName, datacenterId, datacenterName) {

    //   UserData.SetDatacenterSelectedName(datacenterName);
    //   UserData.SetDatacenterSelectedId(datacenterId);
    //   UserData.SetServerSelectedName(serverName);
    //   UserData.SetServerSelectedId(serverId);
    //   $state.transitionTo('app.singleServer', {}, {reload: true});
    // }

    self.EnterSingleStorage = function (volumeId, volumeName, datacenterId, datacenterName, singleServer) {

      UserData.SetDatacenterSelectedName(datacenterName);
      UserData.SetDatacenterSelectedId(datacenterId);
      UserData.SetVolumeSelectedName(volumeName);
      UserData.SetVolumeSelectedId(volumeId);
      if(singleServer == null) {
        UserData.SetServerSelectedAttachedVolumes([]);
        UserData.SetServerSelectedId('');
        UserData.SetServerSelectedName('');
      } else {
        UserData.SetServerSelectedId(singleServer.id);
        UserData.SetServerSelectedName(singleServer.properties.name);
        UserData.SetServerSelectedAttachedVolumes(singleServer.entities.volumes.items);
      }

      $state.transitionTo('app.singleStorage', {}, {reload: true});
    }

    if(DemoFactory.GetSSLStatus() === false)
    {
      PopUpService.ShowSSLPopUp();
    }

  })
