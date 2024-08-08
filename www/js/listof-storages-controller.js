angular.module('datacenterManager.controllers')
  .controller('ListofStoragesController', function (DemoFactory, PopUpService, $scope, $http, $state, $filter, $q, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, $translate, UserData, PollService, $ionicPopover, SSLValidatedAPICall) {

  $ionicNavBarDelegate.showBackButton(true);

  var self = this;

  DemoFactory.SetScope($scope);


  self.data = {
    storageName: '',
    storageSize: '',
    storageLicenceType: $translate.instant('os-linux')
  };

    self.data.storageLicenceType = $translate.instant('os-linux');


  self.volumesList = [];
  self.serverId = UserData.GetServerSelectedId();
  self.serverName = UserData.GetServerSelectedName();
  self.datacenterId = UserData.GetDatacenterSelectedId();
  self.datacenterName = UserData.GetDatacenterSelectedName();

  self.searchTextofStoragesFilter = '';




  $scope.searchText = function () {
    $scope.$broadcast('searchFinished');
    self.popover.hide();
  }
  //Filter Menu Start
  $ionicPopover.fromTemplateUrl('templates/filter-menu/filter-menu-for-listof-storages.html', {
    scope: $scope,
  }).then(function(popover) {
    self.popover = popover;
  });

  self.isEmpty = function () {
    return (self.data.storageName === '' || self.data.storageSize === '' || self.data.storageLicenceType === '');
  }

  self.DefaultData = function() {
    self.searchTextofStoragesFilter = '';
  };


    //self.volume = UserData.GetServerSelectedAttachedVolumes();

  /*var reqServerRestart = {
    method: 'GET',
    url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/volumes?depth=1'
  };

  $ionicLoading.show({templateUrl: 'templates/loading.html'});

  $http(reqServerRestart).then(function sucessCallback(response) {
      self.volumesList = response.data.items;
      $ionicLoading.hide();
    }, function errorCallback(response) {

    alert("Error, couldn't show volume lists!");
    $ionicLoading.hide();
  });*/

  self.volumesList = UserData.GetServerSelectedAttachedVolumes();
  self.server = UserData.GetSelectedServer();

  // check status of connected or not connected Volumes
  self.checkIfConnected = function (volumeId) {
    var volume = $filter('filter')(UserData.GetServerSelectedAttachedVolumes(), {id: volumeId}, true);
    if(volume.length > 0) {
      return true;
    }
    return false;
  }

  // go to single Storage page after clicking
  self.ShowSingleStorage = function (volumeId, volumeName) {

    UserData.SetVolumeSelectedName(volumeName);
    UserData.SetVolumeSelectedId(volumeId);
    $state.transitionTo('app.singleStorage', {}, {reload: true});
  }

  // retrieve this server
  self.RetrieveServer = function (serverId) {

      var reqServerRetrieve = {

        method: 'GET',
        url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId + "?depth=5"
      };

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      SSLValidatedAPICall.ProcessHTTPRequest(reqServerRetrieve).then(function sucessCallback(response) {

        self.singleServerData = response.data;
        UserData.SetSelectedServer(response.data);
        UserData.SetServerSelectedAttachedVolumes(response.data.entities.volumes.items);
        $ionicLoading.hide();
        $state.transitionTo($state.current, $state.$current.params, {reload: true});

      }, function errorCallback(response) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: $translate.instant('server-text'),
            template: $translate.instant('no-server-retrieve-text')
          });
      });
  }

  // Attach Volume from that Server
  self.AttachVolume = function (volumeId) {

    $ionicLoading.show({templateUrl: 'templates/loading.html'});

    var reqAttachVolume = {
      method: 'POST',
      url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId + '/volumes',
      data: {id: encodeURIComponent(volumeId)},
      headers: {
        'Content-Type': "application/vnd.profitbricks.resource+json"
      }
    };

    SSLValidatedAPICall.ProcessHTTPRequest(reqAttachVolume).then(function sucessCallback(response) {

        var done = false;
        PollService.Start(response.headers('Location'), function (result) {

          //console.log("Response from poll: " + result.data.metadata.status);

          if (result.data.metadata.status == 'DONE' && !done) {
            done = true;
            PollService.Stop();
            self.RetrieveServer(self.serverId);
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('create-only-storage-button-text'),
              template: $translate.instant('successful-message-create-volume-text')
            });
          }
        });

    }, function errorCallback(response) {
        $ionicLoading.hide();
    });
  };

  // create a new Volume
  self.CreateNewVolume = function () {

    self.data = {
      storageName: '',
      storageSize: '',
      storageLicenceType: 'LINUX'
    };

    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      templateUrl: 'templates/pop-up/create-storage-and-attach-popup.html',
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

        $ionicLoading.show({templateUrl: 'templates/loading.html'});

        SSLValidatedAPICall.ProcessHTTPRequest(reqCreateVolume).then(function sucessCallback(response) {
          var done = false;
          var errorShown = false;
          PollService.Start(response.headers('Location'), function (result) {

            if(result.data.metadata.status =="FAILED" && !errorShown)
            {
              errorShown = true;
              $ionicLoading.hide();
              $ionicPopup.alert({
                title: $translate.instant('storage-size-exceed-title'),
                template: $translate.instant('storage-size-exceed-details'),
                buttons: [{
                    text: $translate.instant('cancel-text')
                }]
              });

            }


            if (result.data.metadata.status == 'DONE' && !done) {
              done = true;
              PollService.Stop();
              //attach
              self.AttachVolume(response.data.id);
            }
          });
        }, function errorCallback(response) {

            $ionicLoading.hide();
        });
      } else {
          $ionicLoading.hide();
      }
    })
  }

    if(DemoFactory.GetSSLStatus() === false)
    {
      PopUpService.ShowSSLPopUp();
    }

})
