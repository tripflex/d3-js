$(document).ready(function() {
	var dataURL = "http://home.d3sunguide.com/test/c2c/eventdata.xml";
	$.get(dataURL, function(rawXML) {

		var xml = $(rawXML).text();

		$(xml).find('event').each(function() {
			var typeDesc = $(this).find('typeDesc').text();
			var status = $(this).find('status').text();
			var type = $(this).find('type')[0].attributes[0].name;
			lastUpdated = moment($(this).find('updateTimestamp').text()).fromNow();
			var lanesAffected = $(this).find('affectedLanes').text();

			var types = {
				vehiclecollision: 'Crash',
				debris: 'Debris',
				vehiclefire: 'Vehicle Fire',
				stalledvehicle: 'Stalled Vehicle'
			};

			var importantEvents = ['vehiclecollision', 'vehiclefire'];
			var invalidTypes = ['Closed', 'Weather', 'Visibility', 'Vehicle Alert'];

			// Shorthand IF Statement
			// ---------------------------------------
			// (condition) ? doiftrue : doiffalse
			// ---------------------------------------
			(!types[type]) ? typeDesc = "Unknown Event" : typeDesc = types[type];

			// Is the same as this:
			// if ($types[type]){
			// 	typeDesc = "Unknown";
			// } else {
			// 	typeDesc = types[type];
			// }

			// Check array values, will return index number if found, otherwise returns -1
			if (invalidTypes.indexOf(typeDesc) == -1 || invalidTypes.indexOf(status) == -1) {
				if (!lanesAffected) lanesAffected = "None";
				var buildHTML = '<li class="title"> ' + typeDesc + '</li><li class="tvtData"> Last Updated: ' + lastUpdated + '</li><li class="tvtData"> Lanes Affected: ' + lanesAffected + '</li>';

				if (importantEvents.indexOf(type) != -1) {
					$('#eventdata').prepend(buildHTML);
				} else {
					$('#eventdata').append(buildHTML);
				}
			}

		});
	});
});
