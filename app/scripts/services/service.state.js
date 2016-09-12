'use strict';

angular.module('app')

.factory('AppState', function(AppDebug, AppHelper, $rootScope, $state) {

    var currentState = {}, // current state
        historyStates = [], // navigation history states
        service = {};

    AppDebug.log('Register state change error event listener');
    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        AppDebug.log(['State change error: ', error, '; ', fromState, '(', fromParams, ') to ', toState, '(', toState, ')']);
    });

    AppDebug.log('Register state change start event listener');
    $rootScope.$on('$stateChangeStart', function(event, unfoundState, fromState, fromParams) {
        AppDebug.log(['State change success: ', fromState, '(', fromParams, ') to ', unfoundState]);

        // event.preventDefault();
        // transitionTo() promise will be rejected with
        // a 'transition prevented' error
    });

    AppDebug.log('Register state change success  event listener');
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        AppDebug.log(['State change success: ', fromState, '(', fromParams, ') to ', toState, '(', toParams, ')']);

        var historyLengh = historyStates.length;

        if ((historyLengh > 1) && (angular.equals(historyStates[historyLengh - 2], {
                'state': toState,
                'params': toParams
            }))) {
            historyStates.pop();
        } else {
            historyStates.push({
                'state': toState,
                'params': toParams
            });
        }

        historyLengh = historyStates.length;
        if (historyLengh > 0) {
            currentState = historyStates[historyLengh - 1];
        } else {
            currentState = null; // should not be here
        }

    });

    AppDebug.log('Register state not found event listener');
    $rootScope.$on('$stateNotFound', function(event, unfoundState, fromState, fromParams) {
        AppDebug.log(['State change success: ', fromState, '(', fromParams, ') to ', unfoundState]);
    });

    service.hasGoBack = function() {
        return historyStates.length > 1;
    };

    service.goBack = function() {
        var historyLengh = historyStates.length;

        if (historyLengh > 1) {
            $state.go(historyStates[historyLengh - 2].state, historyStates[historyLengh - 2].params);
        }
    };

    service.getCurrentState = function() {
        return currentState;
    };

    return service;
});
