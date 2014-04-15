$(".refresh").click(function() {
    $("#replace2").load("events.html")
});

var processedEvents = [];

function AddAffectedLanesEvent(eventID, priority, lanes){
	var affectedLaneData = {
		eventID:eventID,
		priority:priority,
		updateTimestamp: updateTimestamp,
		lat: lat,
		lon: lon,
		locationID: locationID,
		type: type,
		affectedLanes: affectedLanes
	}
	processedEvents.push(affectedLaneData);
}

function processAffectedLanes(eventsToProcess){

}

$(document).ready(function() {
    var dataURL = "http://test.d3sunguide.com/c2c/eventdata.xml";

    $.get(dataURL, {}, function(rawXML) {
        // Get raw XML text from ajax response
        var xml = $(rawXML).text();

        // Get only confirmed events, discard any others
        var confirmedEvents = $(xml).find('event').filter(function() {
            return $('status', this).text() == 'Confirmed';
        });



        confirmedEvents.find('affectedLanes').each(function (){
        	var totalAffectedLanes = 0;
        	var eventPriority = 0;
        	$.each(this.attributes, function(i, attrib){
        		var laneAffected = attrib.name;
        		var isLaneAffected = attrib.value;

        		// Increase number of lanes affected
        		if($.inArray(laneAffected, possibleLanes)){
        			totalAffectedLanes++;
        		}

        		// Increase priority if lane is in priorityLanes array
        		if($.inArray(laneAffected, priorityLanes)){
        			eventPriority++;
        		}
        	});

        	var atisSeverity = $(this).find('atisSeverity');
        	var eventSeverity = atisSeverity.find('severity').text();

        	if(eventSeverity == 'Major'){
        		eventSeverity++;
        	}

        });

        // Loop through each confirmed event
        confirmedEvents.each(function() {
            // Get and format last updated timestamp
            var lastUpdated = moment($(this).find('updateTimestamp').text()).fromNow();
            var status = $(this).find('status').text();

            // Affected Lanes
            var lane = $(this).find('affectedLanes')[0].attributes[0].name;
            var lanesAffected = $(this).find('affectedLanes').text();

            var possibleLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6', 'rightShoulder', 'leftShoulder'];
            var priorityLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6'];
            var shoulderLanes = ['rightShoulder', 'leftShoulder'];

            var affectedLanesEvent = {};

            $(this).find('affectedLanes').each(this.attributes, function(i, attrib){
					var name = attrib.name;
					var value = attrib.value;

				});
			});


            // Event Types
            var type = $(this).find('type')[0].attributes[0].name;
            var typeDesc = $(this).find('typeDesc').text();
            var types = {
                vehiclecollision: 'Crash',
                debris: 'Debris',
                vehiclefire: 'Vehicle Fire',
                stalledvehicle: 'Stalled Vehicle'
            };

            // Important Events will be added to top, others added to bottom
            var importantEvents = ['debris', 'vehiclefire'];
            // Invalid types will be ignored
            var invalidTypes = ['Closed', 'Weather', 'Visibility', 'Vehicle Alert'];
            // If current event does not have type defined above, set description to Unknown (shorthand IF statement)
            (!types[type]) ? typeDesc = "Unknown Event" : typeDesc = types[type];

            // Check array values, will return index number if found, otherwise returns -1
            if ( $.inArray(typeDesc, invalidTypes) == -1 ) {
                if (!lanesAffected) lanesAffected = "None";
                var buildHTML = '<li class="title"> ' + typeDesc + '</li>';
                buildHTML += '<li class="tvtData"> Last Updated: ' + lastUpdated + '</li>';
                buildHTML += '<li class="tvtData"> Lanes Affected: ' + lanesAffected + '</li>';
                if (importantEvents.indexOf(type) != -1) {
                    $('#eventdata').prepend(buildHTML);
                } else {
                    $('#eventdata').append(buildHTML);
                }
            }

        });
    });
});
