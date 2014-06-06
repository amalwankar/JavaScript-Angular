'use strict';

angular.module('fieldpdp')
  .service('network', function ($rootScope) {
      var NetworkConnectivityLevel = Windows.Networking.Connectivity.NetworkConnectivityLevel;

      var profiles = Windows.Networking.Connectivity.NetworkInformation.getConnectionProfiles(),
          internetProfile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();

      var status = null;

      function isConnected() {
          return profiles.some(function (profile) {
              return profile.getNetworkConnectivityLevel() === NetworkConnectivityLevel.internetAccess;
          }) || (internetProfile && internetProfile.getNetworkConnectivityLevel() === NetworkConnectivityLevel.internetAccess);
      }

      Windows.Networking.Connectivity.NetworkInformation.addEventListener('networkstatuschanged', function () {
          var newStatus = isConnected();
          // Only broadcast the event if the network status has changed
          if (newStatus !== status) {
              status = newStatus;
              $rootScope.$broadcast('network:changed', status);
          }
      });

      return {
          isConnected: isConnected
      };
  });