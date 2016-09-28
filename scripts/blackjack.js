'use strict';
var cards = require('./cards.js')

module.exports = function Blackjack() {

  var that = this;
  this.dealer = {};
  this.dealer.cardsHand = [];
  this.dealer.status = 'NONE';
  this.dealer2ndCard;
  this.players = {};
  this.table = [];
  this.current = 0;
  this.deck = new cards.Deck({
    shuffled: true,
  });

  this.addPlayer = function(userName, callback) {
    var player = {};
    player.userName = userName;
    player.cardsHand = [];
    player.status = 'NONE';
    this.players[userName] = player;
    this.table.push(userName);
    callback(this.players[userName]);
  };

  this.getPlayer = function(userName, callback) {
    callback(this.players[userName]);
  };

  this.removePlayer = function(userName, callback) {
    delete this.players[userName];
    for (var i = 0; i < this.table.length; i++) {
      if (this.table[i] === userName) {
        this.table.splice(i, 1);
        break;
      }
    }
    callback(userName);
  };

  this.deal = function(callback) {
    if (this.dealer.status == 'NONE') {
      that.dealCards();
      callback(this.players, this.dealer);
    } else if (this.dealer.status == 'BUST' || this.dealer.status == 'OVER') {
      this.dealer.cardsHand = [];
      this.dealer.status = 'NONE';
      this.dealer.score = null;
      this.table = [];
      delete this.deck;
      this.deck = new cards.Deck({
        shuffled: true,
      });
      for (var i = 0; i < Object.keys(this.players).length; i++) {
        this.players[Object.keys(this.players)[i]].cardsHand = [];
        this.players[Object.keys(this.players)[i]].status = 'NONE';
        this.players[Object.keys(this.players)[i]].score = null;
        this.table.push(this.players[Object.keys(this.players)[i]].userName);
      }
      that.dealCards();
      callback(this.players, this.dealer);
    }
  }

  this.dealCards = function() {
    var temp = 0;
    while (temp < 2) {
      for (var i = this.table.length - 1; i >= 0; i--) {
        this.players[Object.keys(this.players)[i]].cardsHand.push(this.deck.deal());
        if (temp == 1) {
          this.players[Object.keys(this.players)[i]].score = that.calculateHand(this.players[this.table[i]].cardsHand);
        }
      }
      if (temp == 0) {
        this.dealer.cardsHand.push(this.deck.deal());
      } else {
        this.dealer2ndCard = this.deck.deal();
      }
      temp++;
    }
    this.dealer.status = 'DEALT';
  }

  this.calculateHand = function(cards) {
    var aces = 0;
    var score = 0;
    for (var i = 0; i < cards.length; i++) {
      score += cards[i].value;
      if (cards[i].card == 'A') {
        aces++;
      }
    }
    while (score > 21 && aces > 0) {
      score = score - 10;
      aces--;
    }
    return score;
  }

  this.playerHit = function(userName, callback) {
    if (this.table.length != 0 && this.table[this.table.length - 1] == userName) {
      this.players[userName].cardsHand.push(this.deck.deal());
      this.players[userName].score = that.calculateHand(this.players[userName].cardsHand);
      if (this.players[userName].score > 21) {
        this.players[userName].status = 'BUST';
        this.table.pop();
      }
      callback(this.players[userName]);
    }
  }

  this.playerStand = function(userName, callback) {
    if (this.table.length != 0 && this.table[this.table.length - 1] == userName) {
      this.players[userName].status = 'STAND';
      this.table.pop();
      callback(this.players[userName]);
    }
  }

  this.dealerHit = function(callback) {
    this.dealer.cardsHand.push(this.dealer2ndCard);
    this.dealer.score = that.calculateHand(this.dealer.cardsHand);
    while (this.dealer.score < 17) {
      this.dealer.cardsHand.push(this.deck.deal());
      this.dealer.score = that.calculateHand(this.dealer.cardsHand);
    }
    if (this.dealer.score > 21) {
      this.dealer.status = 'BUST';
    } else {
      this.dealer.status = 'OVER';
    }
    callback(this.dealer);
  }

  this.getWinners = function(callback) {
    var winners = [];
    for (var i = 0; i < Object.keys(this.players).length; i++) {
      if (this.dealer.score <= 21) {
        if (this.players[Object.keys(this.players)[i]].score > this.dealer.score && this.players[Object.keys(this.players)[i]].score <= 21) {
          winners.push(this.players[Object.keys(this.players)[i]]);
        }
      } else {
        if (this.players[Object.keys(this.players)[i]].score <= 21) {
          winners.push(this.players[Object.keys(this.players)[i]]);
        }
      }
    }
    callback(winners);
  }

  return this;

}
