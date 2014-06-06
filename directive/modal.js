
'use strict'

//So far, all this directive needs to do is add click handlers to the footer buttons
//To hide the modal upon click
var myApp = angular.module('App');

myApp.directive('modal', function () {
    return {
        require: 'modal',
        controller: ['$scope', '$attrs', '$element', function ($scope, $attrs, $element) {
            var backdrop = angular.element($element[0].getElementsByClassName('modal-backdrop')[0]);

            this.hide = function () {
                backdrop.removeClass('in');
                $element.removeClass('in').attr('aria-hidden', true);
            }

            this.show = function (val) {
                backdrop.addClass('in')
                $element.addClass('in').attr('aria-hidden', false);
            };
        }],
        link: function (scope, el, attr, modalCtrl) {
          scope.$watch(attr.modal, function (newVal) {
            if (newVal) {
              modalCtrl.show();
            } else {
              modalCtrl.hide();
            }
          });
            el.addClass('modal fade');
        }
    };
}).directive('modalButton', function () {
    return {
        require: '^modal',
        link: function (scope, el, attr, cntrl) {
            el.on('click', function () {
                cntrl.hide();
            })
        }
    };
}).directive('popup', function () {
    return function (scope, el, attrs) {
        el.on('click', function () {
            scope.$apply(function () {
                angular.element(document.getElementById(attrs.popup)).controller('modal').show();
            });
        });
    };
});