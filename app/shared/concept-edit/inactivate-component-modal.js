/*jshint newcap:false*/
'use strict';

angular.module('conceptRequestServiceApp.conceptEdit')
    .controller('inactivateComponentModalCtrl', [
        '$scope',
        '$uibModalInstance',
        '$filter',
        'NgTableParams',
        'snowowlService',
        'componentType',
        'reasons',
        'associationTargets',
        'conceptId',
        'branch',
        '$routeParams',
        function ($scope, $uibModalInstance, $filter, NgTableParams, snowowlService, componentType, reasons, associationTargets, conceptId, branch) {

            // required arguments
            $scope.componentType = componentType;
            $scope.reasons = reasons;

            // optional arguments (but if conceptId or branch specified, the other must
            // be as well)
            $scope.conceptId = conceptId;
            $scope.branch = branch;
            $scope.associationTargets = associationTargets;

            // check requirements
            if ($scope.conceptId && !$scope.branch) {
                $scope.error = 'Branch was not specified';
            }
            if ($scope.branch && !$scope.conceptId) {
                $scope.error = 'Concept id was not specified';
            }
            if (!$scope.reasons) {
                $scope.error = 'List of inactivation reasons was not specified';
            }
            $scope.getConceptsForTypeahead = function (searchStr) {
                return snowowlService.findConcepts(null, null, searchStr, 0, 20).then(function (response) {
                    for (var i = 0; i < response.length; i++) {
                        console.debug('checking for duplicates', i, response[i]);
                        for (var j = response.length - 1; j > i; j--) {
                            if (response[j].concept.conceptId === response[i].concept.conceptId) {
                                console.debug(' duplicate ', j, response[j]);
                                response.splice(j, 1);
                                j--;
                            }
                        }
                    }
                    return response;
                });
            };

            $scope.selectReason = function () {

                // NOTE: associationTarget is optional
                if (!$scope.reason) {
                    window.alert('You must specify a reason for inactivation');
                } else {

                    var associationTarget = {};

                    // FORMAT: associationTargets: {MOVED_FROM: ["139569002"]}
                    // validate and convert association targets
                    for (var i = 0; i < $scope.associations.length; i++) {
                        // extract association for convenience
                        var association = $scope.associations[i];

                        console.debug('processing association', association);

                        // if neither type nor concept specified
                        if (!association.type && !association.concept) {
                            console.debug('blank association, ignoring');
                        }

                        // if either field is blank, alert and return
                        else if (!association.type || !association.concept) {
                            window.alert('You must specify both the association type and target');
                            return;
                        }

                        // add the association type/target
                        else {

                            console.debug('adding association', association, associationTarget.hasOwnProperty(association.type));

                            // if this type already specified, add to array
                            if (associationTarget.hasOwnProperty(association.type.id)) {
                                console.debug('adding to existing array', associationTarget.type);
                                associationTarget[association.type.id].push(association.concept.concept.conceptId);
                            }

                            // otherwise, set this type to a single-element array containing
                            // this concept
                            else {
                                console.debug('inserting new type');
                                associationTarget[association.type.id] = [association.concept.concept.conceptId];
                            }
                        }
                    }

                    var results = {};
                    results.reason = $scope.reason;
                    results.associationTarget = associationTarget;
                    console.debug('select result', results);

                    $uibModalInstance.close(results);
                }
            };

// on load, retrieve children and descendants if concept specified
            if ($scope.conceptId && $scope.branch) {

                // limit the number of descendants retrieved to prevent overload
                snowowlService.getConceptDescendants(null, null, $scope.conceptId, 0, 200).then(function (response) {
                    console.debug('descendants', response);

                    $scope.descendants = response;
                    $scope.descendantsLoading = false;
                    $scope.tableParamsDescendants.reload();
                });
            }

// get a single inbound relationship to get total number of relationships
            snowowlService.getConceptRelationshipsInbound(null, null, $scope.conceptId, 0, 0).then(function (response) {
                console.debug('inbound', response);

                // get the concept relationships again (all)
                snowowlService.getConceptRelationshipsInbound(null, null, $scope.conceptId, 0, response.total).then(function (response2) {

                    // temporary array for preventing duplicate children
                    var childrenIds = [];

                    // initialize the arrays
                    $scope.inboundRelationships = [];
                    $scope.children = [];

                    // ng-table cannot handle e.g. source.fsn sorting, so extract fsns and
                    // make top-level properties
                    angular.forEach(response2.inboundRelationships, function (item) {

                        console.debug('checking relationship', item.active, item);

                        if (item.active) {
                            item.sourceFsn = item.source.fsn;
                            item.typeFsn = item.type.fsn;

                            // if a child, and not already added (i.e. prevent STATED/INFERRED
                            // duplication), push to children
                            if (item.type.id === '116680003' && childrenIds.indexOf(item.source.id) === -1) {
                                childrenIds.push(item.source.id);
                                $scope.children.push(item);
                                $scope.inboundRelationships.push(item);
                            } else {
                                $scope.inboundRelationships.push(item);
                            }
                        }
                    });

                    $scope.inboundRelationshipsLoading = false;

                    $scope.tableParamsChildren.reload();
                    $scope.tableParamsInboundRelationships.reload();

                });

            });


            $scope.tableParamsChildren = new NgTableParams({
                    page: 1,
                    count: 10,
                    sorting: {sourceFsn: 'asc'},
                    orderBy: 'sourceFsn'
                },
                {
                    total: $scope.children ? $scope.children.length : 0, // length of data
                    getData: function ($defer, params) {

                        if (!$scope.children || $scope.children.length === 0) {
                            $defer.resolve([]);
                        } else {

                            params.total($scope.children.length);
                            var childrenDisplayed = params.sorting() ? $filter('orderBy')($scope.children, params.orderBy()) : $scope.children;

                            $defer.resolve(childrenDisplayed.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                        }

                    }
                }
            );

            $scope.tableParamsDescendants = new NgTableParams({
                    page: 1,
                    count: 10,
                    sorting: {fsn: 'asc'},
                    orderBy: 'fsn'
                },
                {
                    total: $scope.descendants ? $scope.descendants.items.length : 0, // length
                    // of
                    // data
                    getData: function ($defer, params) {

                        if (!$scope.descendants || $scope.descendants.length === 0) {
                            $defer.resolve([]);
                        } else {

                            params.total($scope.descendants.items.length);
                            var descendantsDisplayed = params.sorting() ? $filter('orderBy')($scope.descendants.items, params.orderBy()) : $scope.descendants.items;

                            $defer.resolve(descendantsDisplayed.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                        }

                    }
                }
            );

            $scope.tableParamsInboundRelationships = new NgTableParams({
                    page: 1,
                    count: 10,
                    sorting: {sourceFsn: 'asc'},
                    orderBy: 'sourceFsn'
                },
                {
                    total: $scope.inboundRelationships ? $scope.inboundRelationships.length : 0, // length of
                    // data
                    getData: function ($defer, params) {

                        if (!$scope.inboundRelationships || $scope.inboundRelationships.length === 0) {
                            $defer.resolve([]);
                        } else {

                            params.total($scope.inboundRelationships.length);
                            var inboundRelationshipsDisplayed = params.sorting() ? $filter('orderBy')($scope.inboundRelationships, params.orderBy()) : $scope.inboundRelationships;
                            $defer.resolve(inboundRelationshipsDisplayed.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                        }
                    }
                }
            );

            $scope.cancel = function () {
                $uibModalInstance.dismiss();
            };


            $scope.addAssociation = function () {
                $scope.associations.push({type: null, concept: null});
            };

            $scope.removeAssociation = function (index) {
                $scope.associations.slice(index, 1);
                if ($scope.associations.length === 0) {
                    $scope.addAssociation();
                }
            };

            ////////////////////////////////////
            // Initialization
            ////////////////////////////////////

            // selected reason
            $scope.reason = null;

            // construct the associations array and add a blank row
            $scope.associations = [];
            $scope.addAssociation();

            // loading flags
            $scope.descendantsLoading = true;
            $scope.inboundRelationshipsLoading = true;


        }]
);
