'use strict';

/**
 * @ngdoc function
 * @name ticketscanner.controller:HomeController
 * @description
 * # HomeController
 */
angular.module('app')

.config(function($stateProvider) {
    $stateProvider
        .state('app.home', {
            url: '/home',
            cache: false,
            templateUrl: 'templates/views/home.html',
            controller: 'HomeController'
        });
})

.controller('HomeController', function(AppDebug, AppHelper, AppCache, AppApi, AppSettingPromise, $scope, $state) {
    AppDebug.log('HomeController');

    AppCache.getAppLocalSetting().then(function(appLocalSetting) {
        $state.go('app.login');
    });
});
