'use strict';
var knuthShuffle = require('knuth-shuffle').knuthShuffle;

var suits = [
  { name: "HEARTS", shortName: "H" },
  { name: "CLUBS", shortName: "C" },
  { name: "DIAMONDS", shortName: "D" },
  { name: "SPADES", shortName: "S" },
];

var values = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 10,
  Q: 10,
  K: 10,
  A: 11,
};

var Card = function(suit, card) {
  return {
    name: card + suit.name,
    shortName: suit.shortName + card,
    value: values[card],
    card: card,
    suit: suit,
    copy: function() {
      return new Card(suit, card);
    },
  };
};

var Deck = function(options) {
  var defaults = {
    shuffled: false,
  };
  var getOption = function(key) {
    return options[key] || defaults[key];
  };

  var cards;
  var newCards = function() {
    cards = new Array();
    for (var i = 0; i < suits.length; ++i) {
      var suit = suits[i];
      for (var j = 0; j < Object.keys(values).length; ++j) {
        var card = Object.keys(values)[j];
        var playingCard = new Card(suit, card);
        cards.push(playingCard);
      }
    }
  }

  var shuffle = function() {
    newCards();
    knuthShuffle(cards);
  };

  newCards();
  if (getOption('shuffled')) {
    shuffle();
  };
  return {
    cards: cards,
    shuffle: shuffle,
    deal: function() {
      return cards.pop();
    },
  };
};

module.exports = {
  Deck: Deck,
  Card: Card,
};
