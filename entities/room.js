'use strict';

var Enemy = require('./enemy'),
    Item  = require('./item');

function generateItems(itemProbability) {
    var items = {};

    if (itemProbability < 0.1) {
        var newItem = new Item();

        items[newItem.id] = newItem;
    }

    return items;
};

function generateEnemies(enemyProbability) {
    var enemies = {};

    if (enemyProbability < 0.2) {
        var newEnemy = new Enemy(),
            itemChance = Math.random();

        generateItems(newEnemy, itemChance);
        enemies[newEnemy.id] = newEnemy;
    }

    if (enemyProbability < 0.05) {
        var secondEnemy = new Enemy(),
            itemChance = Math.random();

        generateItems(secondEnemy, itemChance);
        enemies[secondEnemy.id] = secondEnemy;
    }

    return enemies;
};

var Room = function(name) {
    this.name    = name;
    this.exits   = {
        N: {},
        S: {},
        E: {},
        W: {}
    };
    this.players = {};
    this.enemies = generateEnemies(Math.random());
    this.items   = generateItems(Math.random());
};

module.exports = Room;