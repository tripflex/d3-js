/*
*
* FDOT District 3 Website Configuration File
*
* @Author: Myles McNamara
* @Date:   2014-05-30 13:15:41
* @Last Modified by:   Myles McNamara
* @Last Modified time: 2014-05-30 14:06:44
*/

var imgIncidentIcon = 'images/incident_b.gif';
var imgSR196Chevron = 'images/us_98_small.png';
var imgSR196Chevron = 'images/us_98_small.png';
var imgI110Chevron = 'images/i-110_small.png';
var imgI10Chevron = 'images/i-10_small.png';

var langEventsListTitle = 'Current Active Events';

// If event type is unknown, this placeholder will be used instead
var unknownPlaceholder = 'Lane Blockage';

// Event types that will be given higher/lower priority based on value of incPriorityEventTypes below
var priorityEventTypes = ['debris', 'vehiclefire'];

// Event types that will be ignored and not added to event list or map
var invalidTypes = ['Closed', 'Weather', 'Visibility', 'Vehicle Alert'];

// Lanes must be in this array otherwise it will not be considered a lane
var possibleLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6', 'rightShoulder', 'leftShoulder'];

// These lanes will be given higher/lower priority based on value of incPriorityLanes below
var priorityLanes = ['entranceRamp', 'hovLane', 'exitRamp', 'lane1', 'lane2', 'lane3', 'lane4', 'lane5', 'lane6'];

// These shoulder lanes will be given higher/lower priority based on value of incShoulderLanes below
var shoulderLanes = ['rightshoulder', 'leftshoulder'];

// Terms to not capitalize when formatting (use lowercase version)
var doNotCapitalize = ['at', 'to', 'from'];

// ----- Priority Adjustments -----
// Incremental values used to increase priority of events
// Events will be listed from high (largest number) to low (smallest number) priority
//
// You can use any type of integer (negative, decimal, etc..)
var incMajorSeverity = 2;
var incMinorSeverity = 0.5;
var incPriorityEventTypes = 1;
var incPriorityLanes = 1;
var incEachAffectedLane = 0.5;
var incShoulderLanes = 5;

// URLs to load XML data from
var localeDataURL = "../c2c/localedata.xml";
var eventDataURL = "../c2c/eventdata.xml";
