# -*- coding: UTF-8 -*-
import sys
import psycopg2
from psycopg2.extensions import AsIs
import urllib
import json
from time import sleep
import pprint

QUERY_DICT = {'address': '', 'sensor': 'false'}

def query_json(raw_address):
  global QUERY_DICT
  QUERY_DICT['address'] = raw_address
  params = urllib.urlencode(QUERY_DICT)
  content = urllib.urlopen('http://maps.googleapis.com/maps/api/geocode/json?%s' % params).read()
  raw_json = json.loads(content)

  return raw_json

def run():

  conn = psycopg2.connect("dbname=imdb")
  cur = conn.cursor()
  
  query_str = "SELECT * from (SELECT DISTINCT * FROM (SELECT geo_id, raw_address FROM huge_join WHERE geo IS NULL AND is_movie = TRUE AND street IS NOT NULL AND country = 'USA' ORDER BY votes * rating DESC) AS foo) AS foo2;"

  cur.execute(query_str)
  for r in cur.fetchall():
    sleep(0.05)

    raw_address = r[1]
    raw_json = query_json(raw_address)

    if raw_json['status'] == 'OK':
      results = raw_json['results']
      latlng = raw_json['results'][0]['geometry']['location']

      latlng_tup = (latlng['lng'], latlng['lat'])
      point = ("'(%f, %f)'") % latlng_tup

      print 'query json', r[0]

      cur.execute("UPDATE locations_geo SET geo = %s, results = %s WHERE id = %s;", (AsIs(point), json.dumps(results), r[0]))
      conn.commit()
    elif raw_json['status'] == 'OVER_QUERY_LIMIT':
      print 'reach daily query limit'
      break
    else:
      print raw_json['status'] + ": ", raw_address

  cur.close()
  conn.close()

if __name__ == "__main__":
  run()
