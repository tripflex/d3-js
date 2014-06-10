/*
 * @Author: Myles McNamara
 * @Date:   2014-05-29 12:20:32
 * @Last modified by:   Myles McNamara
 * @Last Modified time: 2014-05-30 19:26:28
 */

var DMSMarkers = {};
var CCTVMarkers = {};
var EventMarkers = {};
var mapCenter = new google.maps.LatLng(30.502017, -87.170594);
var map;

function map_init() {

    var myOptions = {
        zoom: 12,
        center: mapCenter,
        panControl: false,
        scaleControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map($('#map-canvas')[0], myOptions);
    bounds = new google.maps.LatLngBounds();

    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    add_marker_from_xml('dms.xml');
    add_marker_from_xml('cctv.xml');

//    $('#map-loading').addClass('hidden');

}

function add_marker_from_xml(filename) {
    $.get('xml/' + filename, function (xml) {
        var type = filename.replace('.xml', '');

        $(xml).find("marker").each(function () {
            var lat = $(this).find('lat').text(),
                lng = $(this).find('lng').text(),
                heading = $(this).find('heading').text(),
                id = $(this).find('id').text(),
                roadway = $(this).find('roadway').text().toLowerCase(),
                order = parseFloat($(this).find('order').text());

            var markerData = {
                roadway: roadway,
                heading: heading,
                id: id
            };

            add_marker(id, lat, lng, type, markerData);

        });
    });
}

function add_marker(mID, mLat, mLng, mType, mData) {
    var point = new google.maps.LatLng(parseFloat(mLat), parseFloat(mLng));
    var icon = 'images/' + mType + '.png';

   if(EventMarkers[mID]){
       EventMarkers[mID].setMap(null);
   }


    var marker = new google.maps.Marker({
        position: point,
        map: map,
        icon: icon,
        animation: google.maps.Animation.DROP
    });

    if(mType == 'event') marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);

    getTemplate(mType + '-marker', function (markerTemplate) {
        var renderTemplate = Handlebars.compile(markerTemplate);
        markerHTML = renderTemplate(mData);
        marker.wasClicked = false;
        var infoWindow = new google.maps.InfoWindow();

        infoWindow.setContent(markerHTML);

        add_map_callbacks(marker, map, infoWindow, markerHTML);

        if (mType == 'cctv') CCTVMarkers[mID] = marker;

        if (mType == 'dms') DMSMarkers[mID] = marker;

        if (mType == 'event') EventMarkers[mID] = marker;

    });
}

function add_map_callbacks(marker, map, infoWindow, markerHTML) {
    google.maps.event.addListener(marker, 'click', function () {
        if (marker.wasClicked) {
            infoWindow.close(map, marker);
            marker.wasClicked = false;
        } else {
            marker.wasClicked = true;
        }
    });

    google.maps.event.addListener(marker, 'mouseover', function () {
        infoWindow.open(map, marker);
    });

    google.maps.event.addListener(marker, 'mouseout', function () {
        if (infoWindow.getMap() && marker.wasClicked === false) {
            infoWindow.close();
        }
    });

    google.maps.event.addListener(infoWindow, 'closeclick', function () {
        marker.wasClicked = false;
    });

    google.maps.event.addDomListener(infoWindow, "domready", function () {
        camera_image_clicked(marker);
    });
}

function camera_image_clicked(marker) {
    $('.cctv-marker-link').click(function () {
        $('#cctv-video-modal').modal('show');
//        loadCameraFeed(this, true);
        var id = $(this).data('id');
        var roadway = $(this).data('roadway');
        var fID = formatCCTVid(id, roadway);
        var refreshHTML = '<div id="cctv-modal-refresh" class="page-refresh" data-id="' + id + '" data-title="' + fID + '" data-roadway="' + roadway + '"><img src="/images/refresh.png" height="20px" width="20px"></div>';

        $('#cctv-video-modal .modal-body').html(getCCTVImage(roadway, id, 'cctv-image-modal'));

        $('#videoModalLabel').html(roadway + ' ' + fID + refreshHTML);

        $('#cctv-modal-refresh').click(function () {
            console.log('clickies');
            dynamicSpinner('#cctv-video-modal .modal-body', false);
            $('#cctv-video-modal .modal-body').html(getCCTVImage($(this).data('roadway'), $(this).data('id'), 'cctv-image-modal'));
//            loadCameraFeed(this, true);
        });

    })
}
