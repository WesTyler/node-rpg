'use strict';

var uuid = require('uuid');

var Enemy = function() {
    this.id = uuid.v4();
    this.items = {};
};

module.exports = Enemy;