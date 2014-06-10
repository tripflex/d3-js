/*
 * @Author: Myles McNamara
 * @Date:   2014-04-17 17:30:06
 * @Last modified by:   Myles McNamara
 * @Last Modified time: 2014-05-30 18:25:06
 */

// Same as document.ready
$(document).ready(function () {
    map_init();
    // Load full spinner while generating output
    fullSpinner();

    showEventData();

    loadDMSList();

    $('.traffic').click(function () {
        showEventData();
    });

    // CCTV Tab
    $('.cctv').click(function () {
        loadCCTVList();
    });

    // DMS Tab
    $('.dms').click(function () {
        loadDMSList();
    });

    $('#map-loading').addClass('hidden');

    doResize();

    window.onresize = function(event) {
        doResize();
    }
});

function doResize(){
    cWH = $(window).height();
    cWW = $(window).width();

    $('.map').css('height', cWH - 60 + 'px');
    $('.bodydiv').css('height', cWH - 60 + 'px');
    $('.rightnav').css('height', cWH - 60 + 'px');
    $('.righttabcontent').css('height', cWH - 350 + 'px');
}

function loadDMSList(){
    rightBottomSpinner();
    $.get('xml/dms.xml', function(xml) {
        var dmsI10 = [];
        var dmsI110 = [];
        dmsTemplateData = {};

        $(xml).find("marker").each(function() {
            var heading = $(this).find('heading').text();
            var id = $(this).find('id').text();
            var roadway = $(this).find('roadway').text().toLowerCase();
            var order = parseFloat($(this).find('order').text());

            var dmsData = {
                heading: heading,
                id: id,
                roadway: roadway,
                order: order
            };

            if(roadway === 'i-10') dmsI10.push(dmsData);
            if(roadway === 'i-110') dmsI110.push(dmsData);

        });

        dmsTemplateData.i10 = sortByOrder(dmsI10);
        dmsTemplateData.i110 = sortByOrder(dmsI110);

        getTemplate('dms-list', function (listTemplate) {
            var renderTemplate = Handlebars.compile(listTemplate);
            console.log(dmsTemplateData);
            dmsListHTML = renderTemplate(dmsTemplateData);
            $('#replace').html(dmsListHTML);
        });

    });
}

function formatCCTVid(id, roadway){
    // example: 19-7_WB or 03-1_NB or 00-6_EB or _SB

    var location = id.split('_');

    var mm = location[0].split('-');
    var direction = location[1];

    var fMM = parseInt(mm[0], 10);
    var fMMdec = parseInt(mm[1], 10);

    // Only return direction if does not include a MM
    if(!mm[1]){
        var fID = location;
    } else {
        var fID = fMM + '.' + fMMdec + ' ' + direction;
    }

    return fID;
}

function loadCCTVList(){
    rightBottomSpinner();
    $.get('xml/cctv.xml', function(xml) {
        var cctvI10 = [];
        var cctvI110 = [];
        var cctvUS98 = [];
        cctvTemplateData = {};

        $(xml).find("marker").each(function() {
            var heading = $(this).find('heading').text();
            var id = $(this).find('id').text();
            var roadway = $(this).find('roadway').text();
            var order = parseFloat($(this).find('order').text());
            var fID = formatCCTVid(id, roadway);

            var cctvData = {
                heading: heading,
                id: id,
                roadway: roadway,
                order: order,
                formattedID: fID
            };

            if(roadway === 'I-10') cctvI10.push(cctvData);
            if(roadway === 'I-110') cctvI110.push(cctvData);
            if(roadway === 'SR-196') cctvUS98.push(cctvData);

        });

        cctvTemplateData.i10 = cctvI10;
        cctvTemplateData.i110 = cctvI110;
        cctvTemplateData.us98 = cctvUS98;

        getTemplate('cctv-list', function (listTemplate) {
            var renderTemplate = Handlebars.compile(listTemplate);
            cctvListHTML = renderTemplate(cctvTemplateData);
            $('#replace').html(cctvListHTML);
        });

    });
}

