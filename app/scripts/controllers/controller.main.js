'use strict';

/**
 * @ngdoc function
 * @name ticketscanner.controller:MainController
 * @description
 * # MainController
 */
angular.module('app')

.config(function($stateProvider) {
    $stateProvider
        .state('app', {
            url: '/app',
            abstract: true,
            templateUrl: 'templates/main.html',
            controller: 'MainController',
            resolve: {
                AppSettingPromise: function(AppApi, APP_SETTING) {
                    return AppApi.getAppSetting().then(function(doc) {
                        // set debug to control log etc.
                        APP_SETTING.DEBUG = doc.DEBUG;
                        APP_SETTING.META_DATA = doc.META_DATA;
                        return doc;
                    });
                }
            }
        });
})

.controller('MainController', function(AppDebug, AppHelper, AppCache, AppApi, APP_EVENT, AppSettingPromise, $scope, $state) {
    AppDebug.log('MainController');
});
