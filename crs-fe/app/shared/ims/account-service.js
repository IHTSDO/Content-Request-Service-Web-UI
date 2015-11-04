'use strict';

angular
    .module('conceptRequestServiceApp.imsAuthentication')
    .value('LOGIN_STATUS', {
        UNDEFINED: 0,
        LOGGED_IN: 1,
        LOGGED_OUT: 2
    })
    .factory('accountService', [
        'LOGIN_STATUS',
        '$q',
        '$http',
        'configService',
        function (LOGIN_STATUS, $q, $http, configService) {
            var loginStatus = LOGIN_STATUS.UNDEFINED;
            var accountDetails = null;

            var imsEndpoint = configService.getEndpointConfig('ims');

            var isCredentialChecked = function () {
                return loginStatus !== LOGIN_STATUS.UNDEFINED;
            };

            var isUserLoggedIn = function () {
                return loginStatus === LOGIN_STATUS.LOGGED_IN;
            };

            var getLoginStatus = function () {
                return loginStatus;
            };

            var checkCredential = function () {
                // by re-loading account details
                accountDetails = null;

                return getAccountInfo().then(function () {
                    if (accountDetails === null) {
                        loginStatus = LOGIN_STATUS.LOGGED_OUT;
                    } else {
                        loginStatus = LOGIN_STATUS.LOGGED_IN;
                    }
                }, function () {
                    loginStatus = LOGIN_STATUS.LOGGED_OUT;
                });
            };

            var getAccountInfo = function () {
                var getAccountAPI = 'api/account';
                var deferred = $q.defer();

                if (accountDetails !== null) {
                    deferred.resolve(accountDetails);
                    return deferred.promise;
                }

                return $http.get(imsEndpoint + getAccountAPI, {withCredentials: true})
                    .success(function (data) {
                        accountDetails = data;
                    })
                    .error(function () {
                        accountDetails = null;
                    });
            };

            var getUserPreferences = function () {
                var deferred = $q.defer();
                var mockedUserPref = {};

                deferred.resolve(mockedUserPref);

                return deferred.promise;
            };

            var applyUserPreferences = function () {
                var deferred = $q.defer();
                var mockedUserPref = {};

                deferred.resolve(mockedUserPref);

                return deferred.promise;
            };

            return {
                isCredentialChecked: isCredentialChecked,
                checkCredential: checkCredential,
                isUserLoggedIn: isUserLoggedIn,
                getLoginStatus: getLoginStatus,
                getAccountInfo: getAccountInfo,
                getUserPreferences: getUserPreferences,
                applyUserPreferences: applyUserPreferences
            };
        }
    ]);