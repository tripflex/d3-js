/*
 * @Author: Myles McNamara (myles@smyl.es)
 * @Date:   2014-04-15 12:21:47
 * @Last Modified 2014-04-15
 * @Last Modified time: 2014-04-15 21:45:02
 */
var localeDataURL = "c2c/localedata.xml";
var eventDataURL = "c2c/eventdata.xml";

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
//		console.log(confirmedEvents);
		// Loop through each confirmed event
		confirmedEvents.each(function() {
			// Cache selector
			var $event = $(this);
			processEvent($event);
		});
		addLocaleData(processedEvents, outputEvents);
	});
});
function addLocaleData(processedEvents, callback){
	getLocaleData(function(xml){
		$.each(processedEvents, function(index, value){
			var locationId = value.locationId;
//			Find specific locale data from locationId
			var localeData = $(xml).find('location[id="' + locationId + '"]');
			processedEvents[index]['roadway'] = localeData.find('roadway').text();
			processedEvents[index]['dir'] = localeData.find('dir').text();
			processedEvents[index]['crossStreetOffset'] = localeData.find('crossStreetOffset').text();
			processedEvents[index]['crossStreet'] = localeData.find('crossStreet').text();

//			Store other locale data for future use
			processedEvents[index]['mileMarker'] = localeData.find('mileMarker').text();
			processedEvents[index]['exitNumber'] = localeData.find('exitNumber').text();
			processedEvents[index]['exitSuffix'] = localeData.find('exitSuffix').text();

//          Store alternate route data for future use
			var alternateRoutes = {
				primary: {
					shortName: localeData.find('alternateRoutes > primary > shortName').text(),
					description: localeData.find('alternateRoutes > primary > description').text()
				},
				secondary: {
					shortName: localeData.find('alternateRoutes > secondary > shortName').text(),
					description: localeData.find('alternateRoutes > secondary > description').text()
				}
			};
			processedEvents[index]['alternateRoutes'] = alternateRoutes;
		});
	});
	callback(processedEvents);
}
function outputEvents(events) {
	var sortedEvents = sortEvents(events);
	getTemplate('event', function(eventTemplate){
		var renderTemplate = Handlebars.compile(eventTemplate);
		$.each(sortedEvents, function(index, eventData){
//			console.log(eventData);
			$('#eventdata').append(renderTemplate(eventData));
		});
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
	console.log(event);
	// Cache selector
	var $event = event;

	// Event Type handling
	var type = $event.find('type')[0].attributes[0].name;
	var typeDesc = $event.find('typeDesc').text();
	// If current event does not have type defined above, set description to Unknown (shorthand IF statement)
	(!types[type]) ? typeDesc = "Event" : typeDesc = types[type];

	// Omit processing invalid event types
	if ($.inArray(typeDesc, invalidTypes) == -1) {
		var eventID = $event[0].getAttribute('id');
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
			processAffectedLanes(alAttributes, function(eventPriority, affectedLanes) {
				pAffectedLanes = affectedLanes;
				pEventPriority += eventPriority;
			});
		}

		// Add event to array
		addEvent(eventID, lastUpdated, typeDesc, lat, lon, locationId, atisSeverity, pEventPriority, pAffectedLanes);
	}

}

function getLocaleData(callback) {
	$.get(localeDataURL, {}, function(rawXML) {
		// Get raw XML text from ajax response
//		var xml = $(rawXML).text();
		callback(rawXML);
	});
}

function getTemplate(name, callback) {
	return $.get(name + '.hbs').done(function(src) {
		callback(src);
	});
}

function sortEvents(events){
	events.sort(function (a, b) {
		if (a.eventPriority > b.eventPriority)
			return -1;
		if (a.eventPriority < b.eventPriority)
			return 1;
		// a must be equal to b
		return 0;
	});
	return(events);
}

$(".refresh").click(function() {
	$("#replace2").load("events.html")
});
