
'use strict';

var myApp = angular.module('App');

myApp.directive('typeahead', ['$parse', '$timeout', '$compile', '$sce', function ($parse, $timeout, $compile, $sce) {

        var dropdownTemplate = function (listString, filterString, canAdd) {
            return '<div class="dropdown" ng-class="{open: hasFocus && (items.length || loading || hasCustomValue)}">'
                + '    <ul class="typeahead dropdown-menu">'
                + '        <li ng-show="!loading" ng-repeat="' + listString + ' in items" ng-class="{active: $index==selectedIndex }" ng-mouseenter="$parent.selectedIndex = $index">'
                + '            <a tabindex="-1"  ng-bind-html="highlight(' + filterString + ')"></a>'
                + '        </li>'
                + '        <li ng-show="loading" class="no-highlight">'
                + '             <a><span class="spinner"></span> Loading...</a>'
                + '        </li>'
                + '        <li ng-show="hasCustomValue && !loading && items.length == 0" class="no-highlight">'
                + (canAdd ? '<a tabindex="-1">Create new entry "{{predicate}}"</a>' : '<a tabindex="-1">No items matched your query</a>')
                + '        </li>'
                + '    </ul>'
                + '</div>';
        };

        return {
            require: 'ngModel',
            scope: true,
            link: function (scope, element, attrs, modelCtrl) {
                scope.loading = false;
                scope.predicate = '';
                scope.canAdd = !!attrs.onAdd;
                var dropdownEl = null;

                var newEntry = function (m) {
                    // Save the entry using the passed in callback
                    if (scope.canAdd) {
                        return $parse(attrs.onAdd)(scope.$parent)(m);
                    }
                };

                function ensureDropdownPresent() {
                    if (!dropdownEl) {
                        dropdownEl = $compile(dropdownTemplate(match[2], match[1], scope.canAdd))(scope);
                        element.after(dropdownEl);
                        scope.selectedIndex = 0;
                    }
                }

                //Initialize scope
                var selectCallback = function (m) {
                    if (scope.canAdd && !m) {
                        m = newEntry(scope.predicate);
                    }

                    scope.hasFocus = false;
                    scope.hasCustomValue = false;
                    scope.items = [];
                    $parse(attrs.ngModel).assign(scope.$parent, m);
                };

                scope.select = function (index) {
                    selectCallback();
                };

                var makeSelection = function () {
                    ensureDropdownPresent();
                    selectCallback(scope.items[scope.selectedIndex]);

                };

                //Track events on the input
                element.on('keydown', function (evt) {
                    var action = {
                        40: function () {
                            ensureDropdownPresent();
                            scope.selectedIndex = (scope.selectedIndex + 1) % scope.items.length;
                            return false;
                        },
                        //Up
                        38: function () {
                            ensureDropdownPresent();
                            scope.selectedIndex = (scope.selectedIndex - 1 + scope.items.length) % scope.items.length;
                            return false;
                        },
                        //Enter
                        13: function () {
                            makeSelection();
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                        },
                        //Tab
                        9: makeSelection,
                        //Escape
                        27: function () {
                            return false;
                        }
                    }[evt.which];

                    if (scope.items && scope.items.length && angular.isFunction(action)) {

                        if (scope.$apply(action) === false) {
                            evt.preventDefault();
                        } else {
                            //element[0].blur();
                        }
                    }
                }).on('focusout', function (evt) {
                    ensureDropdownPresent();
                    if (dropdownEl[0].contains(evt.relatedTarget)) {
                        var index = angular.element(evt.relatedTarget).scope().$index;
                        selectCallback(scope.items[index]);
                    }
                    scope.$apply(function () { scope.hasFocus = false; });
                }).on('focus', function (evt) {
                    element[0].select();
                    scope.$apply(function () { scope.hasFocus = true; });
                });

                //                                 0000011100000000000000222222222222222000000033000000000000444444
                var match = attrs.typeahead.match(/^\s*(.*?)\s+for\s+([\$\w][\$\w\d]*)\s+in\s+(.*) show ([0-9]+)(.*)$/);
                if (!match) throw new Error(
                        "Expected typeahead specification in form of '_format_ for _item_ in _collection_ show _number_'" +
                        " but got '" + attrs.typeahead + "'.");

                var source = $parse(match[3] + ' | filter:predicate| limitTo:' + match[4]);
                var inputFormatScope = scope.$new();

                modelCtrl.$formatters.unshift(function (modelValue) {
                    if (modelValue) {
                        inputFormatScope[match[2]] = modelValue;
                        var result = inputFormatScope.$eval(match[1]);
                        return result;
                    } else {
                        element.attr({ readonly: false, tabindex: 0 });
                    }
                });

                var current, next, requestNum = 0;

                function performNextAction(queryString) {
                    next = queryString;
                    var seqNumber = ++requestNum;
                    if (!current) {
                        current = next;
                        next = null;
                        scope.loading = true;
                        scope.items = [];

                        $timeout(function () {
                            if (seqNumber < requestNum) {
                                prepForNext();
                                return;
                            }
                            scope.items = source(scope);
                            prepForNext();
                        }, 300);
                    }

                    function prepForNext() {
                        scope.loading = !!next;
                        current = null;
                        if (next)
                            performNextAction(next);

                    }
                }

                function processHtmlNode(valNode, inputValue) {
                    Array.prototype.forEach.call(valNode.childNodes, function (node) {
                        if (node.nodeType == 3) //text
                        {
                            var stringValue = node.nodeValue;
                            var indexOfMatch = node.nodeValue.toLowerCase().indexOf(inputValue.toLowerCase());
                            var text = '';
                            if (indexOfMatch >= 0) {
                                text = stringValue.substr(0, indexOfMatch);

                                var highlightedNode = document.createElement('strong');
                                highlightedNode.innerText = stringValue.substr(indexOfMatch, inputValue.length);

                                var newNode = document.createElement('span');

                                newNode.appendChild(document.createTextNode(stringValue.substr(0, indexOfMatch)));
                                newNode.appendChild(highlightedNode);
                                newNode.appendChild(document.createTextNode(stringValue.substr(indexOfMatch + inputValue.length)));

                                valNode.replaceChild(newNode, node);
                            }

                        } else {
                            processHtmlNode(node, inputValue);
                        }
                    });
                }

                //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
                //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
                modelCtrl.$parsers.push(function (inputValue) {
                    scope.predicate = inputValue;
                    if (inputValue && inputValue.length >= 1) {
                        scope.highlight = function (val) {
                            var valNode = document.createElement('div');
                            valNode.innerHTML = val;
                            processHtmlNode(valNode, inputValue);
                            return $sce.trustAsHtml(valNode.innerHTML);
                        };
                        ensureDropdownPresent();
                        performNextAction(inputValue);
                    } else {
                        scope.items = [];
                    }
                    var formattedVal = $parse(attrs.ngModel)(scope);
                    scope.hasCustomValue = inputValue && inputValue != formattedVal;
                    return formattedVal;
                });
            }
        };
    }]);
