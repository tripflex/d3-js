/*
 * @Author: Myles McNamara
 * @Date:   2014-04-17 17:30:06
 */

function showEventData(){
	getTemplate('default', function (html) {
		var Events = Handlebars.compile(html);
		var templateData = {
			refresh: true,
			type: 'events',
			title: 'Current Active Events'
		};
		$('#replace2').html(Events(templateData));
		loadEventData();
	}).then(function () {
		// Attach to DOM refresh element has to happen after template has been rendered
		$('#events-refresh').click(function () {
			startRefreshSpin();
			loadEventData();
		});
	});
}

// Same as document.ready
$(function() {
    // Load full spinner while generating output
    fullSpinner();

	showEventData();

	$('.traffic').click(function(){
		showEventData();
	});

    // CCTV Tab
    $('.cctv').click(function() {
        getTemplate('cctv-list', function(html) {
            $('#replace').html(html);
        });
    });
});

function loadCameraFeed(camera) {
    fullSpinner();
    var videoURL = 'http://d3sunguide.com/videoclips/';
    var cameraFeed = $(camera).data('video');
    var cameraTitle = $(camera).data('title');
    if (!cameraTitle) cameraTitle = $(camera).text();
    videoURL += cameraFeed + '.mp4';
    getTemplate('cctv-video', function(html) {
        var LiveCCTV = Handlebars.compile(html);
        var templateData = {
            refresh: true,
            type: 'cctv-video',
            title: cameraTitle,
            streamURL: videoURL,
            video: cameraFeed
        };
        var cctvFeed = LiveCCTV(templateData);
        $('#replace2').html(cctvFeed);
    });
}

function startRefreshSpin() {
    $('.page-refresh > img').addClass('spinCircle');
}

function stopRefreshSpin() {
    $('.page-refresh > img').removeClass('spinCircle');
}

function fullSpinner() {
    $('#replace2').html('<div class="spin-wrapper"><div class="spinner"><i class="fa fa-spinner fa-3x fa-spin fa-inverse"></i></div></div>');
}

function loadingSpinner() {
    $('.default-content').html('<div class="spin-wrapper"><div class="spinner"><i class="fa fa-spinner fa-3x fa-spin fa-inverse"></i></div></div>');
}

function camelSplit(variable) {
    // insert a space before all caps
    var spacedVariable = variable.replace(/([A-Z])/g, ' $1');
    // uppercase the first character and return
    var capitalizedVariable = spacedVariable.replace(/^./, function(str) {
        return str.toUpperCase();
    });
    return doLowercaseCheck(capitalizedVariable);
}

function doLowercaseCheck(variable) {
    // Check for vars that should not be capitalized, and set them to lowercase
    var variableCheck = variable.match(/([A-Z])\w+/g);

    $.each(variableCheck, function(index, capVar) {
        if ($.inArray(capVar.toLowerCase(), doNotCapitalize) > -1) {
            variable = variable.replace(capVar, capVar.toLowerCase());
        }
    });

    return variable;
}

function getTemplate(name, callback) {
    return $.get('./templates/' + name + '.hbs').done(function(src) {
        callback(src);
    });
}

function getXML(file, callback) {
    return $.get('./xml/' + file + '.xml').done(function(src) {
        callback(xml);
    });
}
