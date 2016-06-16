'use strict';

var uuid     = require('uuid'),
    entities = require('./entities'),
    helpers  = require('./helpers');

var Room  = entities.room;

var antiCompass = {
        N: 'S',
        E: 'W',
        S: 'N',
        W: 'E'
    },
    rooms = {};

function randomExit(availableExits) {
    return availableExits[Math.floor(Math.random() *  availableExits.length)]
};

module.exports = function(numberNeeded) {
    for (var i=0; i <= numberNeeded; i++) {
        var connected = false,
            newRoom   = new Room('Room ' + i.toString());

        if (i > 0) {
            while (!connected) {
                var roomToConnect = 'Room ' + helpers.randomIntegerBetween(i - 1);

                var exitsAvailable = Object.keys(rooms[roomToConnect].exits).filter(function(otherRoomExitDirection) {
                    var canBeConnected = rooms[roomToConnect].exits[otherRoomExitDirection].connectedRoom === undefined;

                    return canBeConnected;
                });
                var roomsCanBeConnected = !!exitsAvailable.length;

                if (roomsCanBeConnected) {
                    var directionToConnect     = randomExit(exitsAvailable),
                        exitModificationChance = Math.random();

                    rooms[roomToConnect].exits[directionToConnect].connectedRoom = newRoom.name;
                    newRoom.exits[antiCompass[directionToConnect]].connectedRoom = roomToConnect;

                    rooms[newRoom.name] = newRoom;
                    connected = true;

                    if (exitModificationChance < 0.2) {
                        var exitsStillAvailable = Object.keys(newRoom.exits).filter(function(exitDirection) {
                            var canBeConnected = newRoom.exits[exitDirection].connectedRoom === undefined;

                            return canBeConnected;
                        });

                        if (exitsStillAvailable.length) {
                            var exitToBlock = exitsStillAvailable[helpers.randomIntegerBetween(1, exitsStillAvailable.length) - 1];
                            newRoom.exits[exitToBlock].connectedRoom = null;
                        }
                    } else if (exitModificationChance < 0.001) {
                        var exitsConnected = Object.keys(newRoom.exits).filter(function(exitDirection) {
                            var hasConnection = !!newRoom.exits[exitDirection].connectedRoom;

                            return hasConnection;
                        });

                        if (exitsConnected.length) {
                            var exitToHide = exitsConnected[helpers.randomIntegerBetween(1, exitsConnected.length) - 1];
                            newRoom.exits[exitToHide].hidden = true;
                        }
                    }
                }
            }
        } else {
            rooms[newRoom.name] = newRoom;
        }
    }

    return rooms;
};