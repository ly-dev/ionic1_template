'use strict';

/**
 * @ngdoc overview
 * @name ticketscanner
 * @description
 * # Initializes main application
 *
 * Main module of the application.
 */

angular.module('app', ['ionic', 'ngCordova', 'pouchdb'])

.config(function(APP_SETTING, $compileProvider, $animateProvider, $httpProvider, $urlRouterProvider, $ionicConfigProvider) {
    // disable debug mode
    $compileProvider.debugInfoEnabled(APP_SETTING.DEBUG);

    // only enable animate with prefix
    $animateProvider.classNameFilter(/animate-/);

    // register $http interceptors
    $httpProvider.interceptors.push('AppHttpResponseInterceptor');

    // redirects to default route for undefined routes
    $urlRouterProvider.otherwise('/app/home');

    // config ionic framework
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.views.maxCache(0);
    $ionicConfigProvider.views.transition('none');
})

.run(function(AppDebug, AppHelper, APP_EVENT, $rootScope, $state, $window, $ionicPlatform) {
    AppDebug.log('App Run');

    $ionicPlatform.ready(function() {
        AppDebug.log('Platform Ready');

        if ($window.cordova) {
            if ($window.cordova.plugins.Keyboard) {
                AppDebug.log('Hide the accessory bar above keyboard by default');
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if ($window.StatusBar) {
                AppDebug.log('org.apache.cordova.statusbar required');
                StatusBar.styleDefault();
            }

            if (cordova.InAppBrowser) {
                AppDebug.log('InAppBrowser is ready');
                $window.open = cordova.InAppBrowser.open;
            }

            AppHelper.initEnvironment(AppHelper.ENV.DEVICE);
        } else {
            AppHelper.initEnvironment(AppHelper.ENV.WEB);
        }
    });

    // global event handlers here
    AppDebug.log('Register HTTP_ERROR event listener');
    $rootScope.$on(APP_EVENT.HTTP_ERROR, function(event, response) {
        AppDebug.log(['Received event: HTTP ERROR', response]);
        if (response.status === 403 || response.status === 401) {
            $state.go('app.login');
        } else {
            AppHelper.showAlert({
                'title': 'Fail to talk with server',
                'template': 'Response status: ' + response.status,
            }).then(function() {
                // do something after OK
            });
        }
    });

    AppDebug.log('Register resume event listener');
    $rootScope.$on('resume', function(event) {
        AppDebug.log(['Received event:', event.type]);
    }, false);

    AppDebug.log('Register pause event listener');
    $rootScope.$on('pause', function(event) {
        AppDebug.log(['Received event:', event.type]);
    }, false);

});
