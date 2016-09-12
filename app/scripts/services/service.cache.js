'use strict';

angular.module('app')

.factory('AppCache', function(AppDebug, AppHelper, APP_SETTING, $q, pouchDB) {

    var dbOptions = {
            revs_limit: 1,
            auto_compaction: true, // https://github.com/pouchdb/pouchdb/issues/4987
            adapter: 'websql', // https://github.com/angular-pouchdb/angular-pouchdb/issues/105
        },
        appDb = pouchDB('ticketscanner', dbOptions),
        userDb = null,
        service = {
            // document _id or _id prefix
            DOC: {
                APP_SETTING: 'app_setting',
                APP_LOCAL_SETTING: 'app_local_setting',
                APP_USER: 'app_user',
                FILE: 'fid_',
                LOCAL_SETTING: 'local_setting',
            },
        },

        // general get with debug log
        dbGet = function(db, docId, options, callback) {
            if (typeof(options) !== 'object') {
                options = {};
            }

            if (typeof(callback) !== 'function') {
                callback = function() {};
            }

            return db.get(docId, options, callback).then(function(doc) {
                AppDebug.log(['Loaded: ', docId, doc]);
                return doc;
            }).catch(function(err) {
                AppDebug.log(['Load fail: ', docId, err]);
                throw err;
            });
        },

        // general put with debug log and detect create or update
        dbPut = function(db, doc, options, callback) {
            if (typeof(options) !== 'object') {
                options = {};
            }

            if (typeof(callback) !== 'function') {
                callback = function() {};
            }

            return dbGet(db, doc._id).then(function(_doc) {
                // update doc
                doc._rev = _doc._rev;
                return db.put(doc, options, callback).then(function(dbResult) {
                    AppDebug.log(['Updated: ', doc]);
                    return dbResult;
                });
            }).catch(function(err) {
                // create doc
                AppDebug.log(['Created: ', doc]);
                return db.put(doc, options, callback);
            });
        },

        dbMerge = function(db, doc, options, callback) {
            if (typeof(options) !== 'object') {
                options = {};
            }

            if (typeof(callback) !== 'function') {
                callback = function() {};
            }

            return dbGet(db, doc._id).then(function(_doc) {
                // update doc
                doc._rev = _doc._rev; // avoid rev replace
                var mergedDoc = AppHelper.lodash.merge(_doc, doc);
                return db.put(mergedDoc, options, callback).then(function(dbResult) {
                    AppDebug.log(['Merged: ', mergedDoc]);
                    return dbResult;
                });
            }).catch(function(err) {
                // create doc
                AppDebug.log(['Created: ', doc]);
                return db.put(doc, options, callback);
            });
        },

        // general remove with debug log and detect exist or not
        dbRemove = function(db, docId, options, callback) {
            if (typeof(options) !== 'object') {
                options = {};
            }

            if (typeof(callback) !== 'function') {
                callback = function() {};
            }

            return dbGet(db, docId).then(function(doc) {
                // remove doc
                return db.remove(doc, options, callback).then(function(dbResult) {
                    AppDebug.log(['Removed: ', doc]);
                    return dbResult;
                });
            }).catch(function(err) {
                if (err && err.status == 404) {
                    // ignore not found
                    AppDebug.log(['Not found: ', docId]);
                    return;
                } else {
                    // fail
                    AppDebug.log(['Remove fail: ', err]);
                    throw err;
                }
            });
        },

        // general get file with debug log
        dbGetFile = function(db, fileId, options, callback) {
            if (typeof(options) !== 'object') {
                options = {};
            }
            options.attachments = true;

            if (typeof(callback) !== 'function') {
                callback = function() {};
            }

            var docId = service.DOC.FILE + fileId;
            return dbGet(db, docId, options, callback).then(function(doc) {
                AppDebug.log(['Loaded file: ', docId]);
                var result = {
                    _id: doc._id,
                    _rev: doc._rev,
                    id: doc.id,
                    updated_at: doc.updated_at,
                };
                if (doc._attachments && doc._attachments[docId]) {
                    result.file_mime = doc._attachments[docId].content_type;
                    result.file_blob = doc._attachments[docId].data;
                }
                return result;
            }).catch(function(err) {
                AppDebug.log(['Load file fail: ', docId, err]);
                throw err;
            });
        },

        // general put file  with debug log and detect create or update
        dbPutFile = function(db, fileDoc, options, callback) {
            if (typeof(options) !== 'object') {
                options = {};
            }

            if (typeof(callback) !== 'function') {
                callback = function() {};
            }

            var fileId = fileDoc.id,
                docId = service.DOC.FILE + fileId,
                doc = {
                    _id: docId,
                    id: fileDoc.id,
                    updated_at: fileDoc.updated_at,
                    _attachments: {}
                };
            doc._attachments[docId] = {
                content_type: fileDoc.file_mime,
                data: fileDoc.file_blob
            }
            return dbGet(db, doc._id).then(function(_doc) {
                // update doc
                doc._rev = _doc._rev;
                return db.put(doc, options, callback).then(function(dbResult) {
                    AppDebug.log(['Updated file: ', docId]);
                    return dbResult;
                });
            }).catch(function(err) {
                // create doc
                AppDebug.log(['Created file: ', docId]);
                return db.put(doc, options, callback);
            });
        };

    // App Db general operations
    service.appGet = function(docId, options, callback) {
        return dbGet(appDb, docId, options, callback);
    };

    service.appPut = function(doc, options, callback) {
        return dbPut(appDb, doc, options, callback);
    };

    service.appMerge = function(doc, options, callback) {
        return dbMerge(appDb, doc, options, callback);
    };

    service.appRemove = function(docId, options, callback) {
        return dbRemove(appDb, docId, options, callback);
    };

    service.appGetFile = function(fileId, options, callback) {
        return dbGetFile(appDb, fileId, options, callback);
    };

    service.appPutFile = function(fileDoc, options, callback) {
        return dbPutFile(appDb, fileDoc, options, callback);
    };

    // User Db general operations
    service.getUserDb = function() {
        var q = $q.defer();

        if (userDb !== null) {
            q.resolve(userDb);
        } else {
            service.appGet(service.DOC.APP_USER).then(function(doc) {
                if (doc.id) {
                    userDb = pouchDB('ticketscanner_' + doc.id, dbOptions);
                    q.resolve(userDb);
                } else {
                    q.reject('Not able to Initialize user db due to invalid user id');
                }
            }).catch(function(err) {
                q.reject(err);
            });
        }

        return q.promise;
    };

    service.destroyUserDb = function() {
        var q = $q.defer();

        if (userDb === null) {
            q.resolve(userDb);
        } else {
            userDb.destroy().then(function() {
                userDb = null;
                q.resolve(userDb);
            }).catch(function(err) {
                q.reject(err);
            });
        }

        return q.promise;
    };


    service.userGet = function(docId, options, callback) {
        return service.getUserDb().then(function(db) {
            return dbGet(db, docId, options, callback);
        });
    };

    service.userPut = function(doc, options, callback) {
        return service.getUserDb().then(function(db) {
            return dbPut(db, doc, options, callback);
        });
    };

    service.userMerge = function(doc, options, callback) {
        return service.getUserDb().then(function(db) {
            return dbMerge(db, doc, options, callback);
        });
    };

    service.userRemove = function(docId, options, callback) {
        return service.getUserDb().then(function(db) {
            return dbRemovet(db, docId, options, callback);
        });
    };

    service.userGetFile = function(fileId, options, callback) {
        return service.getUserDb().then(function(db) {
            return dbGetFile(db, fileId, options, callback);
        });
    };

    service.userPutFile = function(fileDoc, options, callback) {
        return service.getUserDb().then(function(db) {
            return dbPutFile(db, fileDoc, options, callback);
        });
    };

    /**
     * Application functions start from here
     */
    service.getAppUser = function() {
        return service.appGet(service.DOC.APP_USER).then(function(doc) {
            return doc;
        }).catch(function(err) {
            return {
                _id: service.DOC.APP_USER
            };
        });
    };

    service.removeAppUser = function(keepSettings) {
        // keep current user's db for all personal settings or not
        if (keepSettings) {
            // invalidate current user's db (not remove);
            userDb = null;
            return service.appRemove(service.DOC.APP_USER);
        } else {
            // remove current user's db
            return service.destroyUserDb().then(function(doc) {
                return service.appRemove(service.DOC.APP_USER).then(function() {
                    // remove app local settings
                    return service.appRemove(service.DOC.APP_LOCAL_SETTING);
                });
            });
        }
    };

    // app level local settings
    service.getAppLocalSetting = function() {
        return service.appGet(service.DOC.APP_LOCAL_SETTING).then(function(doc) {
            return doc;
        }).catch(function(err) {
            return {
                _id: service.DOC.APP_LOCAL_SETTING
            };
        });
    };

    // user level local settings
    service.getUserLocalSetting = function() {
        return service.userGet(service.DOC.LOCAL_SETTING).then(function(doc) {
            return doc;
        }).catch(function(err) {
            return {
                _id: service.DOC.LOCAL_SETTING
            };
        });
    };

    return service;
});
