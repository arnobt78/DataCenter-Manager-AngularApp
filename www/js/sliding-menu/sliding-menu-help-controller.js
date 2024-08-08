angular.module('datacenterManager.controllers')
  .controller('HelpController', function ($scope, $http, $state, $q, $translate, $ionicScrollDelegate, $ionicNavBarDelegate, $ionicPopup, $ionicLoading, UserData, $filter, $ionicPopover, PollService)
  {

    $ionicNavBarDelegate.showBackButton(true);
    var self = this;

    self.searchTextofHelp = '';

    $scope.searchText = function () {
      $scope.$broadcast('searchFinished');
      // self.popover.hide();
      $ionicScrollDelegate.scrollTop();
      window.cordova.plugins.Keyboard.close();
    }

    self.questionandanswer = {
      question: '',
      answer: ''
    };

    self.questionandanswers = [
      {
        question: $translate.instant('question-1-text'),
        answer: $translate.instant('answer-1-text')
      },
      {
        question: $translate.instant('question-2-text'),
        answer: $translate.instant('answer-2-text')
      },
      {
        question: $translate.instant('question-3-text'),
        answer: $translate.instant('answer-3-text')
      },
      {
        question: $translate.instant('question-4-text'),
        answer: $translate.instant('answer-4-text')
      },
      {
        question: $translate.instant('question-5-text'),
        answer: $translate.instant('answer-5-text')
      },
      {
        question: $translate.instant('question-6-text'),
        answer: $translate.instant('answer-6-text')
      },
    ];

    // showing more info by using accordion
    self.toggleGroup = function(datacenter) {
      if (self.isGroupShown(datacenter)) {
        self.shownGroup = null;
        $ionicScrollDelegate.scrollTop();
      } else {
        self.shownGroup = datacenter;
        $ionicScrollDelegate.scrollTop();
      }
    };
    
    self.isGroupShown = function(datacenter) {
      return self.shownGroup === datacenter;
      $ionicScrollDelegate.scrollTop();
    };

  })
