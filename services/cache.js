(function () {
    'use strict';

    angular.module('fieldpdp')
        .service('cache', function ($rootScope, $q) {
            var self = this;
            var db = null;
            var dbVersion = (new Date()).getUTCFullYear();
            var dbName = "fieldPdpApp",
                storeName = "assessments",
                cacheStoreName = "cache";

            // In memory version of the cache that is updated
            // so that controllers can watch the collection
            self.assessments = [];

            function openAsync() {
                var deferred = $q.defer();
                if (db !== null) return $q.when(db);
                var request = indexedDB.open(dbName, dbVersion);
                request.onsuccess = function (e) {
                    db = e.target.result;
                    deferred.resolve(e.target.result);
                };

                request.onerror = function (e) {
                    console.log("IndexDB error: ", e.message);
                    deferred.reject();
                };

                request.onupgradeneeded = function (e) {
                    var db = e.target.result;

                    if (db.objectStoreNames.contains(storeName)) {
                        db.deleteObjectStore(storeName);
                    }
                    var objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                    objectStore.createIndex("status", "status", { unique: false });
                    objectStore.createIndex("type", "type", { unique: false });

                    // Create a generic store for caching requests
                    if (db.objectStoreNames.contains(cacheStoreName)) {
                        db.deleteObjectStore(cacheStoreName);
                    }
                    db.createObjectStore(cacheStoreName);
                };

                return deferred.promise;
            }

            self.getAssessmentsAsync = function (filter) {
                var deferred = $q.defer();

                openAsync().then(function (db) {
                    var trans = db.transaction([storeName], "readonly");
                    var store = trans.objectStore(storeName);
                    var cursorRequest;

                    var items = [];

                    trans.oncomplete = function () {
                        if (!filter) {
                            // Copy the unfilitered collection
                            // to the in memory cache
                            $rootScope.$apply(function() {
                                angular.copy(items, self[storeName]);
                            });
                        }
                        
                        deferred.resolve(items);
                    };

                    if (filter) {
                        var key;
                        for (var k in filter) {
                            key = k;
                            break;
                        }
                        var index = store.index(key);
                        cursorRequest = index.openCursor(IDBKeyRange.only(filter[key]));
                    }
                    else {
                        cursorRequest = store.openCursor();
                    }

                    cursorRequest.onsuccess = function (event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            items.push(cursor.value);
                            cursor.continue();
                        }
                    };

                    cursorRequest.onerror = function (e) {
                        console.log("error fetching all assessments", e);
                        deferred.reject();
                    };
                });

                return deferred.promise;
            };

            self.getAssessment = function (id) {
                /*jshint eqeqeq:false */ // reason: id may be a string, so we want a truthy comparison
                var item = self[storeName] && self[storeName].filter(function (m) { return m.id == id; });
                return item && item.length ? item[0] : null;
            };

            self.deleteAsync = function (item) {
                var deferred = $q.defer();

                openAsync().then(function (db) {
                    var trans = db.transaction([storeName], "readwrite");
                    var store = trans.objectStore(storeName);

                    var existingItem = self.getAssessment(item.id);
                    var index = self[storeName].indexOf(existingItem);

                    store.delete(item.id).onsuccess = function () {
                        self[storeName].splice(index, 1);
                        deferred.resolve();
                        $rootScope.$apply();
                    };
                });

                return deferred.promise;
            };

            self.saveAssessmentAsync = function (item) {
                var deferred = $q.defer();

                openAsync().then(function (db) {
                    var trans = db.transaction([storeName], "readwrite");
                    var store = trans.objectStore(storeName);

                    var existingItem = self.getAssessment(item.id);
                    if (!existingItem) {
                        var existingItemIndex = self[storeName].push(item) - 1;
                        existingItem = self[storeName][existingItemIndex];
                    } else if (existingItem !== item) {
                        angular.copy(item, existingItem);
                    }

                    // Put is an add or update operation
                    store.put(item).onsuccess = function (event) {
                        $rootScope.$apply(function() {
                            existingItem.id = event.target.result;
                        });
                        deferred.resolve(existingItem);
                    };
                });

                return deferred.promise;
            };

            self.setItem = function(key, value) {
                var deferred = $q.defer();
                console.log('Setting item [' + key + '] with value ' + JSON.stringify(value) + ' in cache.');
                openAsync().then(function (db) {
                    var trans = db.transaction([cacheStoreName], "readwrite");
                    var objectStore = trans.objectStore(cacheStoreName);

                    // Put is an add or update operation
                    var req = objectStore.put(value, key);
                    req.onsuccess = function () {
                        deferred.resolve(value);
                    };
                    req.onerror = function () {
                        console.log("Error in cache.setItem(): '", req.error.name);
                        deferred.reject();
                    };
                });

                return deferred.promise;
            };

            self.getItem = function(key) {
                var deferred = $q.defer();
                console.log('Fetching item ['+ key + '] from cache');
                openAsync().then(function (db) {
                    var trans = db.transaction([cacheStoreName], "readonly");
                    var objectStore = trans.objectStore(cacheStoreName);

                    var req = objectStore.get(key);
                    req.onsuccess = function () {
                        deferred.resolve(req.result);
                    };
                    req.onerror = function() {
                        console.log("Error in cache.getItem(): '", req.error.name);
                        deferred.reject();
                    };
                });

                return deferred.promise;
            };
    });
})();