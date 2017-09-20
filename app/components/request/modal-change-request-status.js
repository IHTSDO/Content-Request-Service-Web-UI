'use strict';
angular.module('conceptRequestServiceApp.request')
    .controller('ModalChangeRequestStatusCtrl', [
        '$rootScope',
        '$scope',
        '$uibModalInstance',
        'requestStatus',
        'STATISTICS_STATUS',
        function ($rootScope, $scope, $uibModalInstance, requestStatus, STATISTICS_STATUS) {
            var vm = this;

            /*var hideErrorMessage = function () {
                vm.msgError = null;
            };*/

            var hideSuccessMessage = function () {
                vm.msgSuccess = null;
            };

            var showErrorMessage = function (msg) {
                hideSuccessMessage();
                vm.msgError = msg;
            };

            /*var showSuccessMessage = function (msg) {
                hideErrorMessage();
                vm.msgSuccess = msg;
            };*/

            var closeModal = function () {
                $uibModalInstance.dismiss('cancel');
            };

            var changeRequestStatus = function () {
                if (vm.requestStatus === STATISTICS_STATUS.ON_HOLD.value || vm.requestStatus === STATISTICS_STATUS.WAITING_FOR_INTERNAL_INPUT.value){
                    $uibModalInstance.close({
                        reason: vm.comment,
                        internal: vm.internal
                    });
                    return;
                }
                if (vm.comment) {
                    $uibModalInstance.close(vm.comment);
                } else if(vm.requestStatus === 'changeSNOMEDCode'){
                    if(window.confirm("Are you sure to change Local SNOMED CT Code to blank value?")){
                        $uibModalInstance.close(vm.comment);
                    }
                }else{
                    showErrorMessage('crs.request.requestStatusModal.message.error.commentRequired');
                }
            };

            vm.msgSuccess = null;
            vm.msgError = null;
            vm.internal = false;
            vm.changeRequestStatus = changeRequestStatus;
            vm.closeModal = closeModal;
            vm.requestStatus = requestStatus;
        }]
    );
