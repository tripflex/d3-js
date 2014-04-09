$(document).ready(function(){
    var dataURL = "http://home.d3sunguide.com/test/c2c/eventdata.xml";
    $.get(dataURL, function (rawXML) {
        

		var xml = $(rawXML).text();
		
		
		$(xml).find("event").each(function(){
		
		
			var typeDesc = $(this).find('typeDesc').text();
			var status = $(this).find('status').text();
			var type = $(this).find('type')[0].attributes[0].name;
			lastUpdated = moment($(this).find('updateTimestamp').text()).fromNow();
			var lanesAffected = $(this).find('affectedLanes').text();
			
			
			if ( type == "vehiclecollision" ) {
				var typeDesc = "Crash";
			}
			if ( type == "debris" ) {
				var typeDesc = "Debris";
			}
			if ( type == "vehiclefire" ) {
				var typeDesc = "Vehicle Fire";
			}
			if ( type == "stalledvehicle" ) {
				var typeDesc = "Stalled Vehicle";
			}
			
			if ( !((status == 'Closed') || (typeDesc == 'Weather') || (typeDesc == 'Visibility') || (typeDesc == 'Vehicle Alert') )){
				$('#eventdata').append('<li class="title"> ' + typeDesc + '</li>');
				$('#eventdata').append('<li class="tvtData"> Last Updated: ' + lastUpdated + '</li>');
				if(lanesAffected != ""){
					$('#eventdata').append('<li class="tvtData"> Lanes Affected: ' + lanesAffected + '</li>');
				}
				if(lanesAffected == ""){
					$('#eventdata').append('<li class="tvtData"> Lanes Affected: ' + lanesAffected + 'None</li>');
				}
			}
			
        });
		

    });
});
