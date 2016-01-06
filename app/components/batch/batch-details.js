'use strict';

angular
    .module('conceptRequestServiceApp.batch')
    .controller('BatchDetailsCtrl', [
        '$rootScope',
        '$filter',
        '$routeParams',
        '$location',
        'ngTableParams',
        'batchService',
        'requestService',
        'notificationService',
        'accountService',
        'CRS_ROLE',
        function ($rootScope, $filter, $routeParams, $location, ngTableParams, batchService, requestService, notificationService, accountService, CRS_ROLE) {
            var vm = this;

            var initView = function () {
                //$rootScope.pageTitles = ['Batch Details', $routeParams.batchId];
                initBreadcrumb();

                loadBatchSummary($routeParams.batchId);
            };

            var initBreadcrumb = function () {
                var currentPathUrl = '#' + $location.path();
                var foundCurrentPath = false,
                    foundBatchesNode = false,
                    currentPathIndex = 0;

                for (var i = 0; i < $rootScope.pageTitles.length; i++) {
                    if ($rootScope.pageTitles[i].url ) {
                        if ($rootScope.pageTitles[i].url === currentPathUrl) {
                            foundCurrentPath = true;
                            currentPathIndex = i;
                        }

                        if ($rootScope.pageTitles[i].url === '#/batches') {
                            foundBatchesNode = true;
                        }

                    }
                }

                if (!foundBatchesNode) {
                    $rootScope.pageTitles = [
                        {url: '#/batches', label: 'crs.batch.list.title'},
                        {url: currentPathUrl, label: $routeParams.batchId}
                    ];
                } else if (foundCurrentPath) {
                    $rootScope.pageTitles = $rootScope.pageTitles.slice(0, currentPathIndex + 1);
                } else {
                    $rootScope.pageTitles.push({
                        url: '#' + $location.path(),
                        label: $routeParams.batchId
                    });
                }
            };

            var loadBatchSummary = function (batchId) {
                batchService.getBatchSummary(batchId).then(function (response) {
                    vm.batchSummary = response;
                    console.log(vm.batchSummary);
                });
            };

            var editRequest = function (requestId) {
                $location.path('requests/edit/' + requestId).search({kb:true});
            };

            var requestTableParams = new ngTableParams({
                    page: 1,
                    count: 10,
                    sorting: {'requestHeader.requestDate': 'desc', batchRequest: 'asc', id: 'asc'}
                },
                {
                    filterDelay: 700,
                    getData: function (params) {
                        var sortingObj = params.sorting();
                        var sortFields = [], sortDirs = [];

                        if (sortingObj) {
                            angular.forEach(sortingObj, function (dir, field) {
                                sortFields.push(field);
                                sortDirs.push(dir);
                            });
                        }

                        return batchService.getBatch($routeParams.batchId, params.page() - 1, params.count(), params.filter().search, sortFields, sortDirs).then(function (requests) {
                            params.total(requests.total);
                            if (requests.items && requests.items.length > 0) {
                                /*if (!vm.batchHeader) {
                                    vm.batchHeader = requests.items[0].requestHeader;
                                    vm.batchHeader.batchRequest = requests.items[0].batchRequest;
                                }*/

                                return requests.items;
                            } else {
                                return [];
                            }
                        }, function () {
                            return [];
                        });
                    }
                }
            );


            vm.tableParams = requestTableParams;
            vm.batchSummary = null;
            vm.editRequest = editRequest;

            initView();
        }
    ]);