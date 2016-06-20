'use strict';

var uuid = require('uuid');

var Item = function() {
    this.id = uuid.v4();
    this.title = 'thing';
};

module.exports = Item;