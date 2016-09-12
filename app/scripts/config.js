'use strict';

/**
 * @ngdoc constant
 * @name config
 * @description
 * The app configuration collection. It contains:
 * the token replaced during build
 * the constants used in the app
 */

angular.module('app')

// global constant
.constant('APP_SETTING', {
    /*REPLACE*/APP_VERSION: 'x.x.x'/*REPLACE*/ ,
    /*REPLACE*/API_SERVER_URL: 'http://lyionic:8100'/*REPLACE*/ ,
    /*REPLACE*/DEBUG: true/*REPLACE*/,
    API_PATH: '/api/v1',
    HTTP_TIMEOUT: 30000,
    META_DATA: {},
})

.constant('APP_EVENT', {
    HTTP_ERROR: 'HTTP_ERROR',
});
