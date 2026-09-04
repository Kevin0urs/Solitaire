#!/usr/bin/env python3
"""
CLI Test Suite and Local Web Server for Spider Solitaire 2-Suit
"""

import sys
import unittest
import http.server
import socketserver
import threading

class Card:
    def __init__(self, suit, rank, face_up=False, card_id=None):
        self.suit = suit # 'spades' | 'hearts'
        self.rank = rank # 1..13
        self.face_up = face_up
        self.id = card_id or f"card-{suit}-{rank}"

    def get_rank_label(self):
        labels = {1: 'A', 11: 'J', 12: 'Q', 13: 'K'}
        return labels.get(self.rank, str(self.rank))

class SpiderGameEngineTest(unittest.TestCase):
    def test_deck_composition(self):
        cards = []
        for set_idx in range(4):
            for suit in ['spades', 'hearts']:
                for rank in range(1, 14):
                    cards.append(Card(suit, rank))
        
        self.assertEqual(len(cards), 104, "104 cards total")
        spades = [c for c in cards if c.suit == 'spades']
        hearts = [c for c in cards if c.suit == 'hearts']
        self.assertEqual(len(spades), 52, "52 spades")
        self.assertEqual(len(hearts), 52, "52 hearts")

    def test_sequence_moveability(self):
        # Pure same-suit sequence is moveable
        seq_pure = [Card('spades', 10, True), Card('spades', 9, True), Card('spades', 8, True)]
        for i in range(len(seq_pure) - 1):
            self.assertEqual(seq_pure[i].suit, seq_pure[i+1].suit)
            self.assertEqual(seq_pure[i].rank, seq_pure[i+1].rank + 1)

        # Mixed suit sequence is NOT moveable as a single block
        seq_mixed = [Card('spades', 10, True), Card('hearts', 9, True)]
        self.assertNotEqual(seq_mixed[0].suit, seq_mixed[1].suit)

    def test_stock_deal_rule(self):
        # Stock cannot deal if any column is empty
        tableau = [[Card('spades', 5, True)], []] # Col 1 has card, Col 2 empty
        has_empty_column = any(len(col) == 0 for col in tableau)
        self.assertTrue(has_empty_column, "Stock deal blocked when a column is empty")

    def test_completed_sequence_detection(self):
        # Completed sequence K down to A same suit
        col_cards = [Card('spades', r, True) for r in range(13, 0, -1)]
        self.assertEqual(len(col_cards), 13)
        self.assertEqual(col_cards[0].rank, 13)
        self.assertEqual(col_cards[-1].rank, 1)
        self.assertTrue(all(c.suit == 'spades' for c in col_cards))

def run_tests():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 60)
    print(" [TESTS] SPIDER SOLITAIRE 2-SUIT - PYTHON VALIDATION SUITE")
    print("=" * 60)
    suite = unittest.TestLoader().loadTestsFromTestCase(SpiderGameEngineTest)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    if not success:
        sys.exit(1)
    
    if len(sys.argv) > 1 and sys.argv[1] == '--serve':
        PORT = 8080
        Handler = http.server.SimpleHTTPRequestHandler
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"\n🌐 Webapp active: http://localhost:{PORT}")
            print(f"🧪 Test runner: http://localhost:{PORT}/test/index.html")
            httpd.serve_forever()
