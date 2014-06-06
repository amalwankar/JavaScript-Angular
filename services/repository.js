(function() {
    'use strict';

    angular.module('fieldpdp')
        .service('repository', function($http, $q, cache, SERVER_URL, retryPolicy, network) {
            var self = this;
            
            self.getEmployeeId = function (forceRefresh, user) {
                return get('/pdp/get_employeeId', forceRefresh, {loginName: user});
            };

            self.getRigs = function(forceRefresh, employeeId) {
                return get('/grms/rigs', forceRefresh);
            };

            self.getRigsForEmployee = function (forceRefresh, employeeId) {

                var defer = $q.defer();

                if (!network.isConnected()) {
                    defer.resolve(null);
                    return defer.promise;
                }

                $http({
                    method: 'GET',
                    url: SERVER_URL + '/grms/rigsForEmployee?employeeId=' + employeeId
                })
                .success(function (data, status, headers, config) {
                    defer.resolve(data);
                }).error(function (data, status, headers, config) {
                    var results = [];
                    results.data = data;
                    results.headers = headers;
                    results.status = status;
                    results.config = config;

                    defer.reject(results);
                });

                return defer.promise;
            };

            self.getCrewList = function(rigName, forceRefresh) {
                return get('/grms/crew_list/' + rigName, forceRefresh);
            };

            self.getPositions = function(forceRefresh) {
                return get('/pdp/positions', forceRefresh);
            };

            self.getLocations = function(forceRefresh) {
                return get('/pdp/locations', forceRefresh);
            };

            self.getQuestions = function(forceRefresh) {
                return get('/pdp/questions', forceRefresh);
            };

            self.getPreviousScore = function(employeeId) {
                var defer = $q.defer();

                if (!network.isConnected()) {
                    defer.resolve(null);
                    return defer.promise;
                }

                $http({
                    method: 'GET',
                    url: SERVER_URL + '/pdp/assessments/' + employeeId + '/previous_score'
                })
                    .success(function (data, status, headers, config) {
                        console.log("HTTP request success (" + config.url + ").");
                        defer.resolve(data);
                    }).error(function (data, status, headers, config) {
                        console.log("HTTP request failed (" + config.url + ").");
                        defer.resolve(null);
                    });

                return defer.promise;

            };

            self.checkDuplicates = function (employeeId, cycle) {
                var defer = $q.defer();

                if (!network.isConnected()) {
                    defer.resolve(null);
                    return defer.promise;
                }

                $http({
                    method: 'GET',
                    url: SERVER_URL + '/pdp/check_for_duplicate',
                    params: { employeeId: employeeId, cycle: cycle.date.toJSONString() }
                })
                    .success(function (data, status, headers, config) {
                        console.log("HTTP request success (" + config.url + ").");
                        defer.resolve(status);
                    }).error(function (data, status, headers, config) {
                        console.log("HTTP request failed (" + config.url + ").");
                        defer.resolve(status);
                    });

                return defer.promise;

            };

            self.getApprovals = function(user, forceRefresh) {
                return get('/pdp/assessments', forceRefresh, { managerUsername: user }).then(function(assessments) {
                    if (!assessments) return;
                    for (var i = 0, length = assessments.length; i < length; i++) {
                        var assessment = assessments[i];
                        if (typeof assessment.id === 'string' && assessment.id.indexOf('_sp') >= 0) continue;
                        assessment.status = "Pending Approval";
                        assessment._id = assessment.id;
                        assessment.id = '_sp' + assessment.id;
                        assessment.type = "Approval";

                        var existingItem = cache.getAssessment(assessment.id);
                        if (existingItem && existingItem.status !== 'Submitted') {
                            assessment.status = existingItem.status;
                        }
                        cache.saveAssessmentAsync(assessment);
                    }
                    return cache.getAssessmentsAsync({ status: 'Pending Appoval' });
                });
            };

            self.submitApproval = function(assessment) {
                if (!network.isConnected()) return;
                var id = assessment._id;
                return retryPolicy.executeAction(function() {
                    assessment.status = "Sending";
                    return cache.saveAssessmentAsync(assessment).then(function() {
                        return $http.put(SERVER_URL + '/pdp/review_assessment/' + id);
                    }).then(function() {
                        console.log('Request to mark assessment ' + id + ' as reviewed has succeeded');
                        assessment.status = "Submitted";
                        assessment.assessment.supervisor.reviewedDate = new Date;
                        return cache.saveAssessmentAsync(assessment);
                    }).catch(function(response) {
                        console.log('Request to mark assessment ' + id + ' as reviewed has failed with status ' + response.status);
                        assessment.status = "Error";
                        assessment.error = { code: response.status, message: response.data.message };
                        cache.saveAssessmentAsync(assessment);

                        return $q.reject(response.status);
                    });
                });
            };

            self.submitAssessment = function(assessment) {
                if (!network.isConnected()) return;
                return retryPolicy.executeAction(function() {
                    assessment.status = "Sending";
                    return cache.saveAssessmentAsync(assessment).then(function() {
                        return $http.post(SERVER_URL + '/pdp/assessment', getDto(assessment));
                    }).then(function(data) {
                        console.log("HTTP post success (" + data.config.url + ").");
                        assessment.status = "Submitted";
                        return cache.saveAssessmentAsync(assessment);
                    }).catch(function(data) {
                        console.log("HTTP post failed (" + data.config.url + ").", data);
                        assessment.status = "Error";
                        assessment.error = { code: data.status, message: data.data.message };
                        cache.saveAssessmentAsync(assessment);

                        return $q.reject(data.status);
                    });
                });
            };

            self.queueAssessment = function(assessment) {
                assessment.status = "Queued";
                return cache.saveAssessmentAsync(assessment).then(function() {
                    self.submitQueue();
                });
            };

            self.submitQueue = function() {
                return cache.getAssessmentsAsync({ status: 'Queued' }).then(function (assessments) {
                    return assessments.forEach(function (assessment) {
                        if (assessment.type === "Approval") {
                            return self.submitApproval(assessment);
                        } else {
                            return self.submitAssessment(assessment);
                        }

                    });
                });
            };

            self.getDto = getDto;

            function get(relativeUrl, forceRefresh, parameters) {
                if (forceRefresh && typeof forceRefresh === "boolean" && network.isConnected()) {
                    return requestFromServer(relativeUrl, parameters);
                } else {
                    // Try to get from the cache
                    return requestFromCache(relativeUrl).then(function(cached) {
                        return cached || requestFromServer(relativeUrl, parameters);
                    });
                }
            }

            function requestFromServer(relativeUrl, parameters) {
                if (!network.isConnected()) return
                var defer = $q.defer();

                $http({ method: 'GET', url: SERVER_URL + relativeUrl, params: typeof parameters === "object" ? parameters : {} })
                    .success(function(data, status, headers, config) {
                        console.log("HTTP request success (" + config.url + ").");
                        cache.setItem(relativeUrl, data);
                        defer.resolve(data);
                    }).error(function(data, status, headers, config) {
                        console.log("HTTP request failed (" + config.url + ").");
                        // If the request fails, attempt to get a cached version
                        cache.getItem(relativeUrl).then(function(cached) {
                            defer.resolve(cached || null);
                        });
                    });

                return defer.promise;
            }

            function requestFromCache(relativeUrl) {
                return cache.getItem(relativeUrl);
            }

        });

    function getName(person) {
        return [person.firstName, person.middleName, person.lastName].filter(function (e) { return e; }).join(' ');
    }

    // Transform the scope object into the correct schema for posting to the server
    function getDto(model) {
        return {
            //title,
            employee: {
                id: model.employee.employeeNumber,
                firstName: model.employee.firstName,
                lastName: model.employee.lastName,
                middleName: model.employee.middleName,
                position: model.position.title
            },
            location: {
                region: model.region.name,
                site: model.site, 
                division: model.division.name,
                department: model.department.name,
            },
            assessment: {
                type: model.type === 1 ? "Employee Assessment (Field/Shop)" : "Front-Line Supervisor (Field/Shop)",
                date: model.assessment.date,
                cycle: model.cycle.date,
                questions: model.assessment.questions.map(function(question) {
                    return {
                        number: question.number,
                        descriptor: question.descriptor,
                        description: question.description,
                        statements: question.statements,
                        managerComments: question.managerComments,
                        employeeComments: question.employeeComments,
                        score: question.score
                    };
                }),
                supervisor: {
                    name: model.assessment.supervisor.name,
                    domainName: model.assessment.supervisor.domainName,
                    date: model.assessment.supervisor.date,
                    employeeDiscussed: model.assessment.employeeDiscussed,
                    employeeDiscipline: model.assessment.supervisor.employeeDiscipline,
                    disciplineComments: model.assessment.supervisor.employeeDiscipline && model.assessment.supervisor.disciplineComments,
                    supervisingYears: model.assessment.supervisor.supervisingYears,
                    supervisingMonths: model.assessment.supervisor.supervisingMonths,
                    isEmployeeDiscussed: model.assessment.supervisor.isEmployeeDiscussed
                },
                employeeAcknowledgement: {
                    signature: getName(model.employee),
                    date: model.assessment.employeeAcknowledgment.date
                },
                managerAcknowledgement: {
                    name: getName(model.assessment.managerAcknowledgment.signature),
                    signature: model.assessment.managerAcknowledgment.signature.employeeNumber,
                    date: model.assessment.employeeAcknowledgment.date
                }
            }
        };
    }
})();