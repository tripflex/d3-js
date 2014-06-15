/*
 * @Author: Myles McNamara (myles@smyl.es)
 * @Date:   2014-04-15 12:21:47
 * @Last Modified 2014-04-15
 * @Last Modified time: 2014-05-30 18:54:35
 */

var processedEvents = [];

function loadEventData() {
    processedEvents = [];
    loadingSpinner();
    $.get(eventDataURL, {}, function (rawXML) {
        xml = makeValidXML(rawXML);
        var confirmedEvents = filterConfirmedEvents(xml);
//        console.log(confirmedEvents);
        // Loop through each confirmed event
        confirmedEvents.each(function () {
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
    if(type == 'unknown') type = unknownPlaceholder;
    var typeDesc = $event.find('typeDesc').text();
    if (!typeDesc) var typeDesc = type;
    if(typeDesc) typeDesc = camelSplit(typeDesc);
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
            processAffectedLanes(affectedLanesText, alAttributes, function (eventPriority, affectedLanes) {
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

function addEventToMap(eventData, lat, lon) {
    var type = 'event';
    add_marker(eventData.eventID, splitCoord(lat), splitCoord(lon), type, eventData);
}

function addLocaleData(processedEvents, callback) {
    getLocaleData(function (xml) {
        $.each(processedEvents, function (index, value) {
//            console.log(value);
            var locationId = value.locationId;
            //            Find specific locale data from locationId
            var localeData = $(xml).find('location[id="' + locationId + '"]');
            processedEvents[index]['roadway'] = localeData.find('roadway').text();
            processedEvents[index]['dir'] = localeData.find('dir').text();
            processedEvents[index]['crossStreetOffset'] = camelSplit(localeData.find('crossStreetOffset').text());
            processedEvents[index]['crossStreet'] = localeData.find('crossStreet').text();
            //            Store other locale data for future use
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
//        console.log(events);
        var sortedEvents = sortEvents(events);
        getTemplate('event', function (eventTemplate) {
            var renderTemplate = Handlebars.compile(eventTemplate);
            $.each(sortedEvents, function (index, eventData) {
                addEventToMap(eventData, eventData.lat, eventData.lon);
                outputHTML += renderTemplate(eventData);
            });
            outputHTML += "</ul>";
            // Output HTML
            $('#events-content').html(outputHTML);
        });
    } else {
        getTemplate('no-events', function (noEventsTemplate) {
            var renderTemplate = Handlebars.compile(noEventsTemplate);
            outputHTML += renderTemplate();
            outputHTML += "</ul>";
            // Output HTML
            $('#events-content').html(outputHTML);
        });
    }
    // Delay stop refresh spin to make sure it gets displayed
    setTimeout(function () {
        stopRefreshSpin();
    }, 200);
}

function processAffectedLanes(affectedLanesText, alAttributes, callback) {
    var eventPriority = 0;
    var affectedLanes = [];
    if (affectedLanesText) affectedLanes.push(affectedLanesText);
    // Loop through each attribute under affectedLanes
    $.each(alAttributes, function (i, attrib) {
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
    return $(xml).find('event').filter(function () {
        return $('status', this).text() == 'Confirmed';
    });
}


function getLocaleData(callback) {
    $.get(localeDataURL, {}, function (rawXML) {
        // Get raw XML text from ajax response
        var xml = $(rawXML).text();
        //var xml = rawXML;
        callback(xml);
    });
}

function sortEvents(events) {
    events.sort(function (a, b) {
        if (a.eventPriority > b.eventPriority) return -1;
        if (a.eventPriority < b.eventPriority) return 1;
        // a must be equal to b
        return 0;
    });
    return (events);
}
