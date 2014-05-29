/*
 * @Author: Myles McNamara (myles@smyl.es)
 * @Date:   2014-04-15 12:21:47
 * @Last Modified 2014-04-15
 * @Last Modified time: 2014-04-18 16:31:10
 */
var localeDataURL = "http://test.d3sunguide.com/c2c/localedata.xml";
var eventDataURL = "http://test.d3sunguide.com/c2c/eventdata.xml";
var possibleLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6', 'rightShoulder', 'leftShoulder'];
var priorityLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6'];
var shoulderLanes = ['rightshoulder', 'leftshoulder'];
// Terms to not capitalize when formatting (use lowercase version)
var doNotCapitalize = ['at', 'to', 'from'];
// Incremental values used to increase priority
var incMajorSeverity = 2;
var incMinorSeverity = 0.5;
var incPriorityEventTypes = 1;
var incPriorityLanes = 1;
var incEachAffectedLane = 0.5;
var incShoulderLanes = 5;
// Important Events will be added to top, others added to bottom
var priorityEventTypes = ['debris', 'vehiclefire'];
// Invalid types will be ignored
var invalidTypes = ['Closed', 'Weather', 'Visibility', 'Vehicle Alert'];
var processedEvents = [];

function loadEventData() {
    processedEvents = [];
    loadingSpinner();
    $.get(eventDataURL, {}, function(rawXML) {
        // Get raw XML text from ajax response
        		var xml = $(rawXML).text();
        //var xml = rawXML;
        var confirmedEvents = filterConfirmedEvents(xml);
        console.log(confirmedEvents);
        // Loop through each confirmed event
        confirmedEvents.each(function() {
            // Cache selector
            var $event = $(this);
            processEvent($event);
        });
        // Now add locale data to new array, and then call outputEvents function when complete
        addLocaleData(processedEvents, outputEvents);
    });
}

function processEvent(event) {
    var pAffectedLanes = 'None';
    var pEventPriority = 0;
    // Cache selector
    var $event = event;
    // Event Type handling
    var type = $event.find('type')[0].attributes[0].name;
    var typeDesc = $event.find('typeDesc').text();
    if (!typeDesc) typeDesc = type;
	typeDesc = camelSplit(typeDesc);
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
        var affectedLanesText = $event.find('affectedLanes').text();
        // Process affected lanes
        if (affectedLanesText) {
            var alAttributes = $event.find('affectedLanes')[0].attributes;
            processAffectedLanes(affectedLanesText, alAttributes, function(eventPriority, affectedLanes) {
                pAffectedLanes = affectedLanes;
                pEventPriority += eventPriority;
            });
			// Add only if affected lanes
			addEvent(eventID, lastUpdated, type, typeDesc, lat, lon, locationId, atisSeverity, pEventPriority, pAffectedLanes);
        }
        // Add all event to array
        // addEvent(eventID, lastUpdated, type, typeDesc, lat, lon, locationId, atisSeverity, pEventPriority, pAffectedLanes);
    }
}

function splitCoord(coord) {
	var left = coord.charCodeAt(0) === '-'.charCodeAt(0) ? '3' : '2';

	return [
		coord.substring(0, left),
		coord.substring(left)
	].join('.');

}

function addEventToMap(eventData, lat, lon){
	console.log('AddToMap: ' + splitCoord(lat) + ' / ' + splitCoord(lon));
	var point = new google.maps.LatLng(splitCoord(lat), splitCoord(lon));
	var marker = new google.maps.Marker({
		position: point,
		map: d3Map.map,
		icon: 'images/incident_b.gif'
	});
	marker.wasClicked = false;
	var infoWindow = new google.maps.InfoWindow();

	getTemplate('event-marker', function (eventTemplate) {
		var renderTemplate = Handlebars.compile(eventTemplate);
		windowHTML = renderTemplate(eventData);
	});

	function markerClick() {
		if (infoWindow.getMap() && marker.wasClicked == true) {
			infoWindow.close();
			marker.wasClicked = false;
		} else {
			marker.wasClicked = true;
		}
	}
	function markerCloseClick() {
		marker.wasClicked = false;
	}

	function markerMouseOver() {
		if (!infoWindow.getMap()) {
			infoWindow.setContent(windowHTML);
			infoWindow.open(d3Map.map, marker);
		}
	}

	function markerMouseOut() {
		if (infoWindow.getMap() && marker.wasClicked == false) {
			infoWindow.close();
		}
	}

//	if (type == 'event') {
//		EventMarkers[markerid] = marker;
//	}

	google.maps.event.addListener(marker, 'click', markerClick);
	google.maps.event.addListener(marker, 'mouseover', markerMouseOver);
	google.maps.event.addListener(marker, 'mouseout', markerMouseOut);
	google.maps.event.addListener(infoWindow, 'closeclick', markerCloseClick);
}

