'use strict';

angular.module('conceptRequestServiceApp.request')
    .service('requestMetadataService', [
        '$q',
        'REQUEST_METADATA_KEY',
        function ($q, REQUEST_METADATA_KEY) {
            var metadata = {};

            // Source Terminology
            metadata[REQUEST_METADATA_KEY.SOURCE_TERMINOLOGY] = [
                'SNOMED CT International',
                'SNOMED CT Canadian English Extension',
                'SNOMED CT Canadian French Extension'
            ];

            // Semantic Tag
            metadata[REQUEST_METADATA_KEY.SEMANTIC_TAG] = [
                'administrative concept',
                'assessment scale',
                'attribute',
                'body structure',
                'cell',
                'cell structure',
                'disorder',
                'environment',
                'environment location',
                'ethnic group',
                'event',
                'finding',
                'geographic location',
                'inactive concept',
                'life style',
                'link assertion',
                'linkage concept',
                'morphologic abnormality',
                'namespace concept',
                'observable entity',
                'occupation',
                'organism',
                'person',
                'physical force',
                'physical object',
                'procedure',
                'product',
                'qualifier value',
                'racial group',
                'record artifact',
                'regime/therapy',
                'religion/philosophy',
                'situation',
                'social concept',
                'specimen',
                'staging scale',
                'substance',
                'tumor staging'
            ];

            // Case Significance
            metadata[REQUEST_METADATA_KEY.CASE_SIGNIFICANCE] = [
                {value: 'ENTIRE_TERM_CASE_SENSITIVE', text: 'Entire term case sensitive'},
                {value: 'CASE_INSENSITIVE', text: 'Entire term case insensitive'},
                {value: 'INITIAL_CHARACTER_CASE_INSENSITIVE', text: 'Only initial character case insensitive'},
            ];

            // Relationship Type
            metadata[REQUEST_METADATA_KEY.RELATIONSHIP_TYPE] = [
                'Is a',
                'Access',
                'Associated finding',
                'Associated morphology',
                'Associated procedure',
                'Associated with',
                'After',
                'Causative agent',
                'Due to',
                'Clinical course',
                'Component',
                'Direct device',
                'Direct morphology',
                'Direct substance',
                'Episodicity',
                'Finding context',
                'Finding informer',
                'Finding method',
                'Finding site',
                'Has active ingredient',
                'Has definitional manifestation',
                'Has dose form',
                'Has focus',
                'Has intent',
                'Has interpretation',
                'Has specimen',
                'Indirect device',
                'Indirect morphology',
                'Interprets',
                'Laterality',
                'Measurement method',
                'Method',
                'Occurrence',
                'Pathological process',
                'Priority',
                'Procedure context',
                'Procedure device',
                'Procedure morphology',
                'Procedure site',
                'Procedure site - Direct',
                'Procedure site - Indirect',
                'Property',
                'Recipient category',
                'Revision status',
                'Route of administration',
                'Scale type',
                'Severity',
                'Specimen procedure',
                'Specimen source identity',
                'Specimen source morphology',
                'Specimen source topography',
                'Specimen substance',
                'Subject of information',
                'Subject relationship context',
                'Surgical approach',
                'Temporal context',
                'Time aspect',
                'Type of',
                'Using device',
                'Using access device',
                'Using energy',
                'Using substance'
            ];

            // Destination Terminology
            metadata[REQUEST_METADATA_KEY.DESTINATION_TERMINOLOGY] = [
                'SNOMED CT International',
                'SNOMED CT Canadian Extension'
            ];

            // Characteristic Types
            metadata[REQUEST_METADATA_KEY.CHARACTERISTIC_TYPE] = [
                'Defining relationship',
                'Qualifying relationship',
                'Additional relationship'
            ];

            // Refinabilities
            metadata[REQUEST_METADATA_KEY.REFINABILITY] = [
                'Not refinable',
                'Optional',
                'Mandatory'
            ];

            // Concept History Attributes
            metadata[REQUEST_METADATA_KEY.CONCEPT_HISTORY_ATTRIBUTE] = [
                'Maybe a',
                'Moved From',
                'Moved To',
                'Replaced By',
                'Same As',
                'Was a'
            ];

            // New Concept Statuses
            metadata[REQUEST_METADATA_KEY.NEW_CONCEPT_STATUS] = [
                // 'Active',
                // 'Inactivate without a stated reason',
                // 'Duplicate',
                // 'Outdated',
                // 'Erroneous',
                // 'Limited',
                // 'Inappropriate',
                // 'Concept inactive',
                // 'Moved elsewhere'
                'Ambiguous',
                'Duplicate',
                'Erroneous',
                'Limited',
                'Moved elsewhere',
                'Outdated',
                'Pending move',
                'Retired'
            ];

            // New Description Statuses
            metadata[REQUEST_METADATA_KEY.NEW_DESCRIPTION_STATUS] = [
                'Ambiguous',
                'Duplicate',
                'Erroneous',
                'Limited',
                'Moved elsewhere',
                'Outdated',
                'Pending move',
                'Retired'
            ];

            // New Relationship Statuses
            metadata[REQUEST_METADATA_KEY.NEW_RELATIONSHIP_STATUS] = [
                'Ambiguous',
                'Duplicate',
                'Erroneous',
                'Limited',
                'Moved elsewhere',
                'Outdated',
                'Pending move',
                'Retired'
            ];

            var getMetadata = function (metadataKeys) {
                var deferred = $q.defer(),
                    keyArray,
                    rtMetadata = {};

                if (metadataKeys === undefined || metadataKeys === null) {
                    rtMetadata = angular.copy(metadata);
                } else {
                    if (angular.isString(metadataKeys)) {
                        keyArray = [metadataKeys];
                    } else if (angular.isArray(metadataKeys)) {
                        keyArray = metadataKeys;
                    }

                    angular.forEach(metadataKeys, function (key) {
                        if (angular.isString(key) && metadata.hasOwnProperty(key)) {
                            rtMetadata[key] = angular.copy(metadata[key]);
                        }
                    });
                }

                deferred.resolve(rtMetadata);

                return deferred.promise;
            };

            return {
                getMetadata: getMetadata
            };

        }]);