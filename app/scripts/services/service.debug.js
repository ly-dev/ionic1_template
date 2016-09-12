'use strict';

angular.module('app')

.factory('AppDebug', function(APP_SETTING) {

    var service = {};

    service.shallowStringify = function(obj, depth, onlyProps, skipTypes) {
        if (typeof(depth) === 'undefined') {
            depth = 0;
        } else {
            depth++;
        }

        var objType = typeof(obj);

        if (['function', 'undefined'].indexOf(objType) >= 0) {
            return objType;
        } else if (['string'].indexOf(objType) >= 0) {
            var l = obj.length;
            if (l > 200) { // avoid long string
                return obj.substr(0, 20) + ' ...' + l + ' ...' + obj.substr(l-20);
            } else {
                return obj;
            }
        } else if (['number', 'boolean'].indexOf(objType) >= 0) {
            return obj; // will toString
        } else if (obj === null) {
            return '[null]';
        } else if (typeof obj.eventPhase !== 'undefined') {
            // ignore event
            return '[event obj]';
        }

        // objType == 'object'
        var res = '{';
        for (var p in obj) { // property in object
            if (typeof(onlyProps) !== 'undefined' && onlyProps) {
                // Only show property names as values may show too much noise.
                // After this you can trace more specific properties to debug
                res = res + p + ', ';
            } else {
                var valType = typeof(obj[p]);
                if (typeof(skipTypes) === 'undefined') {
                    skipTypes = ['function'];
                }
                if (skipTypes.indexOf(valType) >= 0) {
                    res = res + p + ': [' + valType + '], ';
                } else {
                    res = res + p + ': ';

                    // max allow 7 levels
                    if (depth < 7) {
                        res = res + service.shallowStringify(obj[p], depth);
                    } else {
                        res = res + (typeof obj[p] === 'object' ? '[object]' : (typeof obj[p] === 'function' ? '[function]' : obj[p]));
                    }

                    res = res + ', ';
                }
            }
        }
        res = res + '}';
        return res;
    };

    service.toMessage = function(obj) {
        var objType = typeof(obj),
            msg = '';

        if (['function', 'undefined'].indexOf(objType) >= 0) {
            msg = objType;
        } else if (['string', 'number', 'boolean'].indexOf(objType) >= 0) {
            msg = obj;
        } else {
            if (!angular.isArray(obj)) {
                obj = [obj];
            }

            for (var i in obj) {
                msg = msg + service.shallowStringify(obj[i]) + '\n';
            }
        }

        return msg;
    };

    service.log = function(obj) {
        if (APP_SETTING.DEBUG) {
            console.log(service.toMessage(obj));
        }
    };

    return service;
});
