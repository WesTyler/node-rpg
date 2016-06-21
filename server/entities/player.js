'use strict';

var uuid    = require('uuid'),
    helpers = require('../helpers/index');

function Player(id, name) {
    this.id = id || uuid.v4();
    this.userName = name;
    this.currentRoom = null;
    this.maxHp = 5;
    this.maxMp = 5;
    this.maxMove = 10;
    this.hp = 5;
    this.mp = 5;
    this.movePoints = 10;
    this.items = {};
    this.description = 'Just a person. Nothing much to see here.';
    this.selfDescription = 'You look down at your dirty clothes and wonder if it\'s time to buy some armor.';

    setInterval(() => {
        this.heal();
    }, 2500);
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

Player.prototype.heal = function() {
    if (this.hp < this.maxHp) {
        this.hp += 1;
    }

    if (this.mp < this.maxMp) {
        this.mp += 1;
    }

    if (this.movePoints < this.maxMove) {
        this.movePoints += 1;
    }
};

module.exports = Player;