function addLocaleData(processedEvents, callback) {
    getLocaleData(function(xml) {
        $.each(processedEvents, function(index, value) {
            console.log(value);
            var locationId = value.locationId;
            //			Find specific locale data from locationId
            var localeData = $(xml).find('location[id="' + locationId + '"]');
            processedEvents[index]['roadway'] = localeData.find('roadway').text();
            processedEvents[index]['dir'] = localeData.find('dir').text();
            processedEvents[index]['crossStreetOffset'] = camelSplit(localeData.find('crossStreetOffset').text());
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
        callback(processedEvents);
    });
}

function outputEvents(events) {
    var outputHTML = '<ul class="ev">';
    // Check if there are any events
    if (events.length > 0) {
        var sortedEvents = sortEvents(events);
        getTemplate('event', function(eventTemplate) {
            var renderTemplate = Handlebars.compile(eventTemplate);
            $.each(sortedEvents, function(index, eventData) {
				addEventToMap(eventData, eventData.lat, eventData.lon);
                console.log(eventData);
                outputHTML += renderTemplate(eventData);
            });
            outputHTML += "</ul>";
            // Output HTML
            $('#events-content').html(outputHTML);
        });
    } else {
        getTemplate('no-events', function(noEventsTemplate) {
            var renderTemplate = Handlebars.compile(noEventsTemplate);
            outputHTML += renderTemplate();
            outputHTML += "</ul>";
            // Output HTML
            $('#events-content').html(outputHTML);
        });
    }
    // Delay stop refresh spin to make sure it gets displayed
    setTimeout(function() {
        stopRefreshSpin();
    }, 200);
}

function processAffectedLanes(affectedLanesText, alAttributes, callback) {
    var eventPriority = 0;
    var affectedLanes = [];
    if (affectedLanesText) affectedLanes.push(affectedLanesText);
    // Loop through each attribute under affectedLanes
    $.each(alAttributes, function(i, attrib) {
        var laneAffected = attrib.name;
        var isLaneAffected = attrib.value;
        if (isLaneAffected == 'true' && ($.inArray(laneAffected, possibleLanes) > -1)) {
            // Increase event priority for each lane blocked
            eventPriority += incEachAffectedLane;
            // Increase priority if lane is in priorityLanes array
            if ($.inArray(laneAffected, priorityLanes) > -1) eventPriority += incPriorityLanes;
            // Increase priority if lane is in shoulderLanes array
            if ($.inArray(laneAffected, shoulderLanes) > -1) eventPriority += incShoulderLanes;	
			
            if (!affectedLanesText) affectedLanes.push(camelSplit(laneAffected));
        }
    });
    // Callback after going through each attribute
    callback(eventPriority, affectedLanes);
}

function addEvent(eventID, lastUpdated, type, typeDesc, lat, lon, locationId, atisSeverity, pEventPriority, pAffectedLanes) {
    var eventData = {
        eventID: eventID,
        lastUpdated: lastUpdated,
        type: type,
        typeDesc: typeDesc,
        lat: lat,
        lon: lon,
        locationId: locationId,
        atisSeverity: atisSeverity,
        eventPriority: pEventPriority,
        affectedLanes: pAffectedLanes
    };
	//addEventToMap(eventData, lat, lon);
    processedEvents.push(eventData);
}
/**
 * Filter out only confirmed events
 * @param  {XML} xml XML data
 * @return {XML}     Filtered XML data
 */
function filterConfirmedEvents(xml) {
    // Get only confirmed events, discard any others
    return $(xml).find('event').filter(function() {
	console.log(this);
      return $('status', this).text() == 'Confirmed';
    });
}


function getLocaleData(callback) {
    $.get(localeDataURL, {}, function(rawXML) {
        // Get raw XML text from ajax response
        var xml = $(rawXML).text();
        //var xml = rawXML;
        callback(xml);
    });
}

function sortEvents(events) {
    events.sort(function(a, b) {
        if (a.eventPriority > b.eventPriority) return -1;
        if (a.eventPriority < b.eventPriority) return 1;
        // a must be equal to b
        return 0;
    });
    return (events);
}
