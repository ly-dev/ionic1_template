'use strict';

/**
 * @ngdoc function
 * @name ticketscanner.controller:LoginController
 * @description
 * # LoginController
 */
angular.module('app')

.config(function($stateProvider) {
    $stateProvider
        .state('app.login', {
            url: '/login',
            cache: false,
            templateUrl: 'templates/views/login.html',
            controller: 'LoginController',
            resolve: {
                LogoutPromise: function(AppApi) {
                    return AppApi.logout(true);
                }
            }
        });
})

.controller('LoginController', function(AppDebug, AppHelper, AppCache, AppApi, AppSettingPromise, $scope, $state) {
    AppDebug.log('LoginController');

    var modalTerms = null;

    $scope.formData = {
        email: '',
        password: ''
    };
    $scope.formErrors = {};
    $scope.formTemp = {};

    $scope.process = function(action, params) {
        AppDebug.log(['Start process: ', action, params]);

        switch (action) {
            case 'show-term':
                if (modalTerms) {
                    modalTerms.show();
                } else {
                    modalTerms = AppHelper.createModalFromTemplateUrl('templates/modals/terms-and-conditions.html', {
                        scope: $scope,
                        backdropClickToClose: false,
                        hardwareBackButtonClose: false
                    }).then(function(modal) {
                        modalTerms = modal;
                        modalTerms.show();
                    });
                }
                return;
            case 'hide-term':
                modalTerms.hide();
                return;
            case 'login':
                $scope.formErrors = {};
                params = angular.copy($scope.formData);

                AppHelper.validateInput('required', params.email, $scope.formErrors, 'email', 'Email is required');
                AppHelper.validateInput('email', params.email, $scope.formErrors, 'email', 'Email is not valid');
                AppHelper.validateInput('required', params.password, $scope.formErrors, 'email', 'Password is required');
                break;
            case 'reset-password':
                $scope.formErrors = {};
                params = angular.copy($scope.formData);

                AppHelper.validateInput('required', params.email, $scope.formErrors, 'email', 'Email is required');
                AppHelper.validateInput('email', params.email, $scope.formErrors, 'email', 'Email is not valid');
                break;
            default:
                AppHelper.showHint('Invalid action!');
                return;
        }

        if (AppHelper.lodash.isEmpty($scope.formErrors)) {
            AppHelper.showLoading();
            AppApi.process(action, params).then(function(result) {
                AppHelper.hideLoading();
                if (result['#status'] === 'success') {

                    switch (action) {
                        case 'login':
                            var doc = AppHelper.lodash.merge(result['#data'], {
                                _id: AppCache.DOC.APP_USER
                            });
                            AppCache.appPut(doc).then(function(dbResult) {
                                $state.go('app.home');
                            });
                            break;
                        case 'reset-password':
                            AppHelper.showAppNotification({
                                title: 'Success!',
                                content: result['#message']
                            });
                            break;
                    }
                } else {
                    var message = '<h2>' + result['#message'] + '</h2><p>' + AppHelper.errorsToMessage(result['#errors']) + '</p>';
                    AppHelper.showHint(message);
                }
            }).catch(function(err) {
                AppHelper.hideLoading();
                AppDebug.log(err);
            });
        } else {
            var message = '<h2>Please revise input</h2><p>' + AppHelper.errorsToMessage($scope.formErrors) + '</p>';
            AppHelper.showHint(message);
        }
    };

    $scope.$on('$destroy', function() {
        if (modalTerms) {
            modalTerms.remove();
        }
    });
});
