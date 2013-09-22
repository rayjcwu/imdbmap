var imdbmap = {
  map: null, 

  markers: [],

  init: function(){
    var mapOptions = {
      center: new google.maps.LatLng(37.7739164, -122.4424065),
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    imdbmap.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  },

  queryByGeo: function (callback) {
    var lat = 37.7739164;
    var lng = -122.4424065;

    var bounds = imdbmap.getBounds();
    var minlng = bounds.sw.lng();
    var maxlng = bounds.ne.lng();
    var minlat = bounds.sw.lat();
    var maxlat = bounds.ne.lat();

    var params = {
      lat: lat, minlat: minlat, maxlat: maxlat,
      lng: lng, minlng: minlng, maxlng: maxlng,
      limit: 100
    };

    console.log(params);
    $.get("/query/geo?" + $.param(params), function (data){
      if (data.status === 'ERROR') {
        console.error(data.description);
        return;
      }

      if (data.status === 'OK') {
        console.log(data.results);

        if (typeof callback !== 'undefined') {
          callback(data.results);
        }
      }
    });
  },

  getBounds: function() {
    var bounds = imdbmap.map.getBounds();
    var ne = bounds.getNorthEast(); // LatLng of the north-east corner
    var sw = bounds.getSouthWest(); // LatLng of the south-west corder
    return {ne: ne, sw: sw};
  }, 

  drawMarker: function(results) {
    for (var i = 0; i < results.length; i++) {
      var row = results[i];
      var lnglat = row.lnglat.slice(1, -1).split(",");

      marker = new google.maps.Marker({
        map: imdbmap.map,
        animation: google.maps.Animation.DROP,
        position: new google.maps.LatLng(lnglat[1], lnglat[0]),
        title: row.title + " ("+row.year+")"
      });
    }
  }, 

  queryByBound: function (callback) {

    var bounds = imdbmap.getBounds();
    var minlng = bounds.sw.lng();
    var maxlng = bounds.ne.lng();
    var minlat = bounds.sw.lat();
    var maxlat = bounds.ne.lat();

    var params = {
      minlat: minlat, maxlat: maxlat,
      minlng: minlng, maxlng: maxlng,
      limit: 100
    };

    console.log(params);
    $.get("/query/bound?" + $.param(params), function (data){
      if (data.status === 'ERROR') {
        console.error(data.description);
        return;
      }

      if (data.status === 'OK') {
        console.log(data.results);

        if (typeof callback !== 'undefined') {
          callback(data.results);
        }
      }
    });
  }
};
