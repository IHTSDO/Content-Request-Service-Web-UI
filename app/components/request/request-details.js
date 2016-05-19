/*jshint newcap:false*/
'use strict';

angular
    .module('conceptRequestServiceApp.request')
    .controller('RequestDetailsCtrl', [
        '$scope',
        '$rootScope',
        '$routeParams',
        '$location',
        '$anchorScroll',
        '$uibModal',
        '$sce',
        '$q',
        'requestService',
        'notificationService',
        'requestMetadataService',
        'objectService',
        'snowowlService',
        'snowowlMetadataService',
        'crsJiraService',
        'scaService',
        'accountService',
        'REQUEST_METADATA_KEY',
        'REQUEST_TYPE',
        'CONCEPT_EDIT_EVENT',
        'REQUEST_STATUS',
        'REQUEST_INPUT_MODE',
        function ($scope, $rootScope, $routeParams, $location, $anchorScroll, $uibModal, $sce, $q, requestService, notificationService, requestMetadataService, objectService, snowowlService, snowowlMetadataService, crsJiraService, scaService, accountService, REQUEST_METADATA_KEY, REQUEST_TYPE, CONCEPT_EDIT_EVENT, REQUEST_STATUS, REQUEST_INPUT_MODE) {
            var vm = this;
            var REQUEST_MODE = {
                NEW: {value: 'new', langKey: 'crs.request.requestMode.newRequest'},
                EDIT: {value: 'edit', langKey: 'crs.request.requestMode.editRequest'},
                PREVIEW: {value: 'preview', langKey: 'crs.request.requestMode.previewRequest'},
                VIEW: {value: 'view', langKey: 'crs.request.requestMode.viewRequest'}
            };
            var DESCRIPTION_TYPE = {
                FSN: 'FSN',
                SYN: 'SYNONYM',
                DEF: 'TEXT_DEFINITION'
            };
            var ACCEPTABILITY_DIALECT = {
                EN_US: '900000000000509007',
                EN_GB: '900000000000508004'
            };
            var ACCEPTABILITY_VALUE = {
                PREFERRED: 'PREFERRED',
                ACCEPTABLE: 'ACCEPTABLE'
            };
            var RELATIONSHIP_CHARACTERISTIC_TYPE = {
                STATED:"STATED_RELATIONSHIP",
                INFERRED:"INFERRED_RELATIONSHIP"
            }
            var mode = $routeParams.mode,
                param = $routeParams.param,
                inputMode = $routeParams.inputMode,
                kbMode = $routeParams.kb;

            var requestId,
                requestType;

            var prevPage = '/dashboard';

            var permanentlyDisableSimpleMode = false;

            var identifyPageMode = function (pm) {
                for (var requestModeKey in REQUEST_MODE) {
                    if (REQUEST_MODE.hasOwnProperty(requestModeKey) &&
                        REQUEST_MODE[requestModeKey].value === pm) {
                        return REQUEST_MODE[requestModeKey];
                    }
                }

                return null;
            };

            var identifyInputMode = function (im) {
                if (im !== undefined && im !== null) {
                    for (var inputModeKey in REQUEST_INPUT_MODE) {
                        if (REQUEST_INPUT_MODE.hasOwnProperty(inputModeKey) &&
                            REQUEST_INPUT_MODE[inputModeKey].value === im) {
                            return REQUEST_INPUT_MODE[inputModeKey];
                        }
                    }
                }

                return null;
            };

            var isValidViewParams = function () {
                var pageMode,
                    isValidPageMode = false,
                    isValidParam = false,
                    isValidInputMode = false;

                // check valid mode
                pageMode = identifyPageMode(mode);
                isValidPageMode = (pageMode !== undefined && pageMode !== null);

                // check valid param
                switch(pageMode) {
                    case  REQUEST_MODE.NEW:
                        isValidParam = (requestService.identifyRequestType(param) !== null);
                        isValidInputMode = (identifyInputMode(inputMode) !== null);
                        break;
                    case REQUEST_MODE.EDIT:
                    case REQUEST_MODE.PREVIEW:
                    case REQUEST_MODE.VIEW:
                        isValidParam = (param !== undefined && param !== null);
                        isValidInputMode = true;
                        break;
                }

                return isValidPageMode && isValidParam && isValidInputMode;
            };

            /*var hideErrorMessage = function () {
                vm.msgError = null;
            };*/

            var hideSuccessMessage = function () {
                vm.msgSuccess = null;
            };

            var showErrorMessage = function (msg) {
                hideSuccessMessage();
                vm.msgError = msg;

                $anchorScroll('messagePaneLocation');
            };

            /*var showSuccessMessage = function (msg) {
                hideErrorMessage();
                vm.msgSuccess = msg;
                $window.scrollTop = 0;
            };*/

            var loadProjects = function () {
                vm.loadingProjects = true;
                scaService.getProjects().then(function (response) {
                    vm.projects = response;
                }).finally(function () {
                    vm.loadingProjects = false;
                });
            };

            var loadAuthors = function () {
                vm.loadingAuthors = true;
                return crsJiraService.getAuthorUsers(0, 50, true, []).then(function (users) {
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
                                    '<img style="padding-bottom:2px" src="' + vm.authors[i].avatarUrls['16x16'] + '"/>',
                                    '<span style="vertical-align:middle">&nbsp;' + vm.authors[i].displayName + '</span>'
                            ].join(''));
                        }
                    }
                }
            };

            var buildNewConceptDefinitionOfChanges = function (changeId) {
                return {
                    changeId: (changeId)?changeId:null,
                    changeType: REQUEST_TYPE.NEW_CONCEPT.value,
                    changed: true
                };
            };

            var buildChangeConceptDefinitionOfChanges = function () {
                return {
                    changeId: null,
                    changeType: REQUEST_TYPE.CHANGE_RETIRE_CONCEPT.value,
                    changed: true
                };
            };

            vm.filterRelationshipType = function(relationshipType, element){
                if(vm.pageMode !== REQUEST_MODE.NEW && vm.originalConcept.relationships !== undefined){
                    vm.relationshipsFilter = vm.originalConcept.relationships.filter(function(obj){
                        return (obj.characteristicType === relationshipType && obj.active === true);
                    });
                    if(element === undefined && relationshipType !== undefined && vm.originalConcept !== null && vm.requestType.value === 'CHANGE_RETIRE_RELATIONSHIP'){
                        var arr = vm.originalConcept.relationships;
                        var isRelationshipActive = function(obj){
                            var requestItems = vm.requestItems;
                            for(var i=0;i<requestItems.length;i++){
                                obj.viewName = obj.type.fsn + " " + obj.target.fsn;
                                if(requestItems[i].relationshipId !== null && obj.active === true && obj.characteristicType === relationshipType){
                                    return true;
                                }
                            }
                            return false;
                        };
                        vm.relationshipsFilter = arr.filter(function(obj){
                            return isRelationshipActive(obj);
                        });
                        for(var i in vm.requestItems){
                            for(var j in vm.originalConcept.relationships){
                                vm.originalConcept.relationships[j].viewName = vm.originalConcept.relationships[j].type.fsn + " " + vm.originalConcept.relationships[j].target.fsn;
                                if(vm.requestItems[i].relationshipId !== null || vm.requestItems[i].relationshipId !== undefined){
                                    if(vm.requestItems[i].relationshipId ===  vm.originalConcept.relationships[j].relationshipId){
                                        vm.originalConcept.relationships[j].ticked = true;
                                    }
                                }
                            }
                        }
                        vm.selectedRelationships = vm.requestItems? [vm.requestItems] : [];    
                    }
                }else{
                    vm.relationshipsFilter = vm.originalConcept.relationships.filter(function(obj){
                        return (obj.characteristicType === relationshipType && obj.active === true);
                    });
                }
            };

            $scope.$watch(function () {
                return vm.originalConcept;
            }, function (newVal) {
                if(newVal !== null){
                    vm.filterRelationshipType(vm.request.characteristicType);
                }
            });

            var initView = function () {
                var isValid = isValidViewParams();
                var originConcept;

                // check permission
                accountService.checkUserPermission().then(function (rs) {
                    vm.permissionChecked = true;
                    vm.isAdmin = (rs.isAdmin === true);
                    vm.isViewer = (rs.isViewer === true);
                });

                // load authors
                loadAuthors();

                // load projects
                loadProjects();

                if (!isValid) {
                    showErrorMessage('crs.request.message.error.invalidPage');
                } else {
                    vm.pageMode = identifyPageMode(mode);

                    switch (vm.pageMode) {
                        case REQUEST_MODE.NEW:
                            // $scope.$watch(function () {
                            //     return vm.originalConcept;
                            // }, function () {
                            //     vm.filterRelationshipType('STATED_RELATIONSHIP');
                            // });
                            requestId = null;
                            requestType = requestService.identifyRequestType(param);
                            $rootScope.pageTitles = ['crs.request.details.title.new', requestType.langKey];

                            vm.request = {
                                id: requestId,
                                additionalFields: {},
                                characteristicType: null, 
                                requestHeader: {
                                    status: REQUEST_STATUS.DRAFT.value,
                                    requestDate: new Date().getTime()
                                }
                            };

                            if (requestType === REQUEST_TYPE.NEW_CONCEPT) {
                                originConcept = objectService.getNewConcept();
                                originConcept.definitionOfChanges = buildNewConceptDefinitionOfChanges();
                                vm.originalConcept = originConcept;
                                vm.concept = angular.copy(vm.originalConcept);
                            }

                            if (requestType === REQUEST_TYPE.CHANGE_RETIRE_RELATIONSHIP) {
                                vm.request.characteristicType = RELATIONSHIP_CHARACTERISTIC_TYPE.STATED;
                            }

                            accountService.getAccountInfo().then(function (accountDetails) {
                                vm.request.requestHeader.ogirinatorId = accountDetails.login;
                            });

                            vm.requestType = requestType;
                            vm.isValidViewParams = isValid;
                            vm.inputMode = identifyInputMode(inputMode);
                            break;
                        case REQUEST_MODE.EDIT:
                        case REQUEST_MODE.PREVIEW:
                        case REQUEST_MODE.VIEW:

                            requestId = param;
                            //$rootScope.pageTitles = ['crs.request.details.title.edit'];
                            initBreadcrumb(requestId);

                            vm.disableSimpleMode = true;
                            loadRequest().then(function (requestData) {
                                var requestType = requestService.identifyRequestType(vm.request.requestType);
                                var inputMode = identifyInputMode(vm.request.inputMode);

                                accountService.getAccountInfo().then(function (accountDetails) {
                                    if (requestData.requestHeader.ogirinatorId === accountDetails.login &&
                                        (vm.pageMode === REQUEST_MODE.VIEW ||
                                            (vm.pageMode === REQUEST_MODE.PREVIEW &&
                                                requestData.requestHeader.status === REQUEST_STATUS.DRAFT.value))) {
                                        vm.pageMode = REQUEST_MODE.EDIT;
                                    } else if (vm.pageMode === REQUEST_MODE.VIEW) {
                                        vm.pageMode = REQUEST_MODE.PREVIEW;
                                    }
                                });

                                if (requestType) {
                                    //$rootScope.pageTitles.push(vm.request.id);
                                    vm.requestType = requestType;
                                    vm.inputMode = inputMode;
                                    vm.isValidViewParams = isValid;

                                    permanentlyDisableSimpleMode = (vm.inputMode === REQUEST_INPUT_MODE.DIRECT);
                                    vm.disableSimpleMode = (vm.inputMode === REQUEST_INPUT_MODE.DIRECT);

                                    notificationService.sendMessage('crs.request.message.requestLoaded', 5000);
                                } else {
                                    showErrorMessage('crs.request.message.error.invalidPage');
                                }
                            });
                            break;
                    }

                    loadRequestMetadata();
                }
            };

            var initBreadcrumb = function (requestId) {
                var tmpUrl;
                if (kbMode === true) {
                    $rootScope.pageTitles.push({url: '#' + $location.path(), label: requestId});
                } else {
                    $rootScope.pageTitles = [
                        {url: '#/requests', label: 'crs.request.list.title.requests'},
                        {url: '#' + $location.path(), label: requestId}
                    ];
                }

                if ($rootScope.pageTitles.length > 1) {
                    for (var i = $rootScope.pageTitles.length - 2; i >= 0; i--) {
                        tmpUrl = $rootScope.pageTitles[i].url;
                        if (tmpUrl) {
                            prevPage = tmpUrl.substring(tmpUrl.indexOf('#')+1);
                            break;
                        }
                    }
                }
            };

            var loadRequest = function () {
                var originConcept;

                notificationService.sendMessage('crs.request.message.requestLoading', 0);

                vm.request = null;

                return requestService.getRequest(requestId).then(function (requestData) {
                    // build request
                    vm.request = buildRequestFromRequestData(requestData);
                    vm.requestItems = requestData.requestItems;

                    // get original concept
                    if (requestData.requestType === REQUEST_TYPE.NEW_CONCEPT.value) {
                        originConcept = objectService.getNewConcept();
                        originConcept.definitionOfChanges = buildNewConceptDefinitionOfChanges();
                        vm.originalConcept = originConcept;

                        //return null;
                    } else {
                        vm.originalConcept = {
                            conceptId: requestData.concept.conceptId,
                            fsn: requestData.concept.fsn
                        };
                        /*return snowowlService.getFullConcept(null, null, requestData.concept.conceptId).then(function (response) {
                            originalConcept = response;
                            vm.originalConcept = response;
                        });*/
                    }

                    // rebuild concept from request data
                    vm.concept = requestData.concept;

                    return requestData;
                },function(reason){
                    notificationService.sendError(reason.message, 5000, null, true);
                    if ($location.path() !== '/dashboard') {
                        $location.path('/dashboard').search({});
                    }
                });
            };

            var loadRequestMetadata = function () {
                requestMetadataService.getMetadata([
                    REQUEST_METADATA_KEY.RELATIONSHIP_TYPE,
                    REQUEST_METADATA_KEY.CHARACTERISTIC_TYPE,
                    REQUEST_METADATA_KEY.REFINABILITY,
                    REQUEST_METADATA_KEY.NEW_CONCEPT_STATUS,
                    REQUEST_METADATA_KEY.CASE_SIGNIFICANCE,
                    REQUEST_METADATA_KEY.CONCEPT_HISTORY_ATTRIBUTE,
                    REQUEST_METADATA_KEY.NEW_DESCRIPTION_STATUS,
                    REQUEST_METADATA_KEY.NEW_RELATIONSHIP_STATUS
                ])
                    .then(function (metadata) {
                        vm.relationshipTypes = metadata[REQUEST_METADATA_KEY.RELATIONSHIP_TYPE];
                        vm.characteristicTypes = metadata[REQUEST_METADATA_KEY.CHARACTERISTIC_TYPE];
                        vm.refinabilities = metadata[REQUEST_METADATA_KEY.REFINABILITY];
                        vm.newConceptStatuses = metadata[REQUEST_METADATA_KEY.NEW_CONCEPT_STATUS];
                        vm.caseSignificances = metadata[REQUEST_METADATA_KEY.CASE_SIGNIFICANCE];
                        vm.historyAttributes = metadata[REQUEST_METADATA_KEY.CONCEPT_HISTORY_ATTRIBUTE];
                        vm.descriptionStatuses = metadata[REQUEST_METADATA_KEY.NEW_DESCRIPTION_STATUS];
                        vm.relationshipStatuses = metadata[REQUEST_METADATA_KEY.NEW_RELATIONSHIP_STATUS];
                    });
            };

            var cancelEditing = function () {
                $location.path(prevPage).search({});
            };

            var identifyParentConcept = function (concept) {
                var relationship, parentConcept = null;

                if (concept &&
                    angular.isArray(concept.relationships) &&
                    concept.relationships.length > 0) {

                    for (var i = 0; i < concept.relationships.length; i++) {
                        relationship = concept.relationships[i];

                        if (relationship.active === true &&
                            snowowlMetadataService.isIsaRelationship(relationship.type.conceptId)) {
                            parentConcept = {
                                id: (relationship.target && relationship.target.conceptId) ? relationship.target.conceptId : null,
                                fsn: (relationship.target && relationship.target.fsn) ? relationship.target.fsn : null
                            };

                            break;
                        }
                    }
                }

                return parentConcept;
            };

            var injectParentConcept = function (concept, parentConcept) {
                var isaRelationship = objectService.getNewIsaRelationship(concept.conceptId);

                if (!angular.isArray(concept.relationships)) {
                    concept.relationships = [];
                }

                isaRelationship.target = parentConcept;
                concept.relationships.push(isaRelationship);
            };

            var injectRelationship = function (concept, relationshipType, destinationConcept, characteristicType, refinability, applyChanges) {
                var relationship = objectService.getNewAttributeRelationship(concept.conceptId);

                if (!angular.isArray(concept.relationships)) {
                    concept.relationships = [];
                }

                relationship.type = relationshipType;
                relationship.target = {
                    active: destinationConcept.active,
                    conceptId: destinationConcept.conceptId,
                    definitionStatus: destinationConcept.definitionStatus,
                    effectiveTime: destinationConcept.effectiveTime,
                    fsn: destinationConcept.fsn,
                    moduleId: destinationConcept.moduleId
                };

                if (applyChanges) {
                    relationship.definitionOfChanges = {
                        changeId: null,
                        changeType: REQUEST_TYPE.NEW_RELATIONSHIP.value,
                        changed: true,
                        characteristicType: characteristicType,
                        refinability: refinability
                    };
                }

                concept.relationships.push(relationship);
            };

            var extractConceptDescriptions = function (concept, descriptionType, extractAll) {
                var description, descriptions = [];

                if (concept &&
                    angular.isArray(concept.descriptions) &&
                    concept.descriptions.length > 0) {
                    for (var i = 0; i < concept.descriptions.length; i++) {
                        description = concept.descriptions[i];

                        if (description.type === descriptionType &&
                            (extractAll || description.definitionOfChanges) && // extract all or only changes descriptions
                            description.active === true) {
                            descriptions.push(description);
                        }
                    }
                }

                return descriptions;
            };

            var injectConceptDescription = function (concept, descriptionTerm, applyChanges) {
                var desc = objectService.getNewDescription(concept.conceptId);
                desc.term = descriptionTerm;

                if (!angular.isArray(concept.descriptions)) {
                    concept.descriptions = [];
                }

                if (applyChanges) {
                    desc.definitionOfChanges = {
                        changeId: null,
                        changeType: REQUEST_TYPE.NEW_DESCRIPTION.value,
                        changed: true
                    };
                }

                concept.descriptions.push(desc);
            };

            var cloneConceptDescription = function (concept, sourceDescriptionId, proposedTerm, proposedCaseSignificance, applyChanges, descriptionStatus) {
                var sourceDescription, newDesc, sourceDesc;

                for (var i = 0; i < concept.descriptions.length; i++) {
                    sourceDesc = concept.descriptions[i];

                    if (sourceDesc.descriptionId === sourceDescriptionId) {
                        sourceDescription = sourceDesc;
                        break;
                    }
                }

                if (sourceDescription) {
                    newDesc = angular.copy(sourceDescription);

                    newDesc.descriptionId = null;
                    newDesc.effectiveTime = null;

                    if (proposedTerm !== undefined &&
                        proposedTerm !== null &&
                        proposedTerm.trim() !== '' ) {
                        newDesc.term = proposedTerm;
                    }

                    if (proposedCaseSignificance) {
                        newDesc.caseSignificance = proposedCaseSignificance;
                    }

                    if (applyChanges) {
                        newDesc.definitionOfChanges = {
                            changeId: null,
                            changeType: REQUEST_TYPE.NEW_DESCRIPTION.value,
                            changed: true
                        };
                    }

                    if (!angular.isArray(concept.descriptions)) {
                        concept.descriptions = [];
                    } else if (applyChanges) {
                        sourceDescription.active = false;
                        sourceDescription.definitionOfChanges = {
                            changeId: null,
                            changeType: REQUEST_TYPE.CHANGE_RETIRE_DESCRIPTION.value,
                            changed: true,
                            descriptionStatus: descriptionStatus,
                            proposedDescription: proposedTerm
                        };
                    }

                    concept.descriptions.push(newDesc);
                }
            };

            var extractConceptFSN = function (concept) {
                var fsns = extractConceptDescriptions(concept, DESCRIPTION_TYPE.FSN, true);

                if (fsns.length > 0) {
                    return fsns[0].term;
                }

                return null;
            };

            var injectConceptFSN = function (concept, fsn, applyChanges) {
                var fsnDesc = objectService.getNewFsn(concept.conceptId);
                var currentFsns, currentFsn;

                if (!angular.isArray(concept.descriptions)) {
                    concept.descriptions = [];
                } else if (applyChanges) {
                    // de-active current fsn
                    currentFsns = extractConceptDescriptions(concept, DESCRIPTION_TYPE.FSN, true);

                    if (currentFsns.length > 0) {
                        currentFsn = currentFsns[0];
                        currentFsn.active = false;
                        currentFsn.definitionOfChanges = {
                            changeId: null,
                            changeType: REQUEST_TYPE.CHANGE_RETIRE_DESCRIPTION.value,
                            changed: true,
                            descriptionStatus: 'Retired'
                        };
                    }
                }

                fsnDesc.term = fsn;
                if (applyChanges) {
                    fsnDesc.definitionOfChanges = {
                        changeId: null,
                        changeType: REQUEST_TYPE.NEW_DESCRIPTION.value,
                        changed: true
                    };
                }

                concept.descriptions.push(fsnDesc);

                return null;
            };

            var extractConceptPT = function (concept) {
                var syns = extractConceptDescriptions(concept, DESCRIPTION_TYPE.SYN, true);

                for (var i = 0; i < syns.length; i++) {
                    if (syns[i].acceptabilityMap &&
                        syns[i].acceptabilityMap[ACCEPTABILITY_DIALECT.EN_GB] === ACCEPTABILITY_VALUE.PREFERRED &&
                        syns[i].acceptabilityMap[ACCEPTABILITY_DIALECT.EN_US] === ACCEPTABILITY_VALUE.PREFERRED) {
                        return syns[i].term;
                    }
                }

                return null;
            };

            var injectConceptPT = function (concept, conceptPT, applyChanges) {
                var preferredTerm = objectService.getNewPt(concept.conceptId);

                if (!angular.isArray(concept.descriptions)) {
                    concept.descriptions = [];
                }

                preferredTerm.term = conceptPT;

                if (applyChanges) {
                    preferredTerm.definitionOfChanges = {
                        changeId: null,
                        changeType: REQUEST_TYPE.NEW_DESCRIPTION.value,
                        changed: true
                    };
                }

                concept.descriptions.push(preferredTerm);

                return null;
            };

            var extractConceptSynonyms = function (concept, excludePT, extractAll) {
                var syns = extractConceptDescriptions(concept, DESCRIPTION_TYPE.SYN, extractAll);
                var sysnTerms = [];
                var excludedPT;

                for (var i = 0; i < syns.length; i++) {
                    if (!excludedPT &&
                        syns[i].acceptabilityMap &&
                        syns[i].acceptabilityMap[ACCEPTABILITY_DIALECT.EN_GB] === ACCEPTABILITY_VALUE.PREFERRED &&
                        syns[i].acceptabilityMap[ACCEPTABILITY_DIALECT.EN_US] === ACCEPTABILITY_VALUE.PREFERRED) {
                        excludedPT = syns[i];
                    }

                    if (!excludePT || syns[i] !== excludedPT) {
                        sysnTerms.push(syns[i].term);
                    }
                }

                return sysnTerms;
            };

            var injectConceptSynonyms = function (concept, synonyms, applyChanges) {
                var synTerm, synDesc;

                if (!angular.isArray(concept.descriptions)) {
                    concept.descriptions = [];
                }

                if (angular.isArray(synonyms) && synonyms.length > 0) {
                    for (var i = 0; i < synonyms.length; i++) {
                        synTerm = synonyms[i];

                        if (synTerm && synTerm.trim()) {
                            synDesc = objectService.getNewDescription(concept.conceptId);
                            synDesc.term = synTerm;
                            if (applyChanges) {
                                synDesc.definitionOfChanges = {
                                    changeId: null,
                                    changeType: REQUEST_TYPE.NEW_DESCRIPTION.value,
                                    changed: true
                                };
                            }
                            concept.descriptions.push(synDesc);
                        }
                    }
                }
            };

            var extractItemByRequestType = function (requestItems, type) {
                for (var i = 0 ; i < requestItems.length; i++){
                    if (requestItems[i].requestType === type.value) {
                        return requestItems[i];
                    }
                }

                return null;
            };

            var extractConceptDefinitions = function (concept, extractAll) {
                var defs = extractConceptDescriptions(concept, DESCRIPTION_TYPE.DEF, extractAll);
                var defTerms = [];

                for (var i = 0; i < defs.length; i++) {
                    defTerms.push(defs[i].term);
                }

                return defTerms;
            };

            var injectConceptDefinitions = function (concept, definitions, applyChanges) {
                var defTerm, defDesc;

                if (!angular.isArray(concept.descriptions)) {
                    concept.descriptions = [];
                }

                if (angular.isArray(definitions) && definitions.length > 0) {
                    for (var i = 0; i < definitions.length; i++) {
                        defTerm = definitions[i];

                        if (defTerm && defTerm.trim()) {
                            defDesc = objectService.getNewTextDefinition(concept.conceptId);
                            defDesc.term = defTerm;
                            if (applyChanges) {
                                defDesc.definitionOfChanges = {
                                    changeId: null,
                                    changeType: REQUEST_TYPE.NEW_DESCRIPTION.value,
                                    changed: true
                                };
                            }
                            concept.descriptions.push(defDesc);
                        }
                    }
                }
            };

            var buildRequestWorkItem = function (concept, definitionOfChanges, changedTarget) {
                var item = {};
                var parentConcept, isDescriptionPT = false;

                item.requestType = definitionOfChanges.changeType;
                item.id = definitionOfChanges.changeId;

                item.topic = concept.definitionOfChanges.topic;
                item.reasonForChange = concept.definitionOfChanges.reasonForChange;
                item.notes = concept.definitionOfChanges.notes;
                item.reference = concept.definitionOfChanges.reference;

                switch (item.requestType) {
                    case REQUEST_TYPE.NEW_CONCEPT.value:
                        parentConcept = identifyParentConcept(concept);
                        item.parentId = (parentConcept) ? parentConcept.id : null;
                        item.parentFSN = (parentConcept) ? parentConcept.fsn : null;
                        item.proposedFSN = concept.fsn;
                        item.conceptPT = extractConceptPT(concept);
                        item.proposedSynonyms = extractConceptSynonyms(concept, item.conceptPT, true);
                        item.proposedDefinitions = extractConceptDefinitions(concept, true);
                        break;

                    case REQUEST_TYPE.CHANGE_RETIRE_CONCEPT.value:
                        item.conceptId = concept.conceptId;
                        item.conceptFSN = concept.definitionOfChanges.currentFsn;
                        item.proposedFSN = concept.fsn;
                        item.proposedStatus = definitionOfChanges.proposedStatus;
                        item.historyAttribute = definitionOfChanges.historyAttribute;
                        item.historyAttributeValue = definitionOfChanges.historyAttributeValue;
                        break;

                    case REQUEST_TYPE.NEW_DESCRIPTION.value:
                        if (changedTarget.type === DESCRIPTION_TYPE.SYN &&
                            changedTarget.acceptabilityMap &&
                            changedTarget.acceptabilityMap[ACCEPTABILITY_DIALECT.EN_GB] === ACCEPTABILITY_VALUE.PREFERRED &&
                            changedTarget.acceptabilityMap[ACCEPTABILITY_DIALECT.EN_US] === ACCEPTABILITY_VALUE.PREFERRED) {
                            isDescriptionPT = true;
                        }

                        item.conceptId = concept.conceptId;
                        item.conceptFSN = concept.fsn;
                        item.proposedDescription = changedTarget.term;
                        item.descriptionIsPT = isDescriptionPT;
                        break;

                    case REQUEST_TYPE.CHANGE_RETIRE_DESCRIPTION.value:
                        item.conceptId = concept.conceptId;
                        item.conceptFSN = concept.fsn;
                        item.descriptionId = changedTarget.descriptionId;
                        item.currentDescription = changedTarget.term;
                        item.conceptDescription = changedTarget.term;
                        item.proposedDescription = definitionOfChanges.proposedDescription || changedTarget.term;
                        item.proposedCaseSignificance = changedTarget.caseSignificance;
                        item.proposedDescriptionStatus = definitionOfChanges.descriptionStatus;
                        break;

                    case REQUEST_TYPE.NEW_RELATIONSHIP.value:
                        item.conceptId = concept.conceptId;
                        item.relationshipType = changedTarget.type.conceptId;
                        item.destConceptId = changedTarget.target.conceptId;
                        item.characteristicType = definitionOfChanges.characteristicType;
                        item.refinability = definitionOfChanges.refinability;
                        break;

                    case REQUEST_TYPE.CHANGE_RETIRE_RELATIONSHIP.value:
                        item.conceptId = concept.conceptId;
                        item.conceptFSN = concept.fsn;
                        item.relationshipId = changedTarget.relationshipId;
                        item.refinability = definitionOfChanges.refinability;
                        item.relationshipStatus = definitionOfChanges.relationshipStatus;
                        item.characteristicType = changedTarget.characteristicType;
                        break;
                }

                return item;

            };

            var buildRequestFromRequestData = function (requestData) {
                var request = {
                    id:                     requestData.id,
                    requestorInternalId:    requestData.requestorInternalId,
                    fsn:                    requestData.fsn,
                    batchRequest:           requestData.batchRequest,
                    rfcNumber:              requestData.rfcNumber,
                    additionalFields:       requestData.additionalFields || {},
                    jiraTicketId:           requestData.jiraTicketId,
                    requestType:            requestData.requestType,
                    inputMode:              requestData.inputMode,
                    requestHeader:          requestData.requestHeader
                };
                var requestItems = requestData.requestItems;
                var mainItem = extractItemByRequestType(requestItems, requestService.identifyRequestType(request.requestType));

                switch (request.requestType) {
                    case REQUEST_TYPE.NEW_CONCEPT.value:
                        //mainItem = requestItems[0];

                        //parentConcept = identifyParentConcept(concept);
                        request.parentConcept = {
                            conceptId: mainItem.parentId,
                            fsn: mainItem.parentFSN
                        };

                        request.proposedFSN = mainItem.proposedFSN;
                        request.conceptPT = mainItem.conceptPT;
                        request.proposedSynonyms = mainItem.proposedSynonyms;
                        request.proposedDefinitions = mainItem.proposedDefinitions;
                        break;

                    case REQUEST_TYPE.CHANGE_RETIRE_CONCEPT.value:
                        //mainItem = extractItemByRequestType(requestItems, REQUEST_TYPE.CHANGE_RETIRE_CONCEPT);

                        request.proposedFSN = mainItem.proposedFSN;
                        request.proposedStatus = mainItem.proposedStatus;
                        request.historyAttribute = mainItem.historyAttribute;
                        request.historyAttributeValue = mainItem.historyAttributeValue;
                        break;

                    case REQUEST_TYPE.NEW_DESCRIPTION.value:
                        //mainItem = extractItemByRequestType(requestItems, REQUEST_TYPE.NEW_DESCRIPTION);

                        request.proposedDescription = mainItem.proposedDescription;
                        request.descriptionIsPT = mainItem.descriptionIsPT;
                        break;

                    case REQUEST_TYPE.CHANGE_RETIRE_DESCRIPTION.value:
                        //mainItem = extractItemByRequestType(requestItems, REQUEST_TYPE.CHANGE_RETIRE_DESCRIPTION);

                        request.descriptionId = mainItem.descriptionId;
                        request.proposedDescription = mainItem.proposedDescription;
                        request.proposedCaseSignificance = mainItem.proposedCaseSignificance;
                        request.descriptionStatus = mainItem.proposedDescriptionStatus;
                        break;

                    case REQUEST_TYPE.NEW_RELATIONSHIP.value:
                        //mainItem = extractItemByRequestType(requestItems, REQUEST_TYPE.NEW_RELATIONSHIP);

                        request.characteristicType = mainItem.characteristicType;
                        request.refinability = mainItem.refinability;

                        // load destination concept
                        request.destinationConcept = {
                            conceptId: mainItem.destConceptId
                        };

                        // load relationship type
                        snowowlService.getFullConcept(null, null, mainItem.relationshipType).then(function (response) {
                            request.relationshipType = {
                                conceptId: mainItem.relationshipType,
                                fsn: response.fsn
                            };
                        });

                        break;

                    case REQUEST_TYPE.CHANGE_RETIRE_RELATIONSHIP.value:
                        //mainItem = extractItemByRequestType(requestItems, REQUEST_TYPE.CHANGE_RETIRE_RELATIONSHIP);

                        request.relationshipId = mainItem.relationshipId;
                        request.relationshipStatus = mainItem.relationshipStatus;
                        request.refinability = mainItem.refinability;
                        request.characteristicType = mainItem.characteristicType;

                        break;
                }

                return request;

            };

            var buildRequestData = function (request, concept) {
                var requestDetails = {};


                requestDetails.inputMode = vm.inputMode.value;
                requestDetails.requestType = vm.requestType.value;

                requestDetails.id = request.id;
                requestDetails.requestorInternalId = request.requestorInternalId;
                requestDetails.requestItems = [];
                requestDetails.concept = concept;

                //buildRequestAdditionalFields(requestDetails, concept);
                requestDetails.additionalFields = request.additionalFields;
                requestDetails.fsn = concept.fsn;

                // check concept changes
                if (concept.definitionOfChanges && concept.definitionOfChanges.changed === true) {
                    requestDetails.requestItems.push(buildRequestWorkItem(concept, concept.definitionOfChanges));
                }

                if (concept.definitionOfChanges.changeType === REQUEST_TYPE.CHANGE_RETIRE_CONCEPT.value) {
                    angular.forEach(concept.descriptions, function (description) {
                        if (description.definitionOfChanges && description.definitionOfChanges.changed) {
                            requestDetails.requestItems.push(buildRequestWorkItem(concept, description.definitionOfChanges, description));
                        }
                    });

                    angular.forEach(concept.relationships, function (relationship) {
                        if (relationship.definitionOfChanges && relationship.definitionOfChanges.changed) {
                            requestDetails.requestItems.push(buildRequestWorkItem(concept, relationship.definitionOfChanges, relationship));
                        }
                    });
                }

                return requestDetails;
            };

            var buildConceptDefinitionOfChange = function (concept, request) {
                if (!concept.definitionOfChanges) {
                    concept.definitionOfChanges = buildChangeConceptDefinitionOfChanges();
                }

                if (!concept.conceptId) {
                    concept.fsn = extractConceptFSN(concept);
                }

                // build concept additional fields
                concept.definitionOfChanges.topic = request.additionalFields.topic;
                concept.definitionOfChanges.notes = request.additionalFields.notes;
                concept.definitionOfChanges.reference = request.additionalFields.reference;
                concept.definitionOfChanges.reasonForChange = request.additionalFields.reasonForChange;
                concept.definitionOfChanges.currentFsn = concept.fsn;
            };

            var buildConceptFromRequest = function (request) {
                var concept = null, parentConcept;
                if (vm.originalConcept) {
                    concept = angular.copy(vm.originalConcept);

                    // build definition of changes
                    buildConceptDefinitionOfChange(concept, request);

                    // apply changes from request to concept
                    switch (vm.requestType) {
                        case REQUEST_TYPE.NEW_CONCEPT:
                            concept.descriptions = [];
                            concept.relationships = [];
                            concept.fsn = request.proposedFSN;

                            if (!request.parentConcept) {
                                parentConcept = {
                                    conceptId: null,
                                    fsn: null
                                };
                            } else {
                                parentConcept = request.parentConcept;
                            }

                            injectParentConcept(concept, parentConcept);

                            injectConceptFSN(concept, request.proposedFSN, false);
                            injectConceptPT(concept, request.conceptPT, false);

                            injectConceptSynonyms(concept, request.proposedSynonyms, false);
                            injectConceptDefinitions(concept, request.proposedDefinitions, false);
                            break;

                        case REQUEST_TYPE.CHANGE_RETIRE_CONCEPT:
                            concept.definitionOfChanges.changed = true;
                            concept.definitionOfChanges.proposedStatus = request.proposedStatus;
                            concept.definitionOfChanges.historyAttribute = request.historyAttribute;
                            concept.definitionOfChanges.historyAttributeValue = request.historyAttributeValue;
                            //concept.definitionOfChanges.currentFsn = concept.fsn;

                            if (request.proposedFSN && request.proposedFSN !== concept.fsn) {
                                concept.fsn = request.proposedFSN;
                                injectConceptFSN(concept, request.proposedFSN, true);
                            }
                            break;

                        case REQUEST_TYPE.NEW_DESCRIPTION:
                            if (request.descriptionIsPT === true) {
                                injectConceptPT(concept, request.proposedDescription, true);
                            } else {
                                injectConceptDescription(concept, request.proposedDescription, true);
                            }
                            break;

                        case REQUEST_TYPE.CHANGE_RETIRE_DESCRIPTION:
                            cloneConceptDescription(concept, request.descriptionId, request.proposedDescription, request.proposedCaseSignificance, true, request.descriptionStatus);
                            break;

                        case REQUEST_TYPE.NEW_RELATIONSHIP:
                            injectRelationship(concept, request.relationshipType, request.destinationConcept, request.characteristicType, request.refinability, true);
                            break;

                        case REQUEST_TYPE.CHANGE_RETIRE_RELATIONSHIP:
                            for (var i = 0; i < concept.relationships.length; i++) {
                                for(var j = 0; j < request.relationshipId.length; j++){
                                    if (concept.relationships[i].relationshipId === request.relationshipId[j]) {
                                        concept.relationships[i].active = true;
                                        concept.relationships[i].definitionOfChanges = {
                                            changeId: null,
                                            changeType: REQUEST_TYPE.CHANGE_RETIRE_RELATIONSHIP.value,
                                            changed: true,
                                            relationshipStatus: request.relationshipStatus,
                                            refinability: request.refinability
                                        };
                                        break;
                                    }
                                }
                            }
                            break;
                    }
                }

                return concept;
            };

            var validateRequest = function (ignoreGeneralFields) {
                var field, fieldValue, error = {};
                var fieldRequiredLangKey = 'crs.request.message.error.fieldRequired',
                    fieldInvalidLangKey = 'crs.request.message.error.fieldInvalid';

                notificationService.clear();

                // validate concept
                if (vm.originalConcept === undefined || vm.originalConcept === null ||
                    (vm.originalConcept && !vm.originalConcept.moduleId && !vm.originalConcept.conceptId && !vm.originalConcept.fsn)) {
                    error.concept = fieldRequiredLangKey;
                } else if (vm.originalConcept && !vm.originalConcept.moduleId && !vm.originalConcept.conceptId && vm.originalConcept.fsn) {
                    error.concept = fieldInvalidLangKey;
                }

                // test general fields
                if (!ignoreGeneralFields) {
                    if (!vm.request.additionalFields.topic ||
                        !vm.request.additionalFields.topic.trim()) {
                        error.topic = fieldRequiredLangKey;
                    }
                }

                var isNotValidObj = function(){
                    if(angular.isObject(fieldValue)){
                        if(angular.isArray(fieldValue)){
                            if(fieldValue.length === 0){
                                return true;
                            }
                        }else if(!fieldValue.conceptId){
                            return true;
                        }
                    }
                    return  false;
                };

                // validate require fields
                if (vm.inputMode === REQUEST_INPUT_MODE.SIMPLE) {
                    for (var i = 0; i < vm.requestType.form.fields.length; i++) {
                        field = vm.requestType.form.fields[i];
                        fieldValue = vm.request[field.name];

                        if (field.required === true &&
                            (fieldValue === undefined ||
                            fieldValue === null ||
                            (angular.isFunction(fieldValue.trim) && fieldValue.trim() === '' ) ||
                            isNotValidObj(fieldValue))) {
                            error[field.name] = fieldRequiredLangKey;
                        }
                    }
                }

                vm.error = error;
                if (Object.keys(error).length > 0) {
                    notificationService.sendError('crs.request.message.error.invalidInput');
                    return false;
                }

                return true;
            };

            var saveRequest = function () {
                function selectedRelationshipsOutput(){
                    var relIdArr = [];
                    for(var key in vm.selectedRelationships){
                        relIdArr.push(vm.selectedRelationships[key].relationshipId);
                    }
                    return relIdArr;
                }
                vm.request.relationshipId = selectedRelationshipsOutput();
                // requestData
                var requestData;

                if (!validateRequest()) {
                    return;
                }

                notificationService.sendMessage('crs.request.message.requestSaving');

                // show loading mask
                $rootScope.showAppLoading = true;

                if (vm.inputMode === REQUEST_INPUT_MODE.SIMPLE) {
                    vm.concept = buildConceptFromRequest(vm.request);
                } else if (vm.inputMode === REQUEST_INPUT_MODE.DIRECT) {
                    buildConceptDefinitionOfChange(vm.concept, vm.request);
                }

                requestData = buildRequestData(vm.request, vm.concept);

                requestService.saveRequest(requestData)
                    .then(function () {
                        notificationService.sendMessage('crs.request.message.requestSaved', 5000);
                        $location.path(prevPage).search({});
                    }, function (e) {
                        showErrorMessage(e.message);
                    })
                    .finally(function () {
                        $rootScope.showAppLoading = false;
                    });
            };

            var saveAndSubmitRequest = function () {
                // requestData
                var requestData;

                if (!validateRequest()) {
                    return;
                }

                notificationService.sendMessage('crs.request.message.requestSubmitting');

                // show loading mask
                $rootScope.showAppLoading = true;

                if (vm.inputMode === REQUEST_INPUT_MODE.SIMPLE) {
                    vm.concept = buildConceptFromRequest(vm.request);
                } else if (vm.inputMode === REQUEST_INPUT_MODE.DIRECT) {
                    buildConceptDefinitionOfChange(vm.concept, vm.request);
                }

                requestData = buildRequestData(vm.request, vm.concept);

                requestService.saveRequest(requestData)
                    .then(function (response) {
                        var requestId = response.id;

                        return requestService.submitRequest(requestId);
                    })
                    .then(function () {
                        notificationService.sendMessage('crs.request.message.requestSubmitted', 5000);
                        $location.path(prevPage).search({});
                    }, function (e) {
                        console.log(e);
                        showErrorMessage(e.message);
                    })
                    .finally(function () {
                        $rootScope.showAppLoading = false;
                    });
            };

            var changeRequestStatus = function (requestId, requestStatus, data) {
                // show loading mask
                $rootScope.showAppLoading = true;

                notificationService.sendMessage('crs.request.message.requestProcessing');
                return requestService.changeRequestStatus(requestId, requestStatus, data)
                    .finally(function () {
                        $rootScope.showAppLoading = false;
                    });
            };

            var acceptRequest = function () {
                changeRequestStatus(vm.request.id, REQUEST_STATUS.ACCEPTED)
                    .then(function () {
                        notificationService.sendMessage('crs.request.message.requestAccepted', 5000);
                        $location.path(prevPage).search({});
                    }, function (e) {
                        showErrorMessage(e.message);
                    });
            };

            var openAssignRequestModal = function () {
                return $uibModal.open({
                    templateUrl: 'components/request/modal-assign-request.html',
                    controller: 'ModalAssignRequestCtrl as modal',
                    resolve: {
                        authors: function () {
                            return vm.authors;
                        },
                        projects: function () {
                            return vm.projects;
                        },
                        defaultSummary: function () {
                            return '';
                        }
                    }
                });
            };

            var assignRequest = function () {
                var modalInstance = openAssignRequestModal();

                modalInstance.result.then(function (rs) {
                    notificationService.sendMessage('Assigning requests');
                    requestService.assignRequests([vm.request.id], rs.project.key, ((rs.assignee)?rs.assignee.key:null), rs.summary).then(function () {
                        notificationService.sendMessage('Request assigned successfully', 5000);
                        $location.path(prevPage).search({});
                    });
                });
            };

            var acceptAndAssignRequest = function () {
                var modalInstance = openAssignRequestModal();

                modalInstance.result.then(function (rs) {
                    changeRequestStatus(vm.request.id, REQUEST_STATUS.ACCEPTED)
                        .then(function () {
                            return requestService.assignRequests([vm.request.id], rs.project.key, ((rs.assignee)?rs.assignee.key:null), rs.summary);
                        }, function (e) {
                            showErrorMessage(e.message);
                            $q.reject(e);
                        })
                        .then(function () {
                            notificationService.sendMessage('Request accepted and assigned successfully', 5000);
                            $location.path(prevPage).search({});
                        });
                });
            };

            var rejectRequest = function () {
                var modalInstance = openStatusCommentModal('reject');

                modalInstance.result.then(function (rejectComment) {
                    changeRequestStatus(vm.request.id, REQUEST_STATUS.REJECTED, {reason:rejectComment})
                        .then(function () {
                            notificationService.sendMessage('crs.request.message.requestRejected', 5000);
                            $location.path(prevPage).search({});
                        }, function (e) {
                            showErrorMessage(e.message);
                        });
                });
            };

            var rejectAppeal = function () {
                var modalInstance = openStatusCommentModal('reject');

                modalInstance.result.then(function (rejectComment) {
                    changeRequestStatus(vm.request.id, REQUEST_STATUS.APPEAL_REJECTED, {reason:rejectComment})
                        .then(function () {
                            notificationService.sendMessage('crs.request.message.requestRejected', 5000);
                            $location.path(prevPage).search({});
                        }, function (e) {
                            showErrorMessage(e.message);
                        });
                });
            };

            var requestClarification = function () {

                var modalInstance = openStatusCommentModal('needClarify');

                modalInstance.result.then(function (rejectComment) {
                    changeRequestStatus(vm.request.id, REQUEST_STATUS.CLARIFICATION_NEEDED, {reason:rejectComment})
                        .then(function () {
                            notificationService.sendMessage('crs.request.message.requestClarification', 5000);
                            $location.path(prevPage).search({});
                        }, function (e) {
                            showErrorMessage(e.message);
                        });
                });
            };

            var appealRequest = function () {
                var modalInstance = openStatusCommentModal('appeal');

                modalInstance.result.then(function (appealComment) {
                    changeRequestStatus(vm.request.id, REQUEST_STATUS.APPEAL, {reason:appealComment})
                        .then(function () {
                            notificationService.sendMessage('crs.request.message.requestAppealed', 5000);
                            $location.path(prevPage).search({});
                        }, function (e) {
                            showErrorMessage(e.message);
                        });
                });
            };

            var withdrawRequest = function () {
                var modalInstance = openStatusCommentModal('withdraw');

                modalInstance.result.then(function (withdrawComment) {
                    changeRequestStatus(vm.request.id, REQUEST_STATUS.WITHDRAWN, {reason:withdrawComment})
                        .then(function () {
                            notificationService.sendMessage('crs.request.message.requestWithdrawn', 5000);
                            $location.path(prevPage).search({});
                        }, function (e) {
                            showErrorMessage(e.message);
                        });
                });
            };

            var startEditingConcept = function (conceptObj) {
                notificationService.sendMessage('Loading concept ' + (conceptObj.name ? conceptObj.name : conceptObj.id) + ' to edit panel', 10000, null);
                snowowlService.getFullConcept(null, null, conceptObj.id).then(function (response) {
                    notificationService.sendMessage('Concept ' + response.fsn + ' successfully added to edit list', 5000, null);
                    response.definitionOfChanges = buildChangeConceptDefinitionOfChanges();
                    response.definitionOfChanges.currentFsn = response.fsn;
                    vm.originalConcept = response;
                    vm.concept = angular.copy(vm.originalConcept);
                });
            };

            var setInputMode = function (im) {
                var imObj = identifyInputMode(im);

                if (imObj !== null && imObj !== vm.inputMode) {
                    if (vm.inputMode === REQUEST_INPUT_MODE.SIMPLE &&
                        imObj === REQUEST_INPUT_MODE.DIRECT) {

                        if (!validateRequest(true)) {
                            return;
                        }

                        vm.concept = buildConceptFromRequest(vm.request);
                    }

                    vm.inputMode = imObj;
                }
            };

            var onConceptChangedDirectly = function (historyCount) {
                if (!permanentlyDisableSimpleMode) {
                    if (historyCount === 0) {
                        vm.disableSimpleMode = false;
                    } else if (historyCount > 0) {
                        vm.disableSimpleMode = true;
                    }
                }
            };

            var openStatusCommentModal = function (requestStatus) {
                return $uibModal.open({
                    templateUrl: 'components/request/modal-change-request-status.html',
                    controller: 'ModalChangeRequestStatusCtrl as modal',
                    resolve: {
                        requestStatus: function () {
                            return requestStatus;
                        }
                    }
                });
            };


            $scope.$on(CONCEPT_EDIT_EVENT.STOP_EDIT_CONCEPT, function (event, data) {
                if (!data || !data.concept) {
                    console.error('Cannot remove concept: concept must be supplied');
                    return;
                }

                if (data && data.concept.conceptId === vm.concept.conceptId) {
                    vm.originalConcept = null;
                    vm.concept = null;
                }
            });


            $scope.$watch(function () {
                return vm.inputMode;
            }, function (newVal) {
                if (newVal === REQUEST_INPUT_MODE.DIRECT) {
                    vm.inputModePage = 'components/request/request-details-edit-panel.html';
                } else if (newVal === REQUEST_INPUT_MODE.SIMPLE) {
                    vm.inputModePage = vm.requestType.form.template;
                } else {
                    vm.inputModePage = null;
                }
            });


            vm.cancelEditing = cancelEditing;
            vm.saveRequest = saveRequest;
            vm.acceptRequest = acceptRequest;
            vm.assignRequest = assignRequest;
            vm.acceptAndAssignRequest = acceptAndAssignRequest;
            vm.rejectRequest = rejectRequest;
            vm.rejectAppeal = rejectAppeal;
            vm.requestClarification = requestClarification;
            vm.saveAndSubmitRequest = saveAndSubmitRequest;
            vm.startEditingConcept = startEditingConcept;
            vm.setInputMode = setInputMode;
            vm.originalConcept = null;
            vm.onConceptChangedDirectly = onConceptChangedDirectly;
            vm.appealRequest = appealRequest;
            vm.withdrawRequest = withdrawRequest;
            vm.getAuthorName = getAuthorName;
            vm.isAdmin = false;
            vm.isViewer = false;
            vm.permissionChecked = false;
            vm.error = {};
            vm.conceptStatus = {
                loading: false,
                searching: false,
                valid: true
            };
            vm.loadingProjects = true;
            vm.loadingAuthors = true;
            vm.projects = [];
            vm.authors = [];

            $scope.panelId = 'REQUEST_DETAILS';

            initView();
        }
    ]);