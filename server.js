//'use strict';

var uuid          = require('uuid'),
    io            = require('socket.io')(8000),
    helpers       = require('./helpers'),
    entities      = require('./entities'),
    Player        = entities.player;

var numberOfRooms = Math.round(Math.random() * 50),
    rooms         = helpers.roomGenerator(numberOfRooms),
    connections   = {};

io.on('connection', function(socket) {
    var playerId          = uuid.v4(),
        connectionContext = {
            playerId: playerId,
            player  : null,
            rooms   : this.rooms
        };

    connections[playerId] = socket;

    connections[playerId].on('login', function(credentials) {
        this.player = new Player(this.playerId, credentials.name);

        connections[playerId].emit('login', this.player);
    }.bind(connectionContext));

    connections[playerId].on('send', function(data) {
        if (data.type === 'chat' || data.type === 'notice') {
            io.emit('message', data);
        } else if (data.type === 'localChat') {
            io.in(this.player.currentRoom).emit('message', data);
        }
    }.bind(connectionContext));

    connections[playerId].on('action', function(data) {
        var self = this;

        if (data.type === 'move') {
            var movement = this.player.move(data.direction, rooms);
            if (movement.success) {
                var toData   = {
                        userName: this.player.userName,
                        action  : 'entered'
                    },
                    fromData = {
                        userName: this.player.userName,
                        action  : 'left'
                    };

                connections[playerId].join(movement.success.to.room);
                connections[playerId].leave(movement.success.from.room);
                this.rooms[movement.success.to.room].players[this.player.id] = this.player;

                delete this.rooms[movement.success.from.room].players[this.player.id];

                io.in(movement.success.from.room).emit('roomAction', fromData);
                io.in(movement.success.to.room).emit('roomAction', toData);
                connections[playerId].emit('enterRoom', rooms[movement.success.to.room]);
            } else {
                io.in(this.player.currentRoom).emit('roomAction', movement.failure);
            }
        }
        else if (data.type === 'look') {
            connections[playerId].emit('lookData', this.rooms[this.player.currentRoom].exits);
        }
        else if (data.type === 'get') {
            var items    = rooms[this.player.currentRoom].items,
                gotItems = [];

            Object.keys(items).forEach(itemId => {
                if (items[itemId].title === data.itemTitle) {
                    self.player.items[itemId] = items[itemId];
                    gotItems.push(items[itemId]);

                    delete items[itemId];
                }
            });

            if (gotItems.length) {
                connections[this.player.id].emit('getItem', {gotItems});
            }
        }
    }.bind(connectionContext));

    connections[playerId].on('playerJoin', function() {
        var rooms           = this.rooms,
            roomNames       = Object.keys(rooms),
            randomRoomIndex = helpers.randomIntegerBetween(roomNames.length-1),
            randomRoomName  = roomNames[randomRoomIndex];

        var player = this.player;
        rooms[randomRoomName].players[player.id] = player;
        player.currentRoom = randomRoomName;

        connections[playerId].emit('enterRoom', rooms[randomRoomName]);
        connections[playerId].join(randomRoomName);
    }.bind(connectionContext));

    connections[playerId].on('disconnect', function() {
        delete rooms[this.player.currentRoom].players[this.player.id];

        io.emit('message', {
            type   : 'notice',
            message: this.player.userName + ' has left the game.'
        });
    }.bind(connectionContext));
}.bind({rooms}));
