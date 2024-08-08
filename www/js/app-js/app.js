angular.module('datacenterManager', ['ionic', 'datacenterManager.controllers', 'datacenterManager.services', 'pascalprecht.translate', 'angular.filter', 'ngSanitize'])

  .run(function ($ionicPlatform, $state, $rootScope, $ionicPopup, $translate) {

    $ionicPlatform.ready(function () {

      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
        if(window.Connection) {
          if(navigator.connection.type == Connection.NONE) {
            event.preventDefault();
            $ionicPopup.alert({
              title: $translate.instant('app-no-internet-title-text'),
              template: $translate.instant('app-no-internet-details-text')
            });
          }
        }
      })

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleLightContent();
      }
    });

    $ionicPlatform.registerBackButtonAction(function() {
      if ($state.current.name == "app.datacenters" || $state.current.name == "login.firstStartLanguage" || $state.current.name == "login.firstStartCredentials" || $state.current.name == "login.setAppCode") {
        navigator.app.exitApp();
      } else {
        navigator.app.backHistory();
      }
    }, 100);
  })

  .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider, $translateProvider) {

    $ionicConfigProvider.backButton.previousTitleText(false).text('');

    $translateProvider.useStaticFilesLoader({prefix: 'locales/', suffix: '.json'});

    $translateProvider.preferredLanguage('en');
    $translateProvider.fallbackLanguage('en');
    $translateProvider.useSanitizeValueStrategy('sanitize');

     //Centers the title for all OS
    $ionicConfigProvider.navBar.alignTitle("center");
    $stateProvider

    // setup an abstract state for the login directive
      .state('login', {
        url: '/login',
        abstract: true,
        templateUrl: 'templates/login.html'
      })

      .state('login.firstStartLanguage', {
        url: '/firstStartLanguage',
        cache: false,
        views: {
          'login-firstStartLanguage': {
            templateUrl: 'templates/language-and-termscondition-layout.html',
            controller: 'LanguageAndTermsconditionsController as FSLang'
          }
        }
      })

      .state('login.firstStartCredentials', {
        url: '/firstStartCredentials',
        cache: false,
        views: {
          'login-firstStartLanguage': {
            templateUrl: 'templates/login-with-credentails-layout.html',
            controller: 'LoginWithCredentailsController as FSCreds'
          }
        }
      })

      .state('login.setAppCode', {
        url: '/setAppCode',
        cache: false,
        params: {
          resetAppCode: false,
        },
        views: {
          'login-firstStartLanguage': {
            templateUrl: 'templates/login-with-pincode-layout.html',
            controller: 'LoginWithPincodeController as appCodeCtrl'
          }
        }
      })

      .state('app', {
        url: '/app',
        //cache: false,
        abstract: true,
        templateUrl: 'templates/sliding-menu/sliding-menu-layout.html'
      })

      .state('app.allServers', {
        url: '/allServers',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/sliding-menu/sliding-menu-listof-servers-layout.html',
            controller: 'MenuServerListsCtrl as allServerCtrl'
          }
        }
      })

      .state('app.allStorages', {
        url: '/allStorages',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/sliding-menu/sliding-menu-listof-storages-layout.html',
            controller: 'MenuStorageListsCtrl as allStorageCtrl'
          }
        }
      })

      .state('app.datacenters', {
        url: '/datacenters',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/listof-datacenters-layout.html',
            controller: 'ListofDatacentersController as datacenterCtrl'
          }
        }
      })

      .state('app.servers', {
        url: '/servers',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/listof-servers-layout.html',
            controller: 'ListofServersController as dashServersCtrl'
          }
        }
      })

      .state('app.singleServer', {
        url: '/singleServer',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/server-layout.html',
            controller: 'ServerController as singleServerCtrl'
          }
        }
      })

      .state('app.storages', {
        url: '/storages',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/listof-storages-layout.html',
            controller: 'ListofStoragesController as storagesCtrl'
          }
        }
      })

      .state('app.singleStorage', {
        url: '/singleStorage',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/storage-layout.html',
            controller: 'StorageController as singleStorageCtrl'
          }
        }
      })

      .state('app.snapshots', {
        url: '/snapshots',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/sliding-menu/sliding-menu-listof-snapshot-layout.html',
            controller: 'ListofSnapshotsController as snapshotCtrl'
          }
        }
      })

      .state('app.settings', {
        url: '/settings',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/sliding-menu/sliding-menu-settings-layout.html',
            controller: 'SettingsController as settingsCtrl'
          }
        }
      })

      .state('app.about', {
        url: '/about',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/sliding-menu/sliding-menu-about-layout.html',
            controller: 'AboutController as aboutCtrl'
          }
        }
      })

      .state('app.help', {
        url: '/help',
        cache: false,
        views: {
          'menuContent': {
            templateUrl: 'templates/sliding-menu/sliding-menu-help-layout.html',
            controller: 'HelpController as helpCtrl'
          }
        }
      })
;
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login/firstStartLanguage');
  })

  .directive('onlyDigits', function () {
    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, element, attr, ctrl) {
        function inputValue(val) {
          if (val) {
            var digits = val.replace(/[^0-9]/g, '');

            if (digits !== val) {
              ctrl.$setViewValue(digits);
              ctrl.$render();
            }
            return parseInt(digits,10);
          }
          return undefined;
        }
        ctrl.$parsers.push(inputValue);
      }
    }
  })

  .service( 'HardwareBackButtonManager', function($ionicPlatform){

    this.deregister = undefined;

    this.disable = function(){

      this.deregister = $ionicPlatform.registerBackButtonAction(function(e){
      e.preventDefault();

      return false;

      }, 101);
    }
    return this;
  })

  .filter('bylocation', function () {
    return function (dataArray, locations) {
        var items = {
            locations: locations,
            out: []
        };
        angular.forEach(dataArray, function (value, key) {
            if (this.locations[value.properties.location] === true) {
                this.out.push(value);
            }
        }, items);
        return items.out;
    };
  })

  .directive('ngEnter', function() {
    return function(scope, element, attrs) {
      element.bind("keydown keypress", function(event) {
        if(event.which === 13) {
          scope.$apply(function(){
            scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
      });
    };
  })

  .directive('focusOn', function() {
    return function(scope, elem, attr) {
      scope.$on(attr.focusOn, function(e) {
          elem[0].focus();
      });
    };
  })
;
