var Blackjack = require('./blackjack.js');

module.exports = function GameController(io) {

  var io = io;
  var rooms = {};
  var usernames = [];

  this.init = function() {

    io.on('connection', function(socket) {

      socket.on('register', function(username) {
        if (usernames.indexOf(username)) {
          usernames.push(username);
          socket.username = username;
          socket.emit('registered', username);
        } else {
          socket.emit('errormsg', 'error registering');
        }
      });

      socket.on('setupLobby', function() {
        socket.emit('allRooms', Object.keys(rooms));
      });

      socket.on('createRoom', function(room) {
        if (!rooms.hasOwnProperty(room)) {
          socket.room = room;
          var blackjackGame = new Blackjack();
          socket.emit('joined');
          rooms[room] = blackjackGame;
          io.emit('newRoom', room);
        } else {
          socket.emit('errormsg', 'error creating room');
        }
      });

      socket.on('joinRoom', function(room) {
        if (Object.keys(rooms[room].players).length < 4 && rooms[room].dealer.status == 'NONE') {
          socket.room = room;
          socket.join(room);
          var blackjackGame = rooms[room];
          blackjackGame.addPlayer(socket.username, function(player) {
            socket.broadcast.to(room).emit('newPlayer', player);
            socket.emit('joined', room);
          });
        } else {
          socket.emit('errormsg', 'error joining room');
        }
      });

      socket.on('setupGame', function() {
        var blackjackGame = rooms[socket.room];
        socket.emit('allPlayers', blackjackGame.players);
      });

      socket.on('deal', function() {
        var blackjackGame = rooms[socket.room];
        blackjackGame.deal(function(players, dealer) {
          var gameData = {};
          gameData.players = players;
          gameData.dealer = dealer;
          io.to(socket.room).emit('dealt', gameData);
          io.to(socket.room).emit('turn', blackjackGame.table[blackjackGame.table.length - 1]);
        });
      });

      socket.on('hit', function() {
        var blackjackGame = rooms[socket.room];
        blackjackGame.playerHit(socket.username, function(player) {
          io.to(socket.room).emit('playerHit', player);
        });
        if (blackjackGame.table.length == 0) {
          blackjackGame.dealerHit(function(dealer) {
            io.to(socket.room).emit('dealerHit', dealer);
            blackjackGame.getWinners(function(winners) {
              io.to(socket.room).emit('winners', winners);
            });
          });
        } else {
          io.to(socket.room).emit('turn', blackjackGame.table[blackjackGame.table.length - 1]);
        }
      })

      socket.on('stand', function() {
        var blackjackGame = rooms[socket.room];
        blackjackGame.playerStand(socket.username, function(player) {
          io.to(socket.room).emit('playerStand', player)
        });
        if (blackjackGame.table.length == 0) {
          blackjackGame.dealerHit(function(dealer) {
            io.to(socket.room).emit('dealerHit', dealer);
            blackjackGame.getWinners(function(winners) {
              io.to(socket.room).emit('winners', winners);
            });
          });
        } else {
          io.to(socket.room).emit('turn', blackjackGame.table[blackjackGame.table.length - 1]);
        }
      });

      socket.on('exitRoom', function() {
        var blackjackGame = rooms[socket.room];
        blackjackGame.removePlayer(socket.username, function(player) {
          io.to(socket.room).emit('removePlayer', player);
        });
        if (Object.keys(blackjackGame.players).length == 0) {
          delete rooms[socket.room];
          io.emit('deleteRoom', socket.room);
        }
        io.to(socket.room).emit('turn', blackjackGame.table[blackjackGame.table.length - 1]);
        socket.room = null;
      });

      socket.on('disconnect', function() {
        usernames.splice(usernames.indexOf(socket.username), 1);
        if (socket.room != null) {
          var blackjackGame = rooms[socket.room];
          blackjackGame.removePlayer(socket.username, function(player) {
            io.to(socket.room).emit('removePlayer', player);
          });
          if (Object.keys(blackjackGame.players).length == 0) {
            delete rooms[socket.room];
            io.emit('deleteRoom', socket.room);
          }
          io.to(socket.room).emit('turn', blackjackGame.table[blackjackGame.table.length - 1]);
          socket.room = null;
        }
      });

    });
  }
}
