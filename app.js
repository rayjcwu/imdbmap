
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


var connStr = "postgres://localhost/imdb";

var client = new pg.Client(connStr);

app.get('/geo', function(req, res) {
  var _url = url.parse(req.url, true);
  var query = _url.query;
  var lat = query.lat;
  var lng = query.lng;
  if (typeof lat === 'undefined' || typeof lng === 'undefined' ) {
    console.error("missing lat, lng");
    res.json({status: 'ERROR', description: 'missing lat, lng'});
  }
  var limit = query.limit || 50;

  client.connect(function(err) {
    if(err) {
      console.error('could not connect to postgres', err);
      res.json({status: 'ERROR', description: 'cannot connect to database'});
      return;
    }
    client.query('SELECT raw_address AS address, title, year, geo \
                       FROM (SELECT raw_address, \
                              title, \
                              year, \
                              votes*rating AS popular, \
                              geo, \
                              geo<->point($1, $2) AS distance \
                             FROM huge_join \
                             WHERE geo IS NOT NULL \
                             ORDER BY distance ASC \
                             LIMIT $3 * 4) AS foo \
                       ORDER BY popular DESC LIMIT $4;', [lng, lat, limit, limit], 

                  function(err, result) {
      if(err) {
        console.error('error running query', err);
        res.json({status: 'ERROR', description: 'query error'});
        return;
      }
      res.json({status: 'OK', results: result.rows})
      console.log(result);
      client.end();
    });
  });
  
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
