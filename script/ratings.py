# -*- coding: UTF-8 -*-
import sys
import psycopg2
import re
import util

ENCODING = 'cp1252'
FILENAME_INPUT = 'ratings.list'

def parse_movie(line):
  parsed_range = parse_range(fields[1])
  return (pt['title'], pt['year'], pt['tv_info'], pt['optional_info'], pt['is_movie'])

def parse(filename):
  conn = psycopg2.connect("dbname=imdb")
  cur = conn.cursor()

  with open(filename) as f:
    for line in f.readlines():
      line = line.strip().decode(ENCODING)
      matcher = re.compile('^(\S{10})\s+(\d+)\s+(\d{1,2}\.\d)(.*)$', re.U)
      match = matcher.search(line)

      if match != None:
        distribution = match.group(1)
        votes = int(match.group(2))
        rank = float(match.group(3))
        raw_title = match.group(4).strip()

        pt = util.parse_title(raw_title)
        parsed_title = (pt['title'], pt['year'], pt['tv_info'], pt['optional_info'], pt['is_movie'])

        cur.execute("INSERT INTO ratings (distribution, votes, rank, raw_title, title, year, tv_info, optional_info, is_movie) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);", (distribution, votes, rank, raw_title) + parsed_title)
        conn.commit()
        # print (distribution, votes, rank, util.parse_title(raw_title))
      else:
        print line

  cur.close()
  conn.close()

if __name__=='__main__':
  if len(sys.argv) == 1:
    print 'reading ', FILENAME_INPUT
    parse(FILENAME_INPUT)
  else:
    parse(sys.argv[1])
