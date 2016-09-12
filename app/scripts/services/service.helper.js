'use strict';

angular.module('app')

// collect method from ionic, ngCordova and other utils
.factory('AppHelper', function(AppDebug, APP_SETTING, $state, $q, $timeout, $window, $cordovaDevice, $cordovaNetwork, $ionicLoading, $ionicModal, $ionicPopover, $ionicPopup, $ionicTabsDelegate, $ionicScrollDelegate) {

    var timerQs = {},
        clientEnv = {},
        service = {
            ENV: {
                WEB: 'web',
                DEVICE: 'device'
            },
            lodash: $window._
        };

    // Context helper
    service.initEnvironment = function(type) {
        AppDebug.log('Initialize environment: ' + type);
        clientEnv.type = type;
    };

    service.getClientInfo = function() {
        if (!clientEnv.info) {
            var info = (clientEnv.type === service.ENV.WEB ? {
                'cordova': 'n/a',
                'model': (navigator ? navigator.userAgent : 'n/a'),
                'platform': service.ENV.WEB,
                'version': (navigator ? navigator.userAgent : 'n/a'),
                'uuid': 'n/a',
            } : $cordovaDevice.getDevice());

            info.app_version = APP_SETTING.APP_VERSION;
            info.network = (clientEnv.type === service.ENV.WEB ? service.ENV.WEB : $cordovaNetwork.getNetwork());
            info.window = service.getWindowSize();

            AppDebug.log(info);
            clientEnv.info = info;
        }

        return clientEnv.info;
    };

    service.getWindowSize = function() {
        return {
            innerWidth: $window.innerWidth,
            innerHeight: $window.innerHeight
        };
    };

    service.isWeb = function() {
        var info = service.getClientInfo();
        return (info.platform === service.ENV.WEB);
    };

    service.isIOS = function() {
        var info = service.getClientInfo();
        return (info.platform === 'iOS');
    };

    service.isAndroid = function() {
        var info = service.getClientInfo();
        return (info.platform === 'Android');
    };

    // Datetime helper
    service.getTimestamp = function() {
        if (!Date.now) {
            Date.now = function() {
                return new Date().getTime();
            };
        }
        return Date.now();
    };

    service.getTimestampLabel = function(t) {
        var d;
        if (t && typeof t === 'number') {
            d = new Date(t);
        } else {
            d = new Date();
        }

        return d.toLocaleString();
    };

    service.getLocaleDateString = function(t) {
        var d;
        if (t && typeof t === 'number') {
            d = new Date(t);
        } else {
            d = new Date();
        }

        return d.toLocaleDateString("en-GB");
    };

    // service.openWindow = function(config) {
    //     return (service.isWeb ?
    //         $window.open(config.url, config.name, config.specs, config.replace) :
    //         $window.open(config.url, config.name, config.specs, config.replace));
    // };

    // Alert and popup helper
    service.showHint = function(message) {
        return $ionicLoading.show({
            'template': message,
            'noBackdrop': false,
            'hideOnStateChange': true,
            'duration': 10000
        }).then(function() {
            angular.element(document).find('.loading-container').bind('click', function(e) {
                service.hideHint();
            });
        });
    };

    service.showHintThenGo = function(message, state, params, options) {
        service.showHint(message).then(function() {
            $timeout(function() {
                $state.go(state, params, options);
            }, 1000);
        });
    };

    service.hideHint = function() {
        return $ionicLoading.hide();
    };

    service.showLoading = function(config) {
        var defaultConfig = {
                template: '<ion-spinner icon="spiral"></ion-spinner>', //<ion-spinner icon="bubbles"></ion-spinner>',
                noBackdrop: true,
                hideOnStateChange: true
            },
            mergedConfig = service.lodash.merge(defaultConfig, (config ? config : {}));

        return $ionicLoading.show(mergedConfig);
    };

    service.hideLoading = function() {
        $ionicLoading.hide();
    };

    service.showAlert = function(config) {
        service.hideLoading();
        return $ionicPopup.alert(config);
    };

    service.showConfirm = function(config) {
        service.hideLoading();
        return $ionicPopup.confirm(config);
    };

    service.showPopup = function(config) {
        service.hideLoading();
        return $ionicPopup.show(config);
    };

    service.createModalFromTemplateUrl = function(templateUrl, options) {
        return $ionicModal.fromTemplateUrl(templateUrl, options);
    };

    service.createPopoverFromTemplateUrl = function(templateUrl, options) {
        return $ionicPopover.fromTemplateUrl(templateUrl, options);
    };

    service.getScrollHandler = function(handle) {
        return $ionicScrollDelegate.$getByHandle(handle);
    };

    // timer management
    service.createTimer = function(name, func, delay) {
        // cancel anyway
        service.cancelTimer(name);

        var timer = null;

        if (name && typeof func === 'function' && delay > 0) {
            timer = $timeout(func, delay);
            timerQs[name] = timer;
            AppDebug.log('Created timer: ' + name + '(' + delay + ')');
        }

        return timer;
    };

    service.cancelTimer = function(name) {
        if (name && timerQs[name]) {
            $timeout.cancel(timerQs[name]);
            delete timerQs[name];
            AppDebug.log('Cancelled timer: ' + name);
        }
    };

    // validate input
    service.validateInput = function(type, value, errors, key, message) {
        var error = null;

        switch (type) {
            case 'required':
                if (service.lodash.isEmpty(value)) {
                    error = (message ? message : 'missing ' + key);
                }
                break;
            case 'email':
                if (value && !(/^[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(value))) {
                    error = (message ? message : 'invalid email');
                }
                break;
            case 'year':
                if (value && !(/^\d{4}$/.test(value))) {
                    error = (message ? message : 'invalid year');
                }
                break;
            case 'number_or_percentage':
                if (value && !(/^(-)?\d+(\.\d)?(%)?$/.test(value))) {
                    error = (message ? message : 'invalid percentage');
                }
                break;
        }

        if (error) {
            errors[key] = error;
        }
    };

    service.errorsToMessage = function(errors, skipWrapper) {
        var message = '';

        angular.forEach(errors, function(value, key) {
            if (value) {
                if (service.lodash.isObject(value)) {
                    message += service.errorsToMessage(value, true);
                } else {
                    message += '<li>' + value + '</li>';
                }
            }
        });

        return (skipWrapper ? message : '<ul>' + message + '</ul>');
    };

    return service;
});
