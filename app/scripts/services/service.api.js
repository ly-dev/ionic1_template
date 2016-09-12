'use strict';

angular.module('app')

.factory('AppHttpResponseInterceptor', function(AppDebug, APP_EVENT, $rootScope, $q) {
    return {
        response: function(response) { // success handler
            return response || $q.when(response);
        },
        responseError: function(response) { // error handler
            $rootScope.$broadcast(APP_EVENT.HTTP_ERROR, response);
            return $q.reject(response);
        }
    };
})

.factory('AppApi', function(AppDebug, AppHelper, AppCache, APP_SETTING, $q, $http, $window) {

    var apiBaseUrl = APP_SETTING.API_SERVER_URL + APP_SETTING.API_PATH,
        cancelRestApiQs = {},
        loggedInUser = null,
        service = {};

    service.callRestApi = function(method, uri, params) {
        var apiToken = null;

        return AppCache.getAppUser().then(function(appUser) {
            var cancelKey = AppHelper.getTimestamp(),
                cancelQ = $q.defer(),
                url = apiBaseUrl + uri,
                config = {
                    'method': method,
                    'url': url,
                    'data': params,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + appUser.api_token
                    },
                    timeout: (APP_SETTING.HTTP_TIMEOUT > 0 ? APP_SETTING.HTTP_TIMEOUT : cancelQ.promise) // set timeout milliseconds or promise
                };

            // store cancel q for external use
            cancelRestApiQs[cancelKey] = cancelQ;
            AppDebug.log(['Call backend start: ', config]);

            return $http(config).then(function(response) {
                AppDebug.log(['Call backend success: ', response]);
                if (cancelRestApiQs[cancelKey]) {
                    cancelRestApiQs[cancelKey].resolve('done rest api call');
                }
                delete cancelRestApiQs[cancelKey];
                return response;
            }).catch(function(err) {
                AppDebug.log(['Call backend error: ', err]);
                if (cancelRestApiQs[cancelKey]) {
                    cancelRestApiQs[cancelKey].reject('fail rest api call');
                }
                delete cancelRestApiQs[cancelKey];
                throw err;
            });
        });
    };

    service.cancelAllCallRestApi = function() {
        angular.forEach(cancelRestApiQs, function(q, k) {
            cancelRestApiQs[k].resolve('cancel rest api call');
            delete cancelRestApiQs[k];
        });
    };

    service.GET = function(uri, params) {
        return service.callRestApi('GET', uri, params).then(function(response) {
            return response.data;
        });
    };

    service.POST = function(uri, params) {
        return service.callRestApi('POST', uri, params).then(function(response) {
            return response.data;
        });
    };

    /**
     * Application functions start from here
     */
    service.process = function(action, params) {
        var uri = '/' + action;
        return service.POST(uri, params);
    };

    service.getAppSetting = function() {
        // try to get from server firstly
        return service.GET('', null).then(function(data) {
            // update cache
            var doc = AppHelper.lodash.merge(APP_SETTING, data, {
                _id: AppCache.DOC.APP_SETTING
            });
            return AppCache.appPut(doc).then(function(dbResult) {
                AppDebug.log('Use Api Value');
                return doc;
            });
        }).catch(function(err) {
            return AppCache.appGet(AppCache.DOC.APP_SETTING).then(function(doc) {
                AppDebug.log('Use Cached Value');
                return doc;
            }).catch(function(err) {
                AppDebug.log('Use Default Value');
                return APP_SETTING;
            });
        });
    };

    service.logout = function (keepSettings) {
        AppDebug.log('logout');
        loggedInUser = null;
        return AppCache.removeAppUser(keepSettings);
    };

    return service;
});
