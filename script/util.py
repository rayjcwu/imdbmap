# -*- coding: UTF-8 -*-
import re

database_name = 'imdb'

def database_init():
  conn = psycopg2.connect("dbname=" + databae_name)
  cur = conn.cursor()

  return {'conn': conn, 'cur': cur}

def parse_title(raw_title):
  result = {'is_movie': True, 'year': 0, 'tv_info': None, 'optional_info': None, 'title': None }
  raw_title = raw_title.strip()

  # { whatever message }
  # {{ SUSSPEND }}
  pat = "\{(.+?)\}$"
  matcher = re.compile(pat, flags=re.U)
  match = matcher.search(raw_title)
  if match != None:
    result['optional_info'] = match.group(1)
  raw_title = re.sub(pat, "", raw_title).strip()

  # (1994)
  # (1994/I) (VG)
  pat = "\((\d{4})([^\)])*?\)\s*(\(\w*?\))?$"
  year_reo = re.compile(pat, flags=re.U)
  match = year_reo.search(raw_title)
  if match != None:
    result['year'] = int(match.group(1))
    result['tv_info'] = match.group(3)
  raw_title = re.sub(pat, "", raw_title).strip()

  if raw_title[0] == '"' and raw_title[-1] == '"':
    result['is_movie'] = False
    result['title'] = raw_title[1: -1]
  else:
    result['title'] = raw_title

  return result
