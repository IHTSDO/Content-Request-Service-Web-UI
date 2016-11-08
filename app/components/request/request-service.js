'use strict';

angular.module('conceptRequestServiceApp.request')
    .service('requestService', [
        '$rootScope',
        '$q',
        'crsService',
        'REQUEST_TYPE',
        'REQUEST_STATUS',
        'CRS_API_ENDPOINT',
        'STATISTICS_STATUS',
        'STATISTICS_LABEL',
        function ($rootScope, $q, crsService, REQUEST_TYPE, REQUEST_STATUS, CRS_API_ENDPOINT, STATISTICS_STATUS, STATISTICS_LABEL) {

            var identifyRequestType = function (value) {
                for (var requestTypeKey in REQUEST_TYPE) {
                    if (REQUEST_TYPE.hasOwnProperty(requestTypeKey) &&
                        REQUEST_TYPE[requestTypeKey].value === value) {
                        return REQUEST_TYPE[requestTypeKey];
                    }
                }

                return null;
            };

            var identifyRequestStatus = function (value) {
                for (var requestStatusKey in REQUEST_STATUS) {
                    if (REQUEST_STATUS.hasOwnProperty(requestStatusKey) &&
                        REQUEST_STATUS[requestStatusKey].value === value) {
                        return REQUEST_STATUS[requestStatusKey];
                    }
                }

                return null;
            };

            var identifyStatisticsStatus = function (value) {
                for (var statisticsStatusKey in STATISTICS_STATUS) {
                    if (STATISTICS_STATUS.hasOwnProperty(statisticsStatusKey) &&
                        STATISTICS_STATUS[statisticsStatusKey].value === value) {
                        return STATISTICS_STATUS[statisticsStatusKey];
                    }
                }

                return null;
            };

            var identifyStatisticsLabel = function (value) {
                for (var statisticsLabelKey in STATISTICS_LABEL) {
                    if (STATISTICS_LABEL.hasOwnProperty(statisticsLabelKey) &&
                        STATISTICS_LABEL[statisticsLabelKey].value === value) {
                        return STATISTICS_LABEL[statisticsLabelKey];
                    }
                }

                return null;
            };

            // var getRequests = function (page, pageCount, searchStr, sortFields, sortDirections, batchRequest, fsn, jiraTicketId) {
            //     var listEndpoint = CRS_API_ENDPOINT.REQUEST_LIST;
            //     var params = {
            //         offset: page,
            //         limit: pageCount,
            //         search: searchStr,
            //         sortFields: sortFields,
            //         sortDirections: sortDirections,
            //         batchRequest: batchRequest,
            //         concept: fsn,
            //         jiraTicketId: jiraTicketId
            //     };

            //     return crsService.sendGet(listEndpoint, params, null);
            // };

            var getRequests = function (requestList) {
                var listEndpoint = CRS_API_ENDPOINT.REQUEST_LIST;
                

                return crsService.sendPost(listEndpoint, null, requestList);
            };

            var getSubmittedRequests = function (page, pageCount, searchStr, sortFields, sortDirections) {
                var listEndpoint = CRS_API_ENDPOINT.SUBMITTED_REQUEST_LIST;
                var params = {
                    offset: page,
                    limit: pageCount,
                    search: searchStr,
                    sortFields: sortFields,
                    sortDirections: sortDirections
                };

                return crsService.sendGet(listEndpoint, params, null);
            };

            var getAcceptedRequests = function (page, pageCount, searchStr, sortFields, sortDirections, onlyUnassigned) {
                var listEndpoint = CRS_API_ENDPOINT.ACCEPTED_REQUEST_LIST;
                var params = {
                    offset: page,
                    limit: pageCount,
                    search: searchStr,
                    sortFields: sortFields,
                    sortDirections: sortDirections,
                    onlyUnassigned: (onlyUnassigned === true)
                };

                return crsService.sendGet(listEndpoint, params, null);
            };

            var getRequest = function (requestId) {

                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                return crsService.sendGet(requestEndpoint + '/' + requestId, null);
            };

            var saveRequest = function (requestDetails) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var id = requestDetails.id;

                if (id === undefined || id === null) {
                    return crsService.sendPost(requestEndpoint, null, requestDetails);
                } else {
                    return crsService.sendPut(requestEndpoint + '/' + id, null, requestDetails);
                }
            };

            var changeRequestStatus = function (requestId, requestStatus, data) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params = {
                    status: requestStatus.value
                };

                if (!data) {
                    data = {};
                }

                return crsService.sendPut(requestEndpoint + '/' + requestId + '/status', params, data);
            };

            var submitRequest = function (requestId) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;

                if (requestId !== undefined && requestId !== null) {
                    return crsService.sendPost(requestEndpoint + '/' + requestId + '/submit', null, null);
                }
            };

            var bulkAction = function(data, action){
                var requestEndpoint = CRS_API_ENDPOINT.BULK_ACTION;
                var params;

                if (data !== undefined &&
                    data !== null) {
                    params = {
                        action: action
                    };

                    return crsService.sendPut(requestEndpoint, params, data);
                }
            };

            var getMaxSize = function(){
                var requestEndpoint = CRS_API_ENDPOINT.BULK_ACTION;
                return crsService.sendGet(requestEndpoint + '/maxSize', null, null);
            };

            var getBulkActionStatus = function(bulkActionId){
                var requestEndpoint = CRS_API_ENDPOINT.BULK_ACTION;
                return crsService.sendGet(requestEndpoint + '/' + bulkActionId + '/status', null, null);
            };

            var removeRequests = function (requestList) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params;

                if (requestList !== undefined &&
                    requestList !== null) {
                    params = {
                        requests: requestList
                    };

                    return crsService.sendDelete(requestEndpoint, params, null);
                }
            };

            var assignRequests = function (requestList, projectKey, assigneeKey, summary) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params;

                if (requestList !== undefined &&
                    requestList !== null) {
                    params = {
                        requests: requestList,
                        project: projectKey,
                        assignee: assigneeKey,
                        summary: summary
                    };

                    return crsService.sendPut(requestEndpoint + '/assign', params, null);
                }
            };

            var unassignRequest = function (requestId) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params;

                if (requestId !== undefined &&
                    requestId !== null) {
                    params = {
                        requestId: requestId
                    };

                    return crsService.sendPut(requestEndpoint + '/unassignAuthoringTask', params, null);
                }
            };

            var assignRequestsToStaff = function (requestList, assigneeKey) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params;

                if (requestList !== undefined &&
                    requestList !== null) {
                    params = {
                        requests: requestList,
                        assignee: assigneeKey
                    };

                    return crsService.sendPut(requestEndpoint + '/assign/staff', params, null);
                }
            };

            var getStatisticsRequests = function(){
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                return crsService.sendGet(requestEndpoint + '/statusStatistics');
            };

            var savedFilterValues;

            var setFilterValues = function(filterValues, sortingValues){
               savedFilterValues = filterValues;
               savedFilterValues.sorting = sortingValues;
            };

            var getFilterValues = function(){
               return savedFilterValues;
            };

            var savedSubmittedFilterValues;

            var setSubmittedFilterValues = function(filterValues, sortingValues){
               savedSubmittedFilterValues = filterValues;
               savedSubmittedFilterValues.sorting = sortingValues;
            };

            var getSubmittedFilterValues = function(){
               return savedSubmittedFilterValues;
            };

            var savedAcceptedFilterValues;

            var setAcceptedFilterValues = function(filterValues, sortingValues){
               savedAcceptedFilterValues = filterValues;
               savedAcceptedFilterValues.sorting = sortingValues;
            };

            var getAcceptedFilterValues = function(){
               return savedAcceptedFilterValues;
            };

            var savedAssignedFilterValues;

            var setAssignedFilterValues = function(filterValues, sortingValues){
               savedAssignedFilterValues = filterValues;
               savedAssignedFilterValues.sorting = sortingValues;
            };

            var getAssignedFilterValues = function(){
               return savedAssignedFilterValues;
            };

            var savedColumns;

            var setSavedColumns = function(data){
                savedColumns = data;
            };

            var getSavedColumns = function(){
                return savedColumns;
            };

            function getBatchConcept(requestId, conceptId) {
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params;
                params = {
                    searchId: conceptId
                };
                return crsService.sendGet(requestEndpoint + '/batchNewConcept/' + requestId, params);
            }

            var getNewConcept = function(localCode){
                var requestEndpoint = CRS_API_ENDPOINT.REQUEST;
                var params;
                params = {
                    localCode: localCode
                };
                return crsService.sendGet(requestEndpoint + '/newConceptObject/' , params);
            };

            var getUserPreferences = function(){
                var requestEndpoint = CRS_API_ENDPOINT.USER_PREFERENCES;
                return crsService.sendGet(requestEndpoint);
            };

            var saveUserPreferences = function(data){
                var requestEndpoint = CRS_API_ENDPOINT.USER_PREFERENCES;
                return crsService.sendPost(requestEndpoint, null, data);
            };

            var authors;

            var getAuthorsList = function(){
                return authors;
            };

            var setAuthorsList = function(list){
                authors = list;
            };

            var staffs;

            var getStaffsList = function(){
                return staffs;
            };

            var setStaffsList = function(list){
                staffs = list;
            };

            var requestors;

            var getRequestorsList = function(){
                return requestors;
            };

            var setRequestorsList = function(list){
                requestors = list;
            };

            var projects;

            var getProjectsList = function(){
                return projects;
            };

            var setProjectsList = function(list){
                projects = list;
            };

            var semanticTags;

            var getSemanticTags = function(){
                return semanticTags;
            };

            var setSemanticTags = function(list){
                semanticTags = list;
            };

            var topics;

            var getTopics = function(){
                return topics;
            };

            var setTopics = function(list){
                topics = list;
            };

            var maxSize;

            var getSavedMaxSize = function(){
                return maxSize;
            };

            var setMaxSize = function(size){
                maxSize = size;
            };

            return {
                identifyRequestType: identifyRequestType,
                identifyRequestStatus: identifyRequestStatus,
                getRequest: getRequest,
                getRequests: getRequests,
                getSubmittedRequests: getSubmittedRequests,
                getAcceptedRequests: getAcceptedRequests,
                saveRequest: saveRequest,
                submitRequest: submitRequest,
                removeRequests: removeRequests,
                assignRequests: assignRequests,
                assignRequestsToStaff: assignRequestsToStaff,
                changeRequestStatus: changeRequestStatus,
                getStatisticsRequests: getStatisticsRequests,
                identifyStatisticsStatus: identifyStatisticsStatus,
                identifyStatisticsLabel: identifyStatisticsLabel,
                getBatchConcept: getBatchConcept,
                setFilterValues: setFilterValues,
                getFilterValues: getFilterValues,
                setSubmittedFilterValues: setSubmittedFilterValues,
                getSubmittedFilterValues: getSubmittedFilterValues,
                setAcceptedFilterValues: setAcceptedFilterValues,
                getAcceptedFilterValues: getAcceptedFilterValues,
                setAssignedFilterValues: setAssignedFilterValues,
                getAssignedFilterValues: getAssignedFilterValues,
                getNewConcept: getNewConcept,
                getMaxSize: getMaxSize,
                bulkAction: bulkAction,
                getBulkActionStatus: getBulkActionStatus,
                unassignRequest: unassignRequest,
                setSavedColumns: setSavedColumns,
                getSavedColumns: getSavedColumns,
                getUserPreferences: getUserPreferences,
                saveUserPreferences: saveUserPreferences,
                getAuthorsList: getAuthorsList,
                setAuthorsList: setAuthorsList,
                getStaffsList: getStaffsList,
                setStaffsList: setStaffsList,
                getRequestorsList: getRequestorsList,
                setRequestorsList: setRequestorsList,
                getProjectsList: getProjectsList,
                setProjectsList: setProjectsList,
                getSemanticTags: getSemanticTags,
                setSemanticTags: setSemanticTags,
                getTopics: getTopics,
                setTopics: setTopics,
                getSavedMaxSize: getSavedMaxSize,
                setMaxSize: setMaxSize
            };

        }]);