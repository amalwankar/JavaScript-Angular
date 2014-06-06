function signaturePadCntrl($scope){

    $scope.$watch('signature', function(newvalue, oldvalue){
    	if(oldvalue === newvalue) return;

    	if(!Object.keys(newvalue).length) return;

    	console.log(newvalue);
    })
}