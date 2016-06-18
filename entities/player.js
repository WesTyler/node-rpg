'use strict';

var uuid    = require('uuid'),
    helpers = require('../helpers');

function Player(id, name) {
    this.id = id || uuid.v4();
    this.userName = name;
    this.currentRoom = null;
    this.hp = 1;
    this.mp = 1;
    this.movePoints = 10;
};

Player.prototype.move = function (direction, rooms) {
    var success        = false,
        failureReason  = null,
        originRoomName = rooms[this.currentRoom].name,
        nextRoomName   = rooms[this.currentRoom].exits[direction].connectedRoom;

    if (nextRoomName && this.movePoints > 0) {
        success = true;
        delete rooms[this.currentRoom].players[this.id];
        this.currentRoom = nextRoomName;
        this.movePoints--;
        rooms[nextRoomName].players[this.id] = this;
    } else if (this.movePoints <= 0) {
        failureReason = 'Too exhausted to move.';
    }

    if (success) {
        return {
            success: {
                userName: this.userName,
                to      : {
                    direction: helpers.antiCompass[direction],
                    room     : nextRoomName
                },
                from    : {
                    direction: direction,
                    room     : originRoomName
                }
            }
        };
    } else {
        return {
            failure: {
                userName : this.userName,
                direction: direction,
                reason   : failureReason
            }
        }
    }
};

module.exports = Player;