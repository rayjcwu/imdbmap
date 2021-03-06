# -*- coding: UTF-8 -*-
import sys
import psycopg2
import re
import util

ENCODING = 'cp1252'
FILENAME_INPUT = 'locations.list.txt'

def parse_address(full_address):
  adds = full_address.split(', ')

  country = None
  state = None
  city = None
  street = None

  if len(adds) == 1:
    country = adds[-1]

  if len(adds) == 2:
    country = adds[-1]
    state = adds[-2]

  if len(adds) == 3:
    country = adds[-1]
    state = adds[-2]
    city = adds[-3]

  if len(adds) >= 4:
    country = adds[-1]
    state = adds[-2]
    city = adds[-3]
    street = ", ".join(adds[0:-3])

  return (street, city, state, country)

def parse_movie(line):
  fields = filter(None, line.split("\t"))
  pt = util.parse_title(fields[0])
  parsed_name = (pt['title'], pt['year'], pt['tv_info'], pt['optional_info'], pt['is_movie'])

  full_address = fields[1]
  parsed_address = parse_address(full_address)

  if len(parsed_address) != 4:
    print parsed_address

  if len(fields) == 2:
    return (fields[0], fields[1], None) + parsed_name + parsed_address 
  else:
    return (fields[0], fields[1], fields[2]) + parsed_name + parsed_address

def parse(filename):
  conn = psycopg2.connect("dbname=imdb")
  cur = conn.cursor()

  start = False
  end = False
  all = []
  # output = codecs.open(FILENAME_OUTPUT, "w", "utf-8")
  with open(filename) as f:
    for line in f.readlines():
      line = line.strip().decode(ENCODING)
      if line == u'==============':
        start = True
        continue

      if line == u'--------------------------------------------------------------------------------':
        end = True

      if start and not end:
        fields = parse_movie(line)

        # parsed_name = (pt['title'], pt['year'], pt['tv_info'], pt['optional_info'], pt['is_movie'])
        cur.execute("INSERT INTO locations (raw_title, raw_address, address_info, title, year, tv_info, optional_info, is_movie, street, city, state, country) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);", fields)
        conn.commit()

  cur.close()
  conn.close()

if __name__=='__main__':
  if len(sys.argv) == 1:
    print 'reading ', FILENAME_INPUT
    parse(FILENAME_INPUT)
  else:
    parse(sys.argv[1])
