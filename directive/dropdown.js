

'use strict';


var myApp = angular.module('App');

myApp.directive('dropdown', function () {
      return {
          restrict: 'A',
          link: function postLink(scope, element, attrs) {
              var links = element.find('ul')[0];
              links.style.display = 'none';

              element.on('click', function () {
                  element.toggleClass('active');
                  links.style.display = links.style.display ? '' : 'none';
              });

              element.on('blur', function () {
                  setTimeout(function () {
                      links.style.display = 'none';
                  }, 200);
              });
          }
      };
  });
