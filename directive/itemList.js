

'use strict';


var myApp = angular.module('App');

myApp.directive('itemList', function () {
    return {
      replace: true,
      restrict: 'E',
      template: '<ul><li item-list-item ng-repeat="item in items"></li></ul>',
      scope: {
        items: "="
      },
      link: function postLink(scope, element, attrs){
      }
    };
  })
  .directive('itemListItem', function($compile){
    return {
        template: '<span class="title">{{item.id}} - {{item.description}}</span><span ng-show="canExclude()"><input type="checkbox" ng-model="item.exclude">Exclude?</span> <button class="delete-button" ng-click="clearAllTransfers()">&times;</button>',
        restrict: 'A',
      link: function postLink(scope, element, attrs){
          scope.canExclude = function () {
              if (scope.item.statusCode !== 'I') return false;
              if (scope.item.isRoot && !scope.item.hasChildren) return false;
              return true;
          }
          scope.clearAllTransfers = function(){
              scope.items.forEach(function (item) {
                  item.onTransfer = false;
              });
          }
        if (angular.isArray(scope.item.childItems)) {
            element.append('<item-list items="item.childItems"></item-list>');
          $compile(element.contents())(scope)
        }
        element.find('button').on('click', function(event){
          event.stopPropagation();
          event.preventDefault();
          // This will delete the object that you're clicking on.
          scope.$apply(function(){
            scope.$parent.items.splice(scope.$index, 1);
          });
        })
      }
    }
  });