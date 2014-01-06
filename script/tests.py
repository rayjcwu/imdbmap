# -*- coding: UTF-8 -*-
import unittest
import util

class TestParser(unittest.TestCase):

  def test_parse_title_1(self):
    r = util.parse_title('Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb (1964)')
    self.assertEqual(r['tv_info'], None)
    self.assertEqual(r['title'], 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb')
    self.assertEqual(r['year'], 1964)
    self.assertEqual(r['is_movie'], True)
    self.assertEqual(r['optional_info'], None)

  def test_parse_title_2(self):
    r = util.parse_title('"Üb immer Treu nach Möglichkeit" (1966) {Ja, wenn die Musik nicht wär (#1.6)}')
    self.assertEqual(r['tv_info'], None)
    self.assertEqual(r['title'], 'Üb immer Treu nach Möglichkeit')
    self.assertEqual(r['year'], 1966)
    self.assertEqual(r['is_movie'], False)
    self.assertEqual(r['optional_info'], 'Ja, wenn die Musik nicht wär (#1.6)')

  def test_parse_title_3(self):
    r = util.parse_title('"Üb immer Treu nach Möglichkeit" (1966) (TV) {{SSUSSPEND}}')
    self.assertEqual(r['tv_info'], '(TV)')
    self.assertEqual(r['title'], 'Üb immer Treu nach Möglichkeit')
    self.assertEqual(r['year'], 1966)
    self.assertEqual(r['is_movie'], False)
    self.assertEqual(r['optional_info'], '{SSUSSPEND}')

  def test_parse_title_4(self):
    r = util.parse_title('(500) Days of Summer (2009)')
    self.assertEqual(r['tv_info'], None)
    self.assertEqual(r['title'], '(500) Days of Summer')
    self.assertEqual(r['year'], 2009)
    self.assertEqual(r['is_movie'], True)
    self.assertEqual(r['optional_info'], None)

if __name__ == '__main__':
  unittest.main()
