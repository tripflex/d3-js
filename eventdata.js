var localeDataURL = "http://test.d3sunguide.com/c2c/localedata.xml";
var eventDataURL = "http://test.d3sunguide.com/c2c/eventdata.xml";
var processedEvents = [];
var possibleLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6', 'rightShoulder', 'leftShoulder'];
var priorityLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6'];
var shoulderLanes = ['rightShoulder', 'leftShoulder'];

// Incremental values used to increase priority
var incMajorSeverity = 2;
var incMinorSeverity = 0;
var incPriorityEventTypes = 0;
var incPriorityLanes = 1;
var incEachAffectedLane = 1;

// Important Events will be added to top, others added to bottom
var priorityEventTypes = ['debris', 'vehiclefire'];
// Invalid types will be ignored
var invalidTypes = ['Closed', 'Weather', 'Visibility', 'Vehicle Alert'];
// Define types
var types = {
    vehiclecollision: 'Crash',
    debris: 'Debris',
    vehiclefire: 'Vehicle Fire',
    stalledvehicle: 'Stalled Vehicle'
};

function processAffectedLanes(affectedLanesObj, callback) {
        var eventPriority = 0;
        var affectedLanes = [];

        // Loop through each attribute under affectedLanes
        $.each(affectedLanesObj.attributes, function(i, attrib) {
            var laneAffected = attrib.name;
            var isLaneAffected = attrib.value;

            if(isLaneAffected == true && $.inArray(laneAffected, possibleLanes)){
            	// Increase event priority for each lane blocked
            	eventPriority += incEachAffectedLane;
            	// Increase priority if lane is in priorityLanes array
            	if ($.inArray(laneAffected, priorityLanes)) eventPriority += incPriorityLanes;
            	affectedLanes.push(laneAffected);
            }
        });
        // Callback after going through each attribute
        callback(eventPriority, affectedLanes);
}

function filterConfirmedEvents(xml){
    // Get only confirmed events, discard any others
    var confirmedEvents = $(xml).find('event').filter(function() {
        return $('status', this).text() == 'Confirmed';
    });

    return confirmedEvents;
}

function addEvent(eventID, lastUpdated, typeDesc, lat, lon, locationId, atisSeverity, processEventPriority, processAffectedLanes) {
    var eventData = {
        eventID: eventID,
        lastUpdated: lasteUpdated,
        typeDesc: typeDesc,
        lat: lat,
        lon: lon,
        locationId: locationId,
        atisSeverity: atisSeverity,
        eventPriority: processEventPriority,
        affectedLanes: processAffectedLanes
    }
    processedEvents.push(eventData);
}

$(document).ready(function() {
    $.get(eventDataURL, {}, function(rawXML) {
        // Get raw XML text from ajax response
        var xml = $(rawXML).text();

        var confirmedEvents = filterConfirmedEvents(xml);

        // Loop through each confirmed event
        confirmedEvents.each(function() {
			// Cache selector
			var $event = $(this);
            processEvent($event);
        });
        // After processing all events, output event html
        outputEvents(processedEvents);
    });
});

function processEvent(event) {
	var processAffectedLanes = 'None';
	var processEventPriority = 0;

	// Cache selector
	var $event = event;

    // Event Type handling
    var type = $event.find('type')[0].attributes[0].name;
    var typeDesc = $event.find('typeDesc').text();
    // If current event does not have type defined above, set description to Unknown (shorthand IF statement)
    (!types[type]) ? typeDesc = "Event" : typeDesc = types[type];

	// Omit processing invalid event types
    if ($.inArray(typeDesc, invalidTypes) == -1) {
    	var eventID = $event.find('event[id]').text();
    	// Location
	    var lat = $event.find('lat').text();
	    var lon = $event.find('lon').text();
	    var locationId = $event.find('locationId').text();
	    // Get and format last updated timestamp
    	var lastUpdated = moment($event.find('updateTimestamp').text()).fromNow();
    	// Severity
    	var atisSeverity = $event.find('atisSeverity > severity');
    	// Check if lanes are affected
    	var affectedLanesObj = $event.find('affectedLanes');
    	// Process affected lanes
    	if(affectedLanesObj){
			processAffectedLanes(affectedLanesObj, function(eventPriority, affectedLanes){
				processAffectedLanes = affectedLanes;
				processEventPriority = eventPriority;
			});
		}
		// Increase priority if event is in priorityEventTypes array
		if (priorityEventTypes.indexOf(type) != -1) processEventPriority += incPriorityEventTypes;
		// Increase priority based on severity
		if (atisSeverity == 'Major') processEventPriority += incMajorSeverity;
		if (atisSeverity == 'Minor') processEventPriority += incMinorSeverity;

		// Add event to array
		addEvent(eventID, lastUpdated, typeDesc, lat, lon, locationId, atisSeverity, processEventPriority, processAffectedLanes);
    }

}

function getLocaleData(){
    $.get(dataURL, {}, function(rawXML) {
        // Get raw XML text from ajax response
        var xml = $(rawXML).text();

    });
        var buildHTML = '<li class="title"> ' + typeDesc + '</li>';
        buildHTML += '<li class="tvtData"> Last Updated: ' + lastUpdated + '</li>';
        buildHTML += '<li class="tvtData"> Lanes Affected: ' + lanesAffected + '</li>';
}

$(".refresh").click(function() {
    $("#replace2").load("events.html")
});
