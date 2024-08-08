angular.module('datacenterManager.controllers')
  .controller('StorageController', function (DemoFactory, PopUpService,  $scope, $http, $state, $filter, $q, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, $translate, UserData, PollService, SSLValidatedAPICall) {

    $ionicNavBarDelegate.showBackButton(true);

    var self = this;
    self.serverId = UserData.GetServerSelectedId();
    self.serverName = UserData.GetServerSelectedName();
    self.datacenterId = UserData.GetDatacenterSelectedId();
    self.datacenterName = UserData.GetDatacenterSelectedName();
    self.volumeId = UserData.GetVolumeSelectedId();
    self.volumeName = UserData.GetVolumeSelectedName();
    self.volumeActionsPopup = null;
    self.datacenters = UserData.GetDatacenters();

    // self.poolSuccessCodeCreateSnapshot = 0;
    // self.poolSuccessCodeAttach= 0;
    // self.poolSuccessCodeDetach = 0;
    // self.poolSuccessCodeSnapShotLists = 0;

    DemoFactory.SetScope($scope);


    self.datacenterLocation = $filter('filter')(self.datacenters, {id: self.datacenterId})[0].properties.location;

    var reqVolume = {
        method: 'GET',
        url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/volumes/' + self.volumeId
      };

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      SSLValidatedAPICall.ProcessHTTPRequest(reqVolume).then(function sucessCallback(response) {
          self.singleVolume = response.data;
		  $ionicLoading.hide();
		  
		  /*
			depending on the bus type the hot plugging may be defined in two different properties.
			therefore we create our own neutral variable which can then be used in the template to check for the rendering
		  */
		  
		  if (response.data.properties.bus == "VIRTIO") {
			self.singleVolume.properties.discHotPlug = response.data.properties.discVirtioHotPlug;
			self.singleVolume.properties.discHotUnplug = response.data.properties.discVirtioHotUnplug;
		  } else {
			self.singleVolume.properties.discHotPlug = response.data.properties.discScsiHotPlug;
			self.singleVolume.properties.discHotUnplug = response.data.properties.discScsiHotUnplug;
		  }

        }, function errorCallback(response) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('snapshot-lists-text'),
              template: $translate.instant('snapshot-list-not-fetch-text')
            });
      });

    // check the connectivity status and show only the attached Volume
    self.checkIfConnected = function (volumeId) {
      var volume = $filter('filter')(UserData.GetServerSelectedAttachedVolumes(), {id: volumeId}, true);
      if(volume.length > 0) {
        return true;
      }
      return false;
    }

    // Create Snapshot of that Volume
    self.CreateSnapshot = function () {
      //self.poolSuccessCodeCreateSnapshot = 0;
      self.createSnapshotActionsPopup = $ionicPopup.confirm({
          title: $translate.instant('create-snapshot-text'),
          template: $translate.instant('snapshot-create-text'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
      });

      self.createSnapshotActionsPopup.then(function (res) {

        if (res) {
          $ionicLoading.show({templateUrl: 'templates/loading.html'});
          self.createSnapshotActionsPopup.close();

          var snapshotName = self.singleVolume.properties.name;

          var reqCreateSnapshot = {

              method: 'POST',
              url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/volumes/' + self.volumeId + '/create-snapshot?depth=1',
              data: {name: encodeURIComponent(snapshotName), description: ""},
              headers: {
                'Content-Type': "application/x-www-form-urlencoded"
              }
          };

          $http(reqCreateSnapshot).then(function sucessCallback(response) {

            var done = false;
            PollService.Start(response.headers('Location'), function (result) {

              if (result.data.metadata.status == 'DONE' && !done) {
                  done = true;
                  PollService.Stop();
                  $ionicLoading.hide();
                  //self.poolSuccessCodeCreateSnapshot++;
                  var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('create-snapshot-text'),
                    template: $translate.instant('successful-message-create-snapshot-text')
                  });
                  $state.transitionTo($state.current, $state.$current.params, {reload: true});

                // if(self.poolSuccessCodeCreateSnapshot == 1) {
                //   var alertPopup = $ionicPopup.alert({
                //     title: $translate.instant('create-snapshot-text'),
                //     template: $translate.instant('successful-message-create-snapshot-text')
                //   });
                //   $state.transitionTo($state.current, $state.$current.params, {reload: true});
                // }
              }
            });
          }, function errorCallback(response) {

              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('create-snapshot-text'),
                template: $translate.instant('error-message-create-snapshot-text')
              });
              $ionicLoading.hide();
          });
            //$ionicLoading.hide();
        }
        else {
            self.createSnapshotActionsPopup.close();
            //$ionicLoading.hide();
        }
      });

    };

    // Attach Volume from that Server
    self.AttachVolume = function () {

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      var reqServers = {
          method: 'GET',
          url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers?depth=2'
        };

        SSLValidatedAPICall.ProcessHTTPRequest(reqServers).then(function sucessCallback(response) {

          self.numberOfServers = response.data.items.length;
          self.servers = response.data.items;

            self.volumeActionsPopup = $ionicPopup.show({
              templateUrl: 'templates/pop-up/listof-servers-popup.html',
              title: $translate.instant('server-title-text'),
              scope: $scope,
              buttons: [
                { text: $translate.instant('cancel-text') }
              ]
            });

          $ionicLoading.hide();

        }, function errorCallback(response) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('server-title-text'),
              template: $translate.instant('no-server-retrieve-text')
            });
        });
    };

    // PopUp Options for Attaching Volume with Server
    self.ShowServerActionsPopup = function (serverId) {

      //self.poolSuccessCodeAttach= 0;
      self.serverId = serverId;
      var popupStorageTitle = $translate.instant('attach-confrim-question');
      var cancelText = $translate.instant('cancel-text');

      // var confirmPopup;
      // var popupConfirmationTitle = $translate.instant('attach-storage-text');

      var confirmPopup = $ionicPopup.confirm({
          title: $translate.instant('attach-storage-text'),
          template: $translate.instant('attach-confrim-question'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
        });

      confirmPopup.then(function (res) {

        if (res) {

          $ionicLoading.show({templateUrl: 'templates/loading.html'});

          var reqAttachVolume = {
            method: 'POST',
            url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + serverId + '/volumes?depth=1',
            data: {id: encodeURIComponent(self.volumeId)},
            headers: {
              'Content-Type': "application/vnd.profitbricks.resource+json"
            }
          };

          SSLValidatedAPICall.ProcessHTTPRequest(reqAttachVolume).then(function sucessCallback(response) {

            var done = false;
            PollService.Start(response.headers('Location'), function (result) {

              if (result.data.metadata.status == 'DONE' && !done) {
                done = true;
                self.volumeActionsPopup.close();
                PollService.Stop();
                self.RetrieveServer();
                //self.poolSuccessCodeAttach++;
                $ionicLoading.hide();
                var alertPopup = $ionicPopup.alert({
                  title: $translate.instant('attach-storage-text'),
                  template: $translate.instant('successful-message-attach-volume-text')
                });

                UserData.GetSelectedServer(response.data.id);
                UserData.GetSelectedServer(response.data.properties.name);
                $state.transitionTo($state.current, $state.$current.params, {reload: true});

                // if(self.poolSuccessCodeAttach == 1) {
                //   var alertPopup = $ionicPopup.alert({
                //     title: $translate.instant('attach-storage-text'),
                //     template: $translate.instant('successful-message-attach-volume-text')
                //   });

                //   UserData.GetSelectedServer(response.data.id);
                //   UserData.GetSelectedServer(response.data.properties.name);
                //   $state.transitionTo($state.current, $state.$current.params, {reload: true});
                // }
              }
            });
              self.volumeActionsPopup.close();

          }, function errorCallback(response) {
            self.volumeActionsPopup.close();
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('attach-storage-text'),
              template: $translate.instant('error-message-attach-volume-text')
            });
          });
            self.volumeActionsPopup.close();
        }
        else {
            self.volumeActionsPopup.close();
            $ionicLoading.hide();
        }
      });
    };

      // var reqAttachVolume = {
      //   method: 'POST',
      //   url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId + '/volumes?depth=1',
      //   data: {id: encodeURIComponent(self.volumeId)},
      //   headers: {
      //     'Content-Type': "application/vnd.profitbricks.resource+json"
      //   }
      // };

      // $http(reqAttachVolume).then(function sucessCallback(response) {

      //       //self.storageActionsPopup.close();
      //       var myPopup = $ionicPopup.show({
      //         templateUrl: 'templates/listof-servers-popup.html',
      //         title: 'Server Lists',
      //         scope: $scope,
      //         buttons: [
      //           { text: '<b>Cancel</b>' }
      //         ]
      //       });
      //       // var alertPopup = $ionicPopup.alert({
      //       //   title: 'Attach Volume!',
      //       //   template: 'Attach this Volume with this Server Sucessfully.'
      //       // });
      //       $ionicLoading.hide();

      // }, function errorCallback(response) {

      //       var alertPopup = $ionicPopup.alert({
      //         title: 'Attach Volume!',
      //         template: 'Error, could not attach this Volume with this Server.'
      //       });
      //       $ionicLoading.hide();
      // });


    // Detach Volume from that Server
    self.DetachVolume = function () {
      //self.poolSuccessCodeDetach = 0;
      // var cancelText = $translate.instant('cancel-text');
      // var popupConfirmationTitle = $translate.instant('detach-storage-text');

      self.detachVolumeActionsPopup = $ionicPopup.confirm({
          title: $translate.instant('detach-storage-text'),
          template: $translate.instant('detach-volume-text'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
      });

      self.detachVolumeActionsPopup.then(function (res) {

        if (res) {

          $ionicLoading.show({templateUrl: 'templates/loading.html'});

          self.detachVolumeActionsPopup.close();

          var reqDetachVolume = {
            method: 'DELETE',
            url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId + '/volumes/' + self.volumeId
          };

          SSLValidatedAPICall.ProcessHTTPRequest(reqDetachVolume).then(function sucessCallback(response) {

          var done = false;
          PollService.Start(response.headers('Location'), function (result) {

            if (result.data.metadata.status == 'DONE' && !done) {
              done = true;
              PollService.Stop();
              self.RetrieveServer();
              $ionicLoading.hide();
              //self.poolSuccessCodeDetach++;
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('detach-storage-text'),
                template: $translate.instant('successful-message-detach-volume-text')
              });

              UserData.SetServerSelectedName("");
              UserData.SetServerSelectedId("");
              $state.transitionTo($state.current, $state.$current.params, {reload: true});

              // if(self.poolSuccessCodeDetach== 1) {
              //   var alertPopup = $ionicPopup.alert({
              //     title: $translate.instant('detach-storage-text'),
              //     template: $translate.instant('successful-message-detach-volume-text')
              //   });
              //   UserData.SetServerSelectedName("");
              //   UserData.SetServerSelectedId("");
              //   $state.transitionTo($state.current, $state.$current.params, {reload: true});
              // }
            }
          });

        }, function errorCallback(response) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('detach-storage-text'),
              template: $translate.instant('error-message-detach-volume-text')
            });
          });
        }
        else {
            self.detachVolumeActionsPopup.close();
            $ionicLoading.hide();
        }
      });
    };

    // retrieve this server
    self.RetrieveServer = function () {

      var reqServerRetrieve = {
        method: 'GET',
        url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId + "?depth=5"
      };

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      SSLValidatedAPICall.ProcessHTTPRequest(reqServerRetrieve).then(function sucessCallback(response) {

        self.singleServerData = response.data;
        UserData.SetSelectedServer(response.data);
        UserData.SetServerSelectedId(response.data.id);
        UserData.SetServerSelectedName(response.data.properties.name);
        UserData.SetServerSelectedAttachedVolumes(response.data.entities.volumes.items);
        $ionicLoading.hide();
        //$state.transitionTo($state.current, $state.$current.params, {reload: true});
      }, function errorCallback(response) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: $translate.instant('servers-text'),
            template: $translate.instant('popup-description-server-text')
          });
      });
    }

    // show Snapshot Lists of that Server for Restoring Snapshot
    self.SnapshotList = function () {

      self.data = [];

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      var reqSnapshotList = {
        method: 'GET',
        url: 'https://api.profitbricks.com/rest/snapshots?depth=1'
      };

      SSLValidatedAPICall.ProcessHTTPRequest(reqSnapshotList).then(function sucessCallback(response) {

        self.snapshotList = response.data;

        self.snapshotActionsPopup = $ionicPopup.show({
          templateUrl: 'templates/pop-up/listof-snapshots-popup.html',
          title: $translate.instant('snapshot-lists-text'),
          scope: $scope,
          buttons: [
            { text: $translate.instant('cancel-text') }
          ]
        });
        $ionicLoading.hide();

      }, function errorCallback(response) {
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({
          title: $translate.instant('snapshot-lists-text'),
          template: $translate.instant('error-message-restore-snapshot-text')
        });
      });
    };

    // PopUp Options for Restore Snapshot
    self.ShowSnapshotActionsPopup = function (snapshotId) {

      var popupStorageTitle = $translate.instant('snapshot-selection-text');
      var cancelText = $translate.instant('cancel-text');
      //self.poolSuccessCodeSnapShotLists = 0;

      //var confirmPopup;
      //var popupConfirmationTitle = $translate.instant('confirmation-text');

      var confirmPopup = $ionicPopup.confirm({
          title: $translate.instant('restore-snapshot-storage-text'),
          template: $translate.instant('restore-confrim-question'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
        });

      confirmPopup.then(function (res) {

        if (res) {

          $ionicLoading.show({templateUrl: 'templates/loading.html'});

          var reqSnapshotRestore = {
            method: 'POST',
            url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/volumes/' + self.volumeId + '/restore-snapshot?depth=1',
            data: {snapshotId: encodeURIComponent(snapshotId)},
            headers: {
              'Content-Type': "application/x-www-form-urlencoded"
            }
          };

          SSLValidatedAPICall.ProcessHTTPRequest(reqSnapshotRestore).then(function sucessCallback(response) {

            self.snapshotActionsPopup.close();
            var done = false;
            PollService.Start(response.headers('Location'), function (result) {

              if (result.data.metadata.status == 'DONE' && !done) {
                done = true;
                PollService.Stop();
                $ionicLoading.hide();
                //self.poolSuccessCodeSnapShotLists++;
                var alertPopup = $ionicPopup.alert({
                  title: $translate.instant('snapshot-lists-text'),
                  template: $translate.instant('successful-message-restore-snapshot-text')
                });
                $state.transitionTo($state.current, $state.$current.params, {reload: true});
                // if(self.poolSuccessCodeSnapShotLists == 1) {
                //   var alertPopup = $ionicPopup.alert({
                //     title: $translate.instant('snapshot-lists-text'),
                //     template: $translate.instant('successful-message-restore-snapshot-text')
                //   });
                // }
              }
            });
            self.snapshotActionsPopup.close();

          }, function errorCallback(response) {
              self.snapshotActionsPopup.close();
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('snapshot-lists-text'),
                template: $translate.instant('snapshot-list-not-fetch-text')
              });
          });
              self.snapshotActionsPopup.close();
        }
        else {

        }
      });
    };


    if(DemoFactory.GetSSLStatus() === false)
    {
      PopUpService.ShowSSLPopUp();
    }

  })
