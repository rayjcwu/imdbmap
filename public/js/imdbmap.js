var imdbmap = {
  map: null, 

  markers: [],
  infowindows: [],

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

//    console.log(params);
    $.get("/query/geo?" + $.param(params), function (data){
      if (data.status === 'ERROR') {
        console.error(data.description);
        return;
      }

      if (data.status === 'OK') {
 //       console.log(data.results);

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

      var marker = new google.maps.Marker({
        map: imdbmap.map,
        animation: google.maps.Animation.DROP,
        position: new google.maps.LatLng(lnglat[1], lnglat[0]),
        title: row.title + " ("+row.year+")"
      });
    }
  }, 


  /*
   * {
   *   geo_id: { address: '....',
   *             lnglat: [lng, lat],
   *             titles: [ {title: '...', year: '...'}, .... ] },
   * }
   */
  buildInverseMap: function(results) {
    console.log("In build inverse map: " + results.length + " records");
    var im = {};
    for (var i = 0; i < results.length; i++) {
      var row = results[i];
      var lnglat = row.lnglat.slice(1, -1).split(",");

      var extra_info = row.address_info;
      if (typeof extra_info !== "string") {
        extra_info = "";
      }

      if (im.hasOwnProperty(row.geo_id)) {
        im[row.geo_id].titles.push({title: row.title, year: row.year, extra_info: extra_info});
      } else {
        im[row.geo_id] = {address: row.address, 
                          lnglat: lnglat, 
                          titles: [{title: row.title, year: row.year, extra_info: extra_info}]};
      }
    }
    console.log(im);
    imdbmap.plotInverseMarker(im);
  },

  plotInverseMarker: function(im) {
    for (var loc_id in im) {
      var loc = im[loc_id];
      var titles = loc.titles;
      var lnglat = loc.lnglat;

      var markerString = loc.address + "\n\n" + 
        titles.map(function(d){ 
          return d.title + " ("+ d.year + ")"; 
        }).join("\n");

      var marker = new google.maps.Marker({
        map: imdbmap.map,
        animation: google.maps.Animation.DROP,
        position: new google.maps.LatLng(lnglat[1], lnglat[0]),
        title: markerString
      });

      var infoboxString = "<div><h1>"+loc.address+"</h1><ul>" +
         titles.map(function(d){
            return "<li>"+d.title+" ("+d.year+")   "+d.extra_info;
         }).join("") + "</ul></div>";

      imdbmap.addInfowindow(marker, infoboxString);
    }
  },

  addInfowindow: function(marker, info) {
    var infowindow = new google.maps.InfoWindow({
      content: info
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(imdbmap.map, marker);
    });
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

//    console.log(params);
    $.get("/query/bound?" + $.param(params), function (data){
      if (data.status === 'ERROR') {
        console.error(data.description);
        return;
      }

      if (data.status === 'OK') {
 //       console.log(data.results);

        if (typeof callback !== 'undefined') {
          callback(data.results);
        }
      }
    });
  }
};
