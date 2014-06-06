(function() {
    'use strict';

    angular.module('fieldpdp')
        .factory('retryPolicy', function($q, $timeout) {
            var failedRequests = [];

            function retryFailedRequests() {
                while (failedRequests && failedRequests.length > 0) {
                    executeAction(failedRequests.pop());
                }
            }

            function executeAction(action) {
                var maxTries = 3;
                var tries = 0;

                return (function execute() {
                    var request = action();

                    if (request.hasOwnProperty('then')) {
                        return request.then(function(response) {
                            //Everytime a request succeeds, retry the failed requests
                            retryFailedRequests();
                            return response;
                        }, function (response) {
                            if (response !== 0) return response;
                            // Try again
                            if (++tries >= maxTries) {
                                failedRequests.push(action);
                                return $q.reject(response);
                            }
                            console.log("Retrying request. Try #" + tries);
                            return $timeout(function() {
                                return execute(action);
                            }, Math.exp(tries) * 1000);
                        });
                    }

                    return $q.reject("Not a promise.");
                })();
            }

            return {
                executeAction: executeAction
            };
        });
})();