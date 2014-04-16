/*
 * @Author: Myles McNamara (myles@smyl.es)
 * @Date:   2014-04-15 12:21:47
 * @Last Modified 2014-04-15
 * @Last Modified time: 2014-04-16 14:30:09
 */
var localeDataURL = "sample-localedata.xml";
var eventDataURL = "sample-eventdata.xml";

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

$(document).ready(function() {
	$.get(eventDataURL, {}, function(rawXML) {
		// Get raw XML text from ajax response
		// var xml = $(rawXML).text();

		var confirmedEvents = filterConfirmedEvents(rawXML);

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

function outputEvents(events) {
	var newHTML = [];
	$.each(events, function(index, value) {
		console.log(value);
	});
}

function processAffectedLanes(alAttributes, callback) {
	var eventPriority = 0;
	var affectedLanes = [];
	// Loop through each attribute under affectedLanes
	$.each(alAttributes, function(i, attrib) {
		var laneAffected = attrib.name;
		var isLaneAffected = attrib.value;
		console.log('laneAffected: ' + laneAffected);
		console.log('isLaneAffected: ' + isLaneAffected);
		if (isLaneAffected == 'true' && $.inArray(laneAffected, possibleLanes)) {
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

/**
 * Filter out only confirmed events
 * @param  {XML} xml XML data
 * @return {XML}     Filtered XML data
 */
function filterConfirmedEvents(xml) {
	// Get only confirmed events, discard any others
	return $(xml).find('event').filter(function () {
		return $('status', this).text() == 'Confirmed';
	});
}

var processedEvents = [];

function addEvent(eventID, lastUpdated, typeDesc, lat, lon, locationId, atisSeverity, pEventPriority, pAffectedLanes) {
	var eventData = {
		eventID: eventID,
		lastUpdated: lastUpdated,
		typeDesc: typeDesc,
		lat: lat,
		lon: lon,
		locationId: locationId,
		atisSeverity: atisSeverity,
		eventPriority: pEventPriority,
		affectedLanes: pAffectedLanes
	};
	processedEvents.push(eventData);
}

function processEvent(event) {
	var pAffectedLanes = 'None';
	var pEventPriority = 0;

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
		var atisSeverity = $event.find('atisSeverity > severity').text();

		// Increase priority if event is in priorityEventTypes array
		if (priorityEventTypes.indexOf(type) != -1) pEventPriority += incPriorityEventTypes;
		// Increase priority based on severity
		if (atisSeverity == 'Major') pEventPriority += incMajorSeverity;
		if (atisSeverity == 'Minor') pEventPriority += incMinorSeverity;

		// Check if lanes are affected
		var alAttributesCheck = $event.find('affectedLanes').text();

		// Process affected lanes
		if (alAttributesCheck) {
			var alAttributes = $event.find('affectedLanes')[0].attributes;
			console.log('Start processing with attributes:');
			console.log(alAttributes);
			processAffectedLanes(alAttributes, function(eventPriority, affectedLanes) {
				console.log(affectedLanes);
				console.log(eventPriority);
				pAffectedLanes = affectedLanes;
				pEventPriority += eventPriority;
			});
		}
		console.log('after if');

		console.log('add event');
		// Add event to array
		addEvent(eventID, lastUpdated, typeDesc, lat, lon, locationId, atisSeverity, pEventPriority, pAffectedLanes);
	}

}

function getLocaleData() {
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
