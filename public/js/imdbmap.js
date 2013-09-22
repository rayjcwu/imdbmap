var imdbmap = {

  map: undefined, 
  lastInfowindow: undefined,

  markers: [],
  infowindows: [],

  init: function(){
    var mapOptions = {
      center: new google.maps.LatLng(37.7739164, -122.4424065),
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    imdbmap.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

    $('#location_search_btn').on('click', function(){
      $("#title_search_box").val("");
      imdbmap.queryByBound(imdbmap.buildInverseMap);
    });

    
    $("#title_search_box").keypress(function(e){
      if (e.which === 13) {
        imdbmap.queryByTitle(imdbmap.buildInverseMap);
      }
    }).on('click', function(){
      $("#title_search_box").val("");
    });

    $(document).keyup(function(e){
      if (e.keyCode == 27) {
        $("#info-list-inner").toggle();
        imdbmap.clearInfowindow();
      }
    });
  },

  queryByTitle: function(callback) {
    var params = {title: $("#title_search_box").val() };

    $.get("/query/title?" + $.param(params), function (data){
      if (data.status === 'ERROR') {
        console.error(data.description);
        return;
      }

      if (data.status === 'OK' && data.results.length > 0) {
        console.log("found " + data.results.length + " records");

        var minlng =  180.0;
        var maxlng = -180.0;
        var minlat =   90.0;
        var maxlat =  -90.0;

        for (var i = 0; i < data.results.length; i++ ) {
          var lnglat = data.results[i].lnglat.slice(1, -1).split(",");
          var lat = parseFloat(lnglat[1]);
          var lng = parseFloat(lnglat[0]);

          if (lat > maxlat) { maxlat = lat; }
          if (lat < minlat) { minlat = lat; }

          if (lng > maxlng) { maxlng = lng; }
          if (lng < minlng) { minlng = lng; }
        }

        var bound = new google.maps.LatLngBounds(new google.maps.LatLng(minlat, minlng), 
                                                 new google.maps.LatLng(maxlat, maxlng));
                                                 /*
        console.log("minlng " + minlng);
        console.log("maxlng " + maxlng);
        console.log("minlat " + minlat);
        console.log("maxlat " + maxlat);
        */
        imdbmap.map.fitBounds(bound);
        if (typeof callback !== 'undefined') {
          callback(data.results);
        }
      }
    });
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

  buildInfoList: function(results) {
    console.log("In build info list");
    var inverseIndex = {};
    for (var i = 0; i < results.length; i++) {
      var row = results[i];
      var title = row.title + " ("+ row.year +")";

      var extra_info = row.address_info;
      if (typeof extra_info !== "string") {
        extra_info = "";
      }

      if (inverseIndex.hasOwnProperty(title)) {
        inverseIndex[title].locations.push({address: row.address, extra_info: extra_info});
      } else {
        inverseIndex[title] = {title: title, 
                               locations: [{address: row.address, extra_info: extra_info}]};
      }
    }
    console.log(inverseIndex);
    imdbmap.plotInfoList(inverseIndex)
  },

  plotInfoList: function(inverseIndex){
    var infolistParent = $('#info-list');
    $("#info-list div").remove();
    var infolist = $('<div id="info-list-inner">');
    infolistParent.append(infolist);
    for (var i in inverseIndex) {
      var movie = inverseIndex[i];
      var locations = movie['locations'];
      infolist.append($("<h3>").text(movie.title))

      var ul = $("<ul>");
      for (var idx = 0; idx < locations.length; idx++) {
        var addr = locations[idx].address+"    "+locations[idx].extra_info;
        ul.append($("<li>").text(addr));
      }
      infolist.append(ul);
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
    imdbmap.buildInfoList(results);
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
//    console.log(im);
    imdbmap.clearMarkers();
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

      imdbmap.markers.push(marker);
      imdbmap.addInfowindow(marker, loc);
    }
  },

  clearMarkers: function() {
    for (var i = 0; i < imdbmap.markers.length; i++) {
      imdbmap.markers[i].setMap(null);
    }
    imdbmap.markers = [];
  },

  clearInfowindow: function() {
      for (var i = 0; i < imdbmap.infowindows.length; i++) {
        imdbmap.infowindows[i].close();
      }
  },

  addInfowindow: function(marker, loc) {
    var infoboxString = '<div class="infobox"><p class="lead">'+loc.address+"</p><p><ul>" +
       loc.titles.map(function(d){
          return "<li>"+d.title+" ("+d.year+")   "+d.extra_info+"</li>";
       }).join("") + "</ul></p></div>";

//       console.log(infoboxString);
    var infowindow = new google.maps.InfoWindow({
      content: infoboxString
    });

    imdbmap.infowindows.push(infowindow);

    google.maps.event.addListener(marker, 'click', function() {
      imdbmap.clearInfowindow();
      if (imdbmap.map.getZoom() < 10){ 
        imdbmap.map.setZoom(11); 
        imdbmap.map.setCenter(marker.getPosition());
      }
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
