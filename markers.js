/*
 * @Author: Myles McNamara
 * @Date:   2014-02-28 13:52:29
 * @Last Modified by:   Myles McNamara
 * @Last Modified time: 2014-03-10 16:22:28
 */

/**
 * Run when entire DOM (webpage) is loaded and ready
 */

var DMSMarkers = {};
var CamerasMarkers = {};

$(document).ready(function() {

    /**
     * Set starting Lat and Long
     * @type {google}
     */
    var myLatLng = new google.maps.LatLng(30.495053, -87.229276);

    /**
     * Initialize the map
     */
    d3Map.init('#map-canvas', myLatLng, 12, false, false);

    /**
     * Add DMS markers to map from xml/dms.xml file
     */
    d3Map.placeMarkers('dms.xml');

    /**
     * Add CCTV markers to map from xml/cameras.xml file
     */
    d3Map.placeMarkers('cameras.xml');

    $('#dmsimages img').mouseover(function() {
        markerid = $(this).data('markerid');
        showmarker = DMSMarkers[markerid];
        google.maps.event.trigger(showmarker, 'mouseover');
    });
    $('#dmsimages img').mouseout(function() {
        markerid = $(this).data('markerid');
        showmarker = DMSMarkers[markerid];
        google.maps.event.trigger(showmarker, 'mouseout');
    });
    $('#dmsimages img').click(function() {
        markerid = $(this).data('markerid');
        showmarker = DMSMarkers[markerid];
        google.maps.event.trigger(showmarker, 'click');
    });
});

/**
 * Create empty d3Map object
 * @type {Object}
 */
var d3Map = {
    map: null,
    bounds: null
}
/**
 * Initialize D3 Map
 * @param  {string} selector jQuery like selector to use IE #myid or .myclass
 * @param  {object} latLng   maps object with starting lat and long
 * @param  {integer} zoom     zoom integer
 * @param  {boolean} pan      true or false for pan controls
 * @param  {boolean} scale    true or false for scale controls
 */
d3Map.init = function(selector, latLng, zoom, pan, scale) {
    var myOptions = {
        zoom: zoom,
        center: latLng,
        panControl: pan,
        scaleControl: scale,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    this.map = new google.maps.Map($(selector)[0], myOptions);
    this.bounds = new google.maps.LatLngBounds();
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(this.map);
}

/**
 * Set placemarkers on map
 * @param  {string} filename XML filename to use for marker details (must place in xml directory)
 */
d3Map.placeMarkers = function(filename) {

    /**
     * Get marker data from XML file
     * @param  {string} filename XML file to get data from
     */
    $.get('xml/' + filename, function(xml) {

        /**
         * Go through each XML element and create markers
         */
        $(xml).find("marker").each(function() {

            /**
             * Get chevron image url from XML
             * @type {string}
             */
            var chevron = $(this).find('chevron').text();

            /**
             * Get heading message from XML
             * @type {string}
             */
            var heading = $(this).find('heading').text();

            /**
             * Get main image url from XML
             * @type {string}
             */
            var image = $(this).find('image').text();

            /**
             * Marker ID for external activation of info window
             */
            var markerid = $(this).find('id').text();

            /**
             * Remove .xml from filename to use in div class
             * @type {string}
             */
            var type = filename.replace('.xml', '');

            /**
             * Set icon from type
             * @type {String}
             */
            var typeicon = 'images/' + type + '.png';

            /**
             * Get latitude from XML
             * @type {string}
             */
            var lat = $(this).find('lat').text();

            /**
             * Get longitude from XML
             * @type {string}
             */
            var lng = $(this).find('lng').text();

            /**
             * Create object with lat and long
             * @type {google}
             */
            var point = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

            /**
             * extend the bounds to include the new point
             */
            d3Map.bounds.extend(point);

            /**
             * Create new marker on map
             * @type {google}
             */
            var marker = new google.maps.Marker({
                position: point,
                map: d3Map.map,
                icon: typeicon
            });

            /**
             * Set default value of clicked to false
             * @type {Boolean}
             */
            marker.wasClicked = false;

            /**
             * Create new Google Maps infowindow object
             * @type {google}
             */
            var infoWindow = new google.maps.InfoWindow();

            /**
             * Build HTML to put in infowindow.  Main image will be wrapped in div with class of file (so dms.xml class would be dms-wrap)
             * @type {String}
             */
            var windowHTML = '<img src="' + chevron + '"><span>' + heading + '</span><div class="' + type + '-wrap"><img src="' + image + '"></div>';

            /**
             * Callback when marker is clicked on
             */
            function markerClick() {
                if (infoWindow.getMap() && marker.wasClicked == true) {
                    infoWindow.close();
                    marker.wasClicked = false;
                } else {
                    marker.wasClicked = true;
                }
            }

            /**
             * Callback when the close (X) button is clicked
             */
            function markerCloseClick() {
                console.log('close clicked');
                marker.wasClicked = false;
            }

            /**
             * Callback for when mouse over marker
             */
            function markerMouseOver() {
                if (!infoWindow.getMap()) {
                    infoWindow.setContent(windowHTML);
                    infoWindow.open(d3Map.map, marker);
                }
            }

            /**
             * Callback for when mouse leaves hovering marker
             */
            function markerMouseOut() {
                if (infoWindow.getMap() && marker.wasClicked == false) {
                    infoWindow.close();
                }
            }

            if (type == 'cameras') {
                CamerasMarkers[markerid] = marker;
            }

            if (type == 'dms') {
                DMSMarkers[markerid] = marker;
            }

            /**
             * Add listeners for Google Maps connected to callback functions
             */

            google.maps.event.addListener(marker, 'click', markerClick);
            google.maps.event.addListener(marker, 'mouseover', markerMouseOver);
            google.maps.event.addListener(marker, 'mouseout', markerMouseOut);
            google.maps.event.addListener(infoWindow, 'closeclick', markerCloseClick);

            /**
             * Fit viewable window around infowindow
             */
            d3Map.map.fitBounds(d3Map.bounds);
        });
    });
}
