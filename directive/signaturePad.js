
'use strict';

var myApp = angular.module('App');


myApp.directive('signaturepad', function() {
        var base64Prefix = 'data:image/png;base64,';

        return {
            restrict: 'E',
            require: 'ngModel',
            scope: {
                model: '=ngModel'
            },
            template: '<div class="signaturePad"><span ng-click="clear()" class="close">&#x2715</span><canvas width="555"></canvas></div>',
            replace: 'true',
            link: function(scope, element, attrs, modelCtrl) {
                var signaturePad = new SignaturePad(element.find('canvas')[0], {
                    backgroundColor: 'white',
                    onEnd: setViewValue
                });

                function setViewValue() {
                    var dataString = signaturePad.toDataURL();
                    scope.$apply(function () {
                        modelCtrl.$setViewValue({
                            date: new Date(),
                            data: dataString.replace(base64Prefix, '')
                        });
                    });
                }

                // Update the signature pad on programmatic model changes
                scope.$watch('model', function (value) {
                    if (!value || !value.data || Object.keys(value).length === 0) {
                        modelCtrl.$setValidity('signaturePad', false, element);
                        signaturePad.clear();
                        return;
                    }
                    modelCtrl.$setValidity('signaturePad', true, element);
                    signaturePad.fromDataURL(base64Prefix + value.data);
                });

                scope.clear = function() {
                    modelCtrl.$setViewValue({});
                    signaturePad.clear();
                };
            }
        };
    });
