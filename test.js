var pg = require('pg'); 
//or native libpq bindings
// var pg = require('pg').native

var conString = "postgres://localhost/imdb";

var client = new pg.Client(conString);
client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('SELECT * FROM locations_geo WHERE geo IS NOT NULL;', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].raw_address);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();
  });
});

console.log("end");
