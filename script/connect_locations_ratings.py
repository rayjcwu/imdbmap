# -*- coding: UTF-8 -*-
import sys
import psycopg2

def run():
  conn = psycopg2.connect("dbname=imdb")
  cur = conn.cursor()

  cur.execute("SELECT id, raw_title, FROM ratings ORDER BY id;")

  addresses = [ (adds[0], adds[1])  for adds in cur.fetchall()]

  for addr in addresses:
    cid = addr[0]
    caddr = addr[1]

    cur.execute("UPDATE locations SET locations_geo_id = %s WHERE raw_address LIKE %s;", (cid, caddr))
    conn.commit()
    print cid

  cur.close()
  conn.close()

if __name__=='__main__':
  run()
