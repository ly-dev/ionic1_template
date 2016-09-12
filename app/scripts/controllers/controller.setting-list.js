'use strict';

/**
 * @ngdoc function
 * @name ticketscanner.controller:SettingListController
 * @description
 * # SettingListController
 */
angular.module('app')

.config(function($stateProvider) {
    $stateProvider
        .state('app.tab.setting-list', {
            url: '/setting-list',
            cache: true,
            views: {
                'setting-tab': {
                    templateUrl: 'templates/views/setting-list.html',
                    controller: 'SettingListController'
                }
            }
        });
})

.controller('SettingListController', function(AppDebug, AppHelper, AppCache, AppApi, AppSelect, AppSettingPromise, UserPromise, $scope, $state) {
    AppDebug.log('SettingListController');
    AppHelper.trackerView('Setting List');

    $scope.tabSwipe = AppHelper.tabSwipe;

    $scope.appUser = angular.copy(UserPromise);
    $scope.appUser.avatar = {};

    // prepare display name
    if ($scope.appUser.profile.first_name) {
        $scope.appUser.displayName = $scope.appUser.profile.first_name + ' ' + $scope.appUser.profile.last_name;
    } else {
        $scope.appUser.displayName = $scope.appUser.name;
    }

    AppApi.getCachedAvatar($scope.appUser.profile.avatar_file_id, $scope.appUser.avatar);

    $scope.process = function(action, params) {
        AppDebug.log(['Start process: ', action, params]);

        switch (action) {
            case 'profile-edit':
                $state.go('app.tab2.profile-edit');
                return;
                break;
            case 'password-change':
                $state.go('app.tab2.pasword-change');
                return;
                break;
            case 'logout':
                AppHelper.showConfirm({
                    title: ' Log Out',
                    template: 'Are you sure?'
                }).then(function(res) {
                    if (res) {
                        AppHelper.showConfirm({
                            title: 'Person Settings',
                            template: 'Keep all personal settings?'
                        }).then(function(res2) {
                            AppApi.logout(res2).then(function(){
                                $state.go('app.home');
                            }).catch(function(err) {
                                AppHelper.showHint('Logout failed: ' + err);
                            });
                        });
                    }
                });
                break;
            default:
                AppHelper.showHint('Invalid action!');
                break;
        }
    };

});
