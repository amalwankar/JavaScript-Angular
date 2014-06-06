function modalCntrl($scope){


    $scope.showModal = false;

    console.log("In the scope");

    $scope.displayModal = function(){
    	 $scope.showModal = true;
    };

    $scope.dismissModal = function(){
    	 $scope.showModal = false;
    };
}
