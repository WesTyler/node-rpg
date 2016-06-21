//'use strict';

var uuid          = require('uuid'),
    io            = require('socket.io')(8000),
    helpers       = require('./helpers'),
    entities      = require('./entities'),
    roomGenerator = require('./roomGenerator'),
    Player        = entities.player;

var numberOfRooms = Math.round(Math.random() * 50),
    rooms         = roomGenerator(numberOfRooms),
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
            var lookData;

            if (data.target) {
                var availableLookTargets = {};

                Object.keys(this.rooms[self.player.currentRoom].players).forEach(playerId => {
                    var player = self.rooms[self.player.currentRoom].players[playerId];
                    var name = player.userName;

                    availableLookTargets[name] = player;
                });

                Object.keys(self.rooms[self.player.currentRoom].enemies).forEach(enemyId => {
                    var enemy = self.rooms[self.player.currentRoom].enemies[enemyId];
                    var name = enemy.title;

                    availableLookTargets[name] = enemy;
                });

                Object.keys(self.rooms[self.player.currentRoom].items).forEach(itemId => {
                    var item = self.rooms[self.player.currentRoom].items[itemId];
                    var name = item.title;

                    availableLookTargets[name] = item;
                });

                lookData = availableLookTargets[data.target] || {description: 'You don\'t see ' + data.target + ' here.'};

                if (data.target === 'self' || data.target === this.player.userName) {
                    lookData = {description: this.player.selfDescription};
                }
            } else {
                lookData = self.rooms[self.player.currentRoom]
            }

            connections[playerId].emit('lookData', lookData);
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
