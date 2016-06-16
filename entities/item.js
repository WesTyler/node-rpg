'use strict';

var uuid = require('uuid');

var Item = function() {
    this.id = uuid.v4();
};

module.exports = Item;