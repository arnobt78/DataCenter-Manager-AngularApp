angular.module('datacenterManager.controllers')
  .controller('ListofSnapshotsController', function (DemoFactory, PopUpService, $scope, $http, $state, $filter, $q, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, $translate, UserData, PollService, $ionicPopover, SSLValidatedAPICall) {

    $ionicNavBarDelegate.showBackButton(true);

    var self = this;
    DemoFactory.SetScope($scope);

    self.snapshotList = [];
    self.serverId = UserData.GetServerSelectedId();
    self.serverName = UserData.GetServerSelectedName();
    self.datacenterId = UserData.GetDatacenterSelectedId();
    self.datacenterName = UserData.GetDatacenterSelectedName();
    self.volumeId = UserData.GetVolumeSelectedId();
    self.volumeName = UserData.GetVolumeSelectedName();

    self.datacenters = UserData.GetDatacenters();
    self.volumes = [];
    self.searchTextofSnapshotsFilter = '';
    //self.poolSuccessCode = 0;

    $scope.searchText = function () {
      $scope.$broadcast('searchFinished');
      self.popover.hide();
    }
    //Filter Menu Start
    $ionicPopover.fromTemplateUrl('templates/filter-menu/filter-menu-for-sliding-menu-listof-snapshots.html', {
      scope: $scope,
    }).then(function(popover) {
      self.popover = popover;
    });

    self.DefaultData = function() {
      self.searchTextofSnapshotsFilter = '';
    };

    var reqSnapshotList = {
      method: 'GET',
      url: 'https://api.profitbricks.com/rest/snapshots?depth=1'
    };

    $ionicLoading.show({templateUrl: 'templates/loading.html'});

    SSLValidatedAPICall.ProcessHTTPRequest(reqSnapshotList).then(function sucessCallback(response) {

      self.snapshotList = response.data;
      $ionicLoading.hide();

    }, function errorCallback(response) {
        $ionicLoading.hide();
        var alertPopup = $ionicPopup.alert({
          title: $translate.instant('snapshot-lists-text'),
          template: $translate.instant('snapshot-list-not-fetch-text')
        });
    });

    // Create Snapshot Volumes
    self.CreateSnapshot = function () {

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      angular.forEach(self.datacenters, function(dvalue, dkey) {
      var theDataCenter = $filter('filter')(self.datacenters, {id: dvalue.id})[0];

      var reqVolumes = {
        method: 'GET',
        url: dvalue.entities.volumes.href + "?depth=5"
        };

        SSLValidatedAPICall.ProcessHTTPRequest(reqVolumes).then(function sucessCallback(response) {

          // self.numberOfStorages += response.data.items.length;
          theDataCenter.volumes = response.data.items;
          $ionicLoading.hide();
          //self.servers.push.apply(self.servers, response.data.items);

        }, function errorCallback(response) {
            $ionicLoading.hide();
            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('storages-text'),
              template: $translate.instant('error-message-storage-list-text')
            });
        });
        $ionicLoading.hide();
      });

      self.volumeActionsPopup =  $ionicPopup.show({
        templateUrl: 'templates/pop-up/listof-storages-popup-for-create-snapshot.html',
        title: $translate.instant('storages-text'),
        scope: $scope,
        buttons: [
          { text: $translate.instant('cancel-text') }
        ]
      });
    };

    // PopUp Options for leading to volume for creating snapshot
    self.ShowSnapshotVolumeActionsPopup = function (selectedDatacenterId, selectedDatacenterName, selectedVolumeId, selectedVolumeName) {

      self.volumeActionsPopup.close();
      //self.poolSuccessCode = 0;

      self.datacenterId = selectedDatacenterId;
      self.datacenterName = selectedDatacenterName;
      self.volumeId = selectedVolumeId;
      self.volumeName = selectedVolumeName;

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

          var snapshotName = self.volumeName;

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

                // self.poolSuccessCode++;
                  // self.showCreateSuccessPopUpSingleTime();
                  var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('create-snapshot-text'),
                    template: $translate.instant('successful-message-create-snapshot-text')
                  });
                  $state.transitionTo($state.current, $state.$current.params, {reload: true});
              }
            });
          }, function errorCallback(response) {
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('create-snapshot-text'),
                template: $translate.instant('error-message-create-snapshot-text')
              });
          });
            //$ionicLoading.hide();
        }
        else {
            self.createSnapshotActionsPopup.close();
            //$ionicLoading.hide();
        }
      });
    };

    // self.showCreateSuccessPopUpSingleTime = function (){
    //   if(self.poolSuccessCode == 1) {
    //     var alertPopup = $ionicPopup.alert({
    //       title: $translate.instant('create-snapshot-text'),
    //       template: $translate.instant('successful-message-create-snapshot-text')
    //     });
    //     $state.transitionTo($state.current, $state.$current.params, {reload: true});
    //   }
    // }

    // Delete Snapshot Volumes
    self.DeleteSnapshot = function (snapshotId) {
      //self.poolSuccessCode = 0;

      self.snapshotId = snapshotId;

      // var cancelText = $translate.instant('cancel-text');
      // var popupConfirmationTitle = $translate.instant('delete-snapshot-text');

      self.deleteActionsPopup = $ionicPopup.confirm({
          title: $translate.instant('delete-snapshot-text'),
          template: $translate.instant('snapshot-selection-text'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
      });

      self.deleteActionsPopup.then(function (res) {

        if (res) {
          self.deleteActionsPopup.close();
          $ionicLoading.show({templateUrl: 'templates/loading.html'});

          var reqSnapshotDelete = {
            method: 'DELETE',
            url: 'https://api.profitbricks.com/rest/snapshots/' + self.snapshotId
          };

          SSLValidatedAPICall.ProcessHTTPRequest(reqSnapshotDelete).then(function sucessCallback(response) {

            var done = false;
            PollService.Start(response.headers('Location'), function (result) {

              if (result.data.metadata.status == 'DONE' && !done) {
                  done = true;
                  PollService.Stop();
                  $ionicLoading.hide();

                // self.poolSuccessCode++;
                  // self.showSuccessPopUpSingleTime();
                  var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('delete-snapshot-text'),
                    template: $translate.instant('successful-message-delete-snapshot-text')
                  });

                alertPopup.then(function(res) {
                  $state.transitionTo($state.current, $state.$current.params, {reload: true});
                });

              }
            });
          }, function errorCallback(response) {
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('snapshot-lists-text'),
                template: $translate.instant('error-message-delete-snapshot-text')
              });
            });
        }
        else {
            self.deleteActionsPopup.close();
            $ionicLoading.hide();
        }
      });
    };

    // self.showSuccessPopUpSingleTime = function (){
    //   if(self.poolSuccessCode == 1)
    //   {
    //     var alertPopup = $ionicPopup.alert({
    //       title: $translate.instant('delete-snapshot-text'),
    //       template: $translate.instant('successful-message-delete-snapshot-text')
    //     });
    //     $state.transitionTo($state.current, $state.$current.params, {reload: true});
    //   }
    // }

    // Restore Snapshot from Storage Lists
    self.RestoreSnapshot = function (snapshotId) {

      self.snapshotId = snapshotId;

      $ionicLoading.show({templateUrl: 'templates/loading.html'});

      angular.forEach(self.datacenters, function(dvalue, dkey) {
      var theDataCenter = $filter('filter')(self.datacenters, {id: dvalue.id})[0];

      var reqVolumes = {
        method: 'GET',
        url: dvalue.entities.volumes.href + "?depth=5"
        };

        SSLValidatedAPICall.ProcessHTTPRequest(reqVolumes).then(function sucessCallback(response) {

          //self.numberOfStorages += response.data.items.length;
          theDataCenter.volumes = response.data.items;
          $ionicLoading.hide();
          //self.servers.push.apply(self.servers, response.data.items);

        }, function errorCallback(response) {
          $ionicLoading.hide();
          var alertPopup = $ionicPopup.alert({
            title: $translate.instant('storages-text'),
            template: $translate.instant('error-message-storage-list-text')
          });
        });
        $ionicLoading.hide();
      });

      self.volumeActionsPopup =  $ionicPopup.show({
        templateUrl: 'templates/pop-up/listof-storages-popup.html',
        title: $translate.instant('storages-text'),
        scope: $scope,
        buttons: [
          { text: $translate.instant('cancel-text') }
        ]
      });
      // $ionicLoading.hide();
    };

    // PopUp Options for Restore Snapshot
    self.ShowSnapshotActionsPopup = function (datacenterId, volumeId, snapshotId) {

      self.volumeActionsPopup.close();

      var popupStorageTitle = $translate.instant('attach-confrim-question');
      var cancelText = $translate.instant('cancel-text');

      // var confirmPopup;
      // var popupConfirmationTitle = $translate.instant('restore-snapshot-storage-text');

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
            url: 'https://api.profitbricks.com/rest/datacenters/' + datacenterId + '/volumes/' + volumeId + '/restore-snapshot?depth=1',
            data: {'snapshotId': encodeURI(snapshotId)},
            headers: {
              'Content-Type': "application/x-www-form-urlencoded"
            }
          };

          SSLValidatedAPICall.ProcessHTTPRequest(reqSnapshotRestore).then(function sucessCallback(response) {

          self.volumeActionsPopup.close();
          var done = false;
          PollService.Start(response.headers('Location'), function (result) {

            if (result.data.metadata.status == 'DONE' && !done) {
              done = true;
              PollService.Stop();
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('snapshot-lists-text'),
                template: $translate.instant('successful-message-restore-snapshot-text')
              });
              $state.transitionTo($state.current, $state.$current.params, {reload: true});
            }
          });

          }, function errorCallback(response) {
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('snapshot-lists-text'),
                template: $translate.instant('snapshot-list-not-fetch-text')
              });
          });
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
