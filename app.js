
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , url = require('url');
var pg = require('pg');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var queryByGeo = function(res, params) {
  var lat = params.lat;
  var lng = params.lng;
  var limit = params.limit;

  var minlat = params.minlat ||  -90.0;
  var maxlat = params.maxlat ||   90.0;
  var minlng = params.minlng || -180.0;
  var maxlng = params.maxlng ||  180.0;

  var connStr = "postgres://localhost/imdb";
  pg.connect(connStr, function(err, client, done) {
    if(err) {
      console.error('could not connect to postgres', err);
      res.json({status: 'ERROR', description: 'cannot connect to database'});
      return;
    }
    var queryStr = "SELECT * " +
                   "FROM (SELECT loc_id, raw_address, title, year, votes*rating AS popular, geo, " +
                     "geo<->point("+ lng +","+ lat +") AS distance " + 
                     "FROM huge_join " +
                     "WHERE geo IS NOT NULL " +
                     "AND geo <@ box'(("+ minlng +","+ minlat +"),("+ maxlng +","+ maxlat +"))' "+ 
                     "ORDER BY distance ASC " +
                     "LIMIT "+ limit*20 +") AS foo " +
                   "ORDER BY popular DESC LIMIT "+ limit +";";
    console.log(queryStr);
    client.query(queryStr, [], function(err, result) {
      if(err) {
        console.error('error running query', err);
        res.json({status: 'ERROR', description: 'query error'});
        return;
      }
      done();
      res.json({status: 'OK', results: result.rows});
    });
  });
}


app.get('/query/geo', function(req, res) {
  var _url = url.parse(req.url, true);
  var query = _url.query;
  var lat = query.lat;
  var lng = query.lng;
  if (typeof lat === 'undefined' || typeof lng === 'undefined' ) {
    console.error("missing lat, lng");
    res.json({status: 'ERROR', description: 'missing lat, lng'});
  }
  var limit = query.limit || 50;

  var minlat = query.minlat ||  -90.0;
  var maxlat = query.maxlat ||   90.0;
  var minlng = query.minlng || -180.0;
  var maxlng = query.maxlng ||  180.0;

  queryByGeo(res, {lat: lat, lng: lng, limit:limit, minlat: minlat, maxlat: maxlat, minlng: minlng, maxlng: maxlng});
});

var queryByBound= function(res, params) {
  var limit = params.limit || 50;

  var minlat = params.minlat;
  var maxlat = params.maxlat;
  var minlng = params.minlng;
  var maxlng = params.maxlng;

  var titlequery = "";
  if (params.title !== "") {
    titlequery = "AND title ILIKE '%" + params.title +"%'"
  }

  var connStr = "postgres://localhost/imdb";
  pg.connect(connStr, function(err, client, done) {
    if(err) {
      console.error('could not connect to postgres', err);
      res.json({status: 'ERROR', description: 'cannot connect to database'});
      return;
    }
    var queryStr = "SELECT loc_id, raw_address AS address, title, year, votes*rating AS popular, geo AS lnglat " +
                   "FROM huge_join " +
                   "WHERE geo IS NOT NULL " +
                   "AND geo <@ box'(("+ minlng +","+ minlat +"),("+ maxlng +","+ maxlat +"))' "+ 
                   titlequery + 
                   "ORDER BY popular DESC LIMIT "+ limit +";";
    console.log(queryStr);
    client.query(queryStr, [], function(err, result) {
      if(err) {
        console.error('error running query', err);
        res.json({status: 'ERROR', description: 'query error'});
        return;
      }
      done();
      res.json({status: 'OK', results: result.rows});
    });
  });
}

app.get('/query/bound', function(req, res) {
  var _url = url.parse(req.url, true);
  var query = _url.query;

  if ( typeof query.minlat === 'undefined' || typeof query.minlng === 'undefined' ||
       typeof query.maxlat === 'undefined' || typeof query.maxlng === 'undefined' ) {
    console.error("missing minlat, maxlat, minlng, maxlng");
    res.json({status: 'ERROR', description: 'missing minlat, maxlat, minlng, maxlng'});
    return;
  }
  var limit = query.limit || 30;

  var minlat = query.minlat;
  var maxlat = query.maxlat; 
  var minlng = query.minlng;
  var maxlng = query.maxlng;

  var title = query.title || "";

  queryByBound(res, {limit:limit, minlat: minlat, maxlat: maxlat, minlng: minlng, maxlng: maxlng, title: title});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
