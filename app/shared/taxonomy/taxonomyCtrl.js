'use strict';
angular.module('conceptRequestServiceApp.taxonomy')

  .controller('taxonomyPanelCtrl', ['$scope', '$rootScope', '$location', '$routeParams', '$q', '$http', 'notificationService',
    function ($scope) {

      // $scope.branch = 'MAIN/' + $routeParams.projectKey + ($routeParams.taskKey ? '/' + $routeParams.taskKey : '');

      // initialize with root concept (triggers rendering of full SNOMEDCT hierarchy)
      $scope.rootConcept = null;

      /**
       * Drag and drop object
       * @param conceptId the concept to be dragged
       * @returns {{id: *, name: null}}
       */
      $scope.getConceptPropertiesObj = function (concept) {
        console.debug('Getting concept properties obj', concept);
        return {id: concept.id, name: concept.fsn};
      };

      // watch for viewTaxonomy events
      $scope.$on('viewTaxonomy', function(event, data) {
         $scope.rootConcept = data.concept;
      });

      $scope.clearConcept = function() {
        $scope.rootConcept = null;
      };
    }]);