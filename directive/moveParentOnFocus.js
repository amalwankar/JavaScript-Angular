
'use strict';

var myApp = angular.module('App');

  myApp.directive('moveParentOnFocus', function () {
      return {
          restrict: 'A',
          link: function postLink(scope, element, attrs) {
              // Find the immediate container for the element
              var parentDiv = element.parent();

              element.on('focus', function () {
                  // Add the class to move it up
                  parentDiv.addClass('move');
                  //parentDiv.removeClass('wrapper');
              });
          }
      };
  });
