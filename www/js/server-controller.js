angular.module('datacenterManager.controllers')
  .controller('ServerController', function (DemoFactory, PopUpService, $scope, $http, $state, $filter, $q, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, $translate, UserData, PollService, SSLValidatedAPICall) {

    $ionicNavBarDelegate.showBackButton(true);

    var self = this;

    DemoFactory.SetScope($scope);

    self.serverId = UserData.GetServerSelectedId();
    self.serverName = UserData.GetServerSelectedName();
    self.datacenterId = UserData.GetDatacenterSelectedId();
    self.datacenterName = UserData.GetDatacenterSelectedName();

    //self.poolSuccessCode = 0;

    $scope.cores = 0;
    $scope.ram = 0;



    var reqServerRetrieve = {

      method: 'GET',
      url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId + '?depth=5'
    };

    $ionicLoading.show({templateUrl: 'templates/loading.html'});

    SSLValidatedAPICall.ProcessHTTPRequest(reqServerRetrieve).then(function sucessCallback(response) {

      self.singleServerData = response.data;
      UserData.SetSelectedServer(response.data);
      UserData.SetServerSelectedAttachedVolumes(response.data.entities.volumes.items);
      $scope.cores = self.singleServerData.properties.cores;
      $scope.ram = self.singleServerData.properties.ram;

      // We have found the server status is Off
      if (self.singleServerData.properties.vmState =='SHUTOFF') {
        self.statusCheck = $translate.instant('offline-text');
        self.buttonStatusCheck = $translate.instant('start-text');
      }
      else // We have found the server status is On
      {
        self.statusCheck = $translate.instant('online-text');
        self.buttonStatusCheck = $translate.instant('stop-text');
      }

      // for showing the network properties for this server
      var nicsRetrieve = {
        method: 'GET',
        url: self.singleServerData.entities.nics.href + "?depth=5"
      };

      SSLValidatedAPICall.ProcessHTTPRequest(nicsRetrieve).then(function sucessCallback(response) {

        self.nics = response.data.items;
        $ionicLoading.hide();
        /*var nicRetrieve = {
          method: 'GET',
          url: response.data.items[0].href
        };

        $http(nicRetrieve).then(function sucessCallback(response) {
          self.nic = response.data;
          $ionicLoading.hide();

        }, function errorCallback(response) {
            $ionicLoading.hide();
        });*/

      }, function errorCallback(response) {
          $ionicLoading.hide();
      });

    }, function errorCallback(response) {

      var alertPopup = $ionicPopup.alert({
        title: $translate.instant('server-text'),
        template: $translate.instant('no-server-retrieve-text')
      });
      $ionicLoading.hide();
    });

    // retrieve this server
    self.RetrieveServer = function (serverId) {

        var reqServerRetrieve = {

          method: 'GET',
          url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + self.serverId
        };

        $ionicLoading.show({templateUrl: 'templates/loading.html'});

      SSLValidatedAPICall.ProcessHTTPRequest(reqServerRetrieve).then(function sucessCallback(response) {

          self.singleServerData = response.data;
          UserData.SetSelectedServer(response.data);
          if(response.data.entities.volumes.items != undefined) {
              UserData.SetServerSelectedAttachedVolumes(response.data.entities.volumes.items);
          }
          $scope.cores = self.singleServerData.properties.cores;
          $scope.ram = self.singleServerData.properties.ram;

        // We have found the server status is Off
        if (self.singleServerData.properties.vmState =='SHUTOFF') {

          self.statusCheck = $translate.instant('offline-text');
          self.buttonStatusCheck = $translate.instant('start-text');
        }
        else // We have found the server status is On
        {
          self.statusCheck = $translate.instant('online-text');
          self.buttonStatusCheck = $translate.instant('stop-text');
        }

          $ionicLoading.hide();
        }, function errorCallback(response) {

            var alertPopup = $ionicPopup.alert({
              title: $translate.instant('server-text'),
              template: $translate.instant('no-server-retrieve-text')
            });

            $ionicLoading.hide();
        });
    }

    // Start or Stop Server activities
    self.ShowStartStopServerPopup = function (serverId, isServerRunning) {

      var action = (isServerRunning) ? 'stop' : 'start';

      var confirmPopup;

      if (action == 'start') {
          confirmPopup = $ionicPopup.confirm({
            title: $translate.instant('server-text'),
            template: $translate.instant('start-server-question-text'),
            cancelText: $translate.instant('no-text'),
            okText: $translate.instant('yes-text')
          });
      }
      else {
          confirmPopup = $ionicPopup.confirm({
            title: $translate.instant('server-text'),
            template: $translate.instant('stop-server-question-text'),
            cancelText: $translate.instant('no-text'),
            okText: $translate.instant('yes-text')
          });
      }

      confirmPopup.then(function (res) {
          if (res) {

            $ionicLoading.show({templateUrl: 'templates/loading.html'});

            var reqServerStartOrStop = {
              method: 'POST',
              url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + serverId + '/' + action
            };


            SSLValidatedAPICall.ProcessHTTPRequest(reqServerStartOrStop).then(function sucessCallback(response) {

              var done = false;
              PollService.Start(response.headers('Location'), function (result) {

                //console.log("Response from poll: " + result.data.metadata.status);

                if (result.data.metadata.status == 'DONE' && !done) {
                    done = true;
                    self.RetrieveServer(serverId);
                    PollService.Stop();
                    $ionicLoading.hide();
                }
              });
            }, function errorCallback(response) {
                  $ionicLoading.hide();
                  var alertPopup = $ionicPopup.alert({
                    title: $translate.instant('server-text'),
                    template: $translate.instant('no-server-retrieve-text')
                  });
              });
          } else {
              $ionicLoading.hide();
          }
      });
    };

    // Restart Server activities
    self.ShowRebootServerPopup = function (serverId) {

      self.poolSuccessCode = 0;

        var confirmPopup = $ionicPopup.confirm({
          title: $translate.instant('server-text'),
          template: $translate.instant('reboot-server-question-text'),
          cancelText: $translate.instant('no-text'),
          okText: $translate.instant('yes-text')
        });

        confirmPopup.then(function (res) {

        if (res)
        {
          var reqServerRestart = {
            method: 'POST',
            url: 'https://api.profitbricks.com/rest/datacenters/' + self.datacenterId + '/servers/' + serverId + '/reboot'
          };

          $ionicLoading.show({templateUrl: 'templates/loading.html'});

          SSLValidatedAPICall.ProcessHTTPRequest(reqServerRestart).then(function sucessCallback(response) {

            var done = false;
            PollService.Start(response.headers('Location'), function (result) {

              if (result.data.metadata.status == 'DONE' && !done)
              {
                done = true;
                self.RetrieveServer(serverId);
                PollService.Stop();
                $ionicLoading.hide();
                // self.poolSuccessCode++;
                // self.showSuccessPopUpSingleTime();
                var alertPopup = $ionicPopup.alert({
                  title: $translate.instant('server-text'),
                  template: $translate.instant('success-message-server-reboot-text')
                });
              }
            });
          },
          function errorCallback(response) {
              $ionicLoading.hide();
              var alertPopup = $ionicPopup.alert({
                title: $translate.instant('server-text'),
                template: $translate.instant('error-message-server-reboot-text')
              });
          });

        }
        else {
          $ionicLoading.hide();
        }
      });
    };

    // self.showSuccessPopUpSingleTime = function (){
    //   if(self.poolSuccessCode == 1)
    //   {
    //     var alertPopup = $ionicPopup.alert({
    //       title: $translate.instant('server-text'),
    //       template: $translate.instant('success-message-server-reboot-text')
    //     });
    //   }
    // }

    // go to volume lists by clicking it
    self.ShowVolumeLists = function () {
    //   UserData.SetVolumeSelectedName(volumeName);
    //   UserData.SetVolumeSelectedId(volumeId);
      // $state.go('app.storages');
      $state.transitionTo('app.storages', {}, {reload: true});
    }


    if(DemoFactory.GetSSLStatus() === false)
    {
      PopUpService.ShowSSLPopUp();
    }

})
