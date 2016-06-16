//'use strict';

var uuid          = require('uuid'),
    io            = require('socket.io')(8000),
    roomGenerator = require('./roomGenerator'),
    helpers       = require('./helpers'),
    entities      = require('./entities'),
    Player        = entities.player;

var numberOfRooms = Math.round(Math.random() * 50);
var rooms = roomGenerator(numberOfRooms);
var connections = {};

io.on('connection', function(socket) {
    var playerId = uuid.v4();
    connections[playerId] = socket;
    connection = connections[playerId];

    connection.on('send', function(data) {
        io.emit('message', data);
    });
    connection.on('playerEnter', function(data) {
        var rooms = this.rooms;
        this.userName = data.userName;
        var roomNames = Object.keys(rooms);
        var randomRoomIndex = helpers.randomIntegerBetween(roomNames.length-1);
        var randomRoomName = roomNames[randomRoomIndex];

        var player = new Player(data.userName, playerId);
        rooms[randomRoomName].players[player.id] = player;

        connection.emit('enterRoom', rooms[randomRoomName]);
    }.bind(this))
    socket.on('disconnect', function() {
        io.emit('message', {
            type   : 'notice',
            message: this.userName + ' has left the game.'
        });
    }.bind(this));
}.bind({rooms}));