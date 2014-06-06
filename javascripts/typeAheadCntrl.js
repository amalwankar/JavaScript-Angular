function typeAheadCntrl($scope){
	
	$scope.data = [
   {
     "id": "BD028001",
     "description": "BUILDING GEN2",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028002",
     "description": "BUILDING CB1",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028004",
     "description": "BUILDING MP1",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028005",
     "description": "BUILDING MP2",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028006",
     "description": "BUILDING DH",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028007",
     "description": "BUILDING VFD",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028429",
     "description": "BUILDING BH1",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BD028430",
     "description": "BUILDING WT1/CHOKE",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "BP000325",
     "description": "BOP DOUBLEGATE TOWNSEND ",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "CW071556",
     "description": "CATWALK JACO",
     "exclude": false,
     "statusCode": "I"
   },
   {
     "id": "DE070024",
     "description": "DERRICK",
     "exclude": false,
     "statusCode": "I"
   }];

    $scope.clearInput = function(){
        $scope.item = null;
    }
}
