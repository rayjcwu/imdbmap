# -*- coding: UTF-8 -*-
'''
to parse imdb movies.list
'''
import sys
import json
import psycopg2
import re
import util

ENCODING = 'cp1252'

def parse_range(full_range):
  ranges = full_range.split('-')

  try:
    ranges[0] = int(ranges[0])
  except:
    ranges[0] = 0

  if len(ranges) == 2:
    try:
      ranges[1] = int(ranges[1])
    except:
      ranges[1] = 0
    return (ranges[0], ranges[1])
  elif len(ranges) == 1:
    return (ranges[0], None)
  else:
    print full_range
    raise ValueError

def parse_movie(line):
  fields = filter(None, line.split('\t'))
  pt = util.parse_title(fields[0])
  parsed_range = parse_range(fields[1])

  return (fields[0], fields[1]) + (pt['title'], pt['year'], pt['tv_info'], pt['optional_info'], pt['is_movie']) + parsed_range

# this function will parse top/bottom movies twice, because they list twice in movies.list
def parse(filename):
  db = util.database_init()

  conn = db['conn']
  cur = db['cur']

  start = False
  end = False
  all = []
  with open(filename) as f:
    for line in f.readlines():
      line = line.strip().decode(ENCODING)
      fields = filter(None, line.split('\t'))

      if len(fields) != 2:
        continue

      parsed_line = parse_movie(line)

      cur.execute("""
                  INSERT INTO movies (raw_title, raw_time, title, year, tv_info, optional_info, is_movie, range_start, range_end) 
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);""", parsed_line)
      conn.commit()

  cur.close()
  conn.close()

if __name__=='__main__':
  if len(sys.argv) == 1:
    FILENAME_INPUT = 'movies.list'
    print 'parsing ', FILENAME_INPUT
    parse(FILENAME_INPUT)
  else:
    parse(sys.argv[1])
