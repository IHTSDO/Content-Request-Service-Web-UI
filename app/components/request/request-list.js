'use strict';

angular
    .module('conceptRequestServiceApp.request')
    .controller('RequestListCtrl', [
        '$filter',
        '$sce',
        'jiraService',
        'ngTableParams',
        'requestService',
        'notificationService',
        'accountService',
        'CRS_ROLE',
        'REQUEST_STATUS',
        function ($filter, $sce, jiraService, ngTableParams, requestService, notificationService, accountService, CRS_ROLE, REQUEST_STATUS) {
            var vm = this;

            var initView = function () {
                vm.selectedRequests = {checked: false, items: {}};
                vm.selectedSubmittedRequests = {checked: false, items: {}};

                // check admin role
                accountService.checkRoles([CRS_ROLE.ADMINISTRATOR, CRS_ROLE.MANAGER]).then(function (rs) {
                    vm.isAdmin = rs;

                    if (rs === true) {
                        vm.submittedTableParams = submittedTableParams;
                    }
                });

                // load authors
                loadAuthors();
            };

            var loadAuthors = function () {
                vm.loadingAuthors = true;
                return jiraService.getAuthorUsers(0, 50, true, []).then(function (users) {
                    vm.authors = users;

                    return users;
                }).finally(function () {
                    vm.loadingAuthors = false;
                });
            };

            var getAuthorName = function (authorKey) {
                if (!vm.authors || vm.authors.length === 0) {
                    return authorKey;
                } else {
                    for (var i = 0; i < vm.authors.length; i++) {
                        if (vm.authors[i].key === authorKey) {
                            //return vm.authors[i].displayName;
                            return $sce.trustAsHtml([
                                    '<img src="' + vm.authors[i].avatarUrls['16x16'] + '"/>',
                                    '<span style="vertical-align:middle">&nbsp;' + vm.authors[i].displayName + '</span>'
                            ].join(''));
                        }
                    }
                }
            };

            var removeSelectedRequests = function () {
                var selectedRequests = vm.selectedRequests,
                    removingRequestIds = [];
                if (selectedRequests &&
                    selectedRequests.items) {
                    angular.forEach(selectedRequests.items, function (isSelected, requestId) {
                        if (isSelected) {
                            removingRequestIds.push(requestId);
                        }
                    });

                    if (removingRequestIds.length > 0) {
                        if (window.confirm('Are you sure you want to remove ' + removingRequestIds.length +' Draft requests?')) {
                            requestService.removeRequests(removingRequestIds).then(function () {
                                if (vm.tableParams) {
                                    vm.tableParams.reload();
                                }
                            }, function (error) {
                                notificationService.sendMessage('crs.request.message.requestRemoved', 5000);
                            });
                        }
                    } else {
                        window.alert('Please select at least a Draft request.');
                    }
                }
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

                        notificationService.sendMessage('crs.request.message.listLoading');
                        return requestService.getRequests(params.page() - 1, params.count(), params.filter().search, sortFields, sortDirs).then(function (requests) {
                            params.total(requests.total);
                            if (requests.items && requests.items.length > 0) {
                                return requests.items;
                            } else {
                                return [];
                            }
                        }, function () {
                            return [];
                        }).finally(function () {
                            notificationService.sendMessage('crs.request.message.listLoaded', 5000);
                        });
                    }
                }
            );

            var submittedTableParams = new ngTableParams({
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

                        return requestService.getSubmittedRequests(params.page() - 1, params.count(), params.filter().search, sortFields, sortDirs).then(function (requests) {
                            params.total(requests.total);
                            if (requests.items && requests.items.length > 0) {
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
            vm.isAdmin = false;
            vm.loadingAuthors = true;
            vm.removeSelectedRequests = removeSelectedRequests;
            vm.getAuthorName = getAuthorName;

            initView();
        }
    ]);