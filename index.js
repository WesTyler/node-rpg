//'use strict';

var uuid          = require('uuid'),
    io            = require('socket.io')(8000),
    roomGenerator = require('./roomGenerator'),
    helpers       = require('./helpers'),
    entities      = require('./entities'),
    Player        = entities.player;

var numberOfRooms = Math.round(Math.random() * 50),
    rooms         = roomGenerator(numberOfRooms),
    compass       = {'N': 'N', 'S': 'S', 'E': 'E', 'W': 'W'},
    connections   = {};

io.on('connection', function(socket) {
    var playerId          = uuid.v4(),
        userName          = 'A player',
        connectionContext = {
            playerId: playerId,
            player  : new Player(playerId, userName),
            rooms   : this.rooms
        };

    connections[playerId] = socket;
    connection = connections[playerId];

    connection.on('send', function(data) {
        if (data.type === 'chat' || data.type === 'notice') {
            io.emit('message', data);
        } else if (data.type === 'localChat') {
            io.in(this.player.currentRoom).emit('message', data);
        }
    }.bind(connectionContext));

    connection.on('action', function(data) {
        console.log(this.player.userName, 'submitted an action.');
        if (data.type === 'move' && compass[data.direction]) {
            var movement = this.player.move(data.direction, rooms);
            //console.log('movement result:\n', JSON.stringify(movement, null, 4));
            if (movement.success) {
                connection.join(movement.success.to.room);
                connection.leave(movement.success.from.room);

                io.in(movement.success.from.room).emit('roomAction', movement.success.to);
                io.in(movement.success.to.room).emit('roomAction', movement.success.from);
                connection.emit('enterRoom', rooms[movement.success.to.room]);
            } else {
                io.in(this.player.currentRoom).emit('roomAction', movement.failure);
            }
        }
    }.bind(connectionContext));

    connection.on('playerEnter', function(data) {
        var rooms = this.rooms;
        this.player.userName = data.userName;
        var roomNames = Object.keys(rooms);
        var randomRoomIndex = helpers.randomIntegerBetween(roomNames.length-1);
        var randomRoomName = roomNames[randomRoomIndex];

        var player = this.player;
        rooms[randomRoomName].players[player.id] = player;
        player.currentRoom = randomRoomName;
        console.log('Entered', randomRoomName)

        connection.emit('enterRoom', rooms[randomRoomName]);
        connection.join(randomRoomName);
    }.bind(connectionContext));

    connection.on('disconnect', function() {
        io.emit('message', {
            type   : 'notice',
            message: this.player.userName + ' has left the game.'
        });
    }.bind(connectionContext));
}.bind({rooms}));
