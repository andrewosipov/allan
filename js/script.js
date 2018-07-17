var mapGlobal;
var markerCluster;


function initMap() {
    var uluru = {lat: 48.856614, lng: 2.352222};
    mapGlobal = new google.maps.Map(document.getElementById('map'), {
        zoom: mapZoom,
        center: uluru
    });
    /*var marker = new google.maps.Marker({
        position: uluru,
        map: map
    });*/


}

function reinitApp() {
    mapGlobal = null;
    $('.search__shop-list').empty();
    $('.search__map').remove();
    $('.search__result').append('<div class="search__map" id="map"></div>')
    initMap();
}

function initSelect() {

    // get unique shop types
    var selectOptions = {};
    for(var i=0; i<jsonData.length; i++){
        var item = jsonData[i].shop;
        selectOptions[item] = true;
    }

    // sort keys
    var keys = Object.keys(selectOptions);
    keys.sort();

    // append shop types in select
    keys.forEach(function (item) {
        $('.search__form select').append('<option value="'+item+'">' + item + '</option>');
    });

    $('.search__form select').select2({
        placeholder: "TYPE DE MAGASIN",
        allowClear: true
    });
}

function renderItem(props) {
    if( props.name == '' && props.address == '' ) { return ""; }
    var search = ( props.address != '' ) ? props.address : props.location.lat + ',' + props.location.lng;
    var listItem =
    '<li class="search__shop-list-item">' +
        '<img src="img/no-image.jpg" width="150" height="150" class="search__shop-img" alt="alt">' +
        '<div class="search__shop-info">' +
            '<h3 class="search__shop-title">'+ props.name +'</h3>' +
            '<p class="search__shop-address">'+ props.address +'</p>' +
            '<p class="search__shop-distance">à '+ props.distance +' kilomètres</p>' +
            '<div class="search__map-link"><a href="'+ 'https://www.google.fr/maps/search/?api=1&query=' + search + '" class="" target="_blank">link to map</a></div>' +
        '</div>' +
    '</li>';
    return $(listItem);
}

function searchFormSubmit() {
    var selectValue = $('.search__form select').val();
    var postcodeValue = $('.search__form input[name="postcode"]').val();

    // validate the form
    if( typeof selectValue !== 'undefined' && typeof postcodeValue!== 'undefined' ){
        reinitApp();

        var result = searchItems();
        $('.search').removeClass('result-ok').removeClass('result-error').addClass('result-loading');
    }else{

    }
}

/*var marker = new google.maps.Marker({ position: postcodeAPI, map: map });*/

function prepareResultList() {
    var count = $('.search__shop-list li').length;
    $('.search__count span').text(count);
    if( count > countToShow ){

        $('.search__shop-list li').each(function (i, e) {
            if( i > countToShow ){
                $(e).addClass('hide');
            }
        });

        $('.search').addClass('result-follow');

        $('.seacrh__following button').on('click', function () {
            if( $('.search__shop-list li.hide').length ) {
                $('.search__shop-list li.hide').each(function (i, e) {
                    if (i <= countToShow) {
                        $(e).fadeIn(function () {
                            $(this).removeClass('hide')
                        });
                    }
                });
            }else {
                $('.search').removeClass('result-follow');
            }
            return false;
        })
    }
}

// search items in jsonData and Google maps
function searchItems() {
    var status = 'ok';
    var markers = [];
    var justMarkers = [];

    var postcodeAPI = $('.search__form input[name="postcode"]').val();
    var geocoder = new google.maps.Geocoder();

    function postcodePosition(results, status_) {
        if (status_ == 'OK') {

            var postcodePosition = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
            mapGlobal.setCenter(postcodePosition);
            var postcodeMarker = new google.maps.Marker({ map: mapGlobal, position: postcodePosition, title: 'CODE POSTAL ' + postcodeAPI, animation: google.maps.Animation.DROP, icon: 'https://maps.google.com/mapfiles/kml/shapes/parking_lot_maps.png', });

            // seek all closest points
            for(var i=0; i<jsonData.length; i++){
                var item = jsonData[i];
                if( item["shop"] == $('.search__form select').val() && item["name"] != '' ) {
                    var distance = google.maps.geometry.spherical.computeDistanceBetween( results[0].geometry.location, new google.maps.LatLng( item["Geo Point"].lat, item["Geo Point"].lng )  );
                    distance = distance / 1000;
                    if( distance <= radius  ){
                        var marker = new google.maps.Marker({  position: item["Geo Point"], title: item["name"], animation: google.maps.Animation.DROP });
                        markers.push( { name: item["name"], marker: marker, distance: distance, location: item["Geo Point"], address: item["address"], item: item });
                        justMarkers.push(marker);
                    }
                }
            }

            if( markers.length ){
                markers.sort(function (a, b) {
                    if( a.distance < b.distance ){
                        return -1;
                    }
                    if( a.distance > b.distance ){
                        return 1;
                    }
                    return 0;
                });

                // insert in ul
                for(var i=0; i<markers.length; i++){
                    markers[i].address = ( typeof markers[i].address==='undefined' )?"":markers[i].address;
                    $('.search__shop-list').append( renderItem({ name: markers[i].name, distance: markers[i].distance.toFixed(2), address: markers[i].address, location: markers[i].location }) );
                }

                // set map clasters
                markerCluster = new MarkerClusterer(mapGlobal, justMarkers );

                status = 'ok';
                $('.search').addClass('result-ok').removeClass('result-loading');

                prepareResultList();

            }else{
                $('.search').addClass('result-error').removeClass('result-loading');
            }

        } else {
            $('.search').addClass('result-error').removeClass('result-loading');
        }
    }

    geocoder.geocode( { 'address': postcodeAPI}, postcodePosition);

}

function generate() {
   // $('textarea').val( console.dir(jsonData) );

    var geocoder = new google.maps.Geocoder();
    for( var i=0; i<jsonData.length; i++ ) {
        //jsonData[i].address = '';
        var f = function () {
            var j=i;
            if( jsonData[i].address == '' ) {
                geocoder.geocode({'location': window.jsonData[j]['Geo Point']}, function (res, stat) {
                    if (typeof res['0'].formatted_address !== 'undefined') {
                        jsonData[j].address = res['0'].formatted_address;
                        //ref.find('.search__shop-address').text('1');
                        //alert( res['0'].formatted_address );
                        $('textarea').text(JSON.stringify(jsonData))
                    }else{

                    }
                });
            }
        };
        f();
    }
    //alert( jsonData )
}

function initMain() {

    $(document).ready(function () {

        initSelect();
        initMap();

        $('.search__form').on('submit', function (handler) {
            searchFormSubmit();
            return false;
        })

        //generate();

    });

}