function loadCameraFeed(camera, modal) {
    var id = $(camera).data('id');
    var roadway = $(camera).data('roadway');

    var cameraTitle = $(camera).data('title');

    if (!cameraTitle) cameraTitle = $(camera).text();
    var template_file = 'cctv-video';
    var wrapper = '#replace2';
    if(modal){
        template_file = 'cctv-video-modal';
        wrapper = '#cctv-video-modal .modal-body';
    }

    var fID = formatCCTVid(id, roadway);

    getTemplate(template_file, function (html) {
        var LiveCCTV = Handlebars.compile(html);
        var templateData = {
            refresh: true,
            type: 'cctv-video',
            roadway: roadway,
            id: id,
            title: cameraTitle,
            formattedID: fID
        };
        var cctvFeed = LiveCCTV(templateData);
        $(wrapper).html(cctvFeed);
    });
}

function startRefreshSpin() {
    $('.page-refresh > img').addClass('spinCircle');
}

function stopRefreshSpin() {
    $('.page-refresh > img').removeClass('spinCircle');
}

function fullSpinner() {
    $('#replace2').html('<div class="spin-wrapper"><div class="spinner"><i class="fa fa-circle-o-notch fa-3x fa-spin fa-inverse"></i></div></div>');
}

function loadingSpinner() {
    $('.default-content').html('<div class="spin-wrapper"><div class="spinner"><i class="fa fa-circle-o-notch fa-3x fa-spin fa-inverse"></i></div></div>');
}

function rightBottomSpinner() {
    $('#replace').html('<div class="spin-wrapper"><div class="spinner"><i class="fa fa-circle-o-notch fa-3x fa-spin fa-inverse"></i></div></div>');
}

function dynamicSpinner(selector, usewhite) {
    var classes = 'fa fa-circle-o-notch fa-3x fa-spin';
    if(usewhite) classes = classes + ' fa-inverse';
    $(selector).html('<div class="spin-wrapper"><div class="spinner-no-pad"><i class="' + classes + '"></i></div></div>');
}

function camelSplit(variable) {
    // insert a space before all caps
    var spacedVariable = variable.replace(/([A-Z])/g, ' $1');
    // uppercase the first character and return
    var capitalizedVariable = spacedVariable.replace(/^./, function (str) {
        return str.toUpperCase();
    });
    return doLowercaseCheck(capitalizedVariable);
}

function doLowercaseCheck(variable) {
    // Check for vars that should not be capitalized, and set them to lowercase
    var variableCheck = variable.match(/([A-Z])\w+/g);

    $.each(variableCheck, function (index, capVar) {
        if ($.inArray(capVar.toLowerCase(), doNotCapitalize) > -1) {
            variable = variable.replace(capVar, capVar.toLowerCase());
        }
    });

    return variable;
}

function getXML(file, callback) {
    return $.get('./xml/' + file + '.xml').done(function (src) {
        callback(xml);
    });
}

function makeValidXML(invalidXML) {
    xmlText = $(invalidXML).text();
    validXML = $.parseXML(xmlText);
    return validXML;
}

function getTemplate(name, callback) {
    return $.get('./templates/' + name + '.hbs').done(function (src) {
        callback(src);
    });
}

function showEventData() {
    getTemplate('default', function (html) {
        var Events = Handlebars.compile(html);
        var templateData = {
            refresh: true,
            type: 'events',
            title: langEventsListTitle
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

function sortByOrder(dataobj) {
    dataobj.sort(function (a, b) {
        if (a.order > b.order) return 1;
        if (a.order < b.order) return -1;
        // a must be equal to b
        return 0;
    });
    return (dataobj);
}

function getCCTVImageURL(roadway, id){
    d = new Date();
    return 'http://img.d3sunguide.com/cctv/CCTV_' + roadway + '_' + id + '.jpg?' + d.getTime();
}

function getCCTVImage(roadway, id, extra_classes){
    return '<img class="' + extra_classes + '" src="' + getCCTVImageURL(roadway, id) + '">';
}
