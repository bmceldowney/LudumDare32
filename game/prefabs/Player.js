'use strict';
var Actor = require('./Actor');

var Player = function(game, config) {
  Actor.call(this, game, config.sprite.x, config.sprite.y, config.sprite.key, 0, config);
};

Player.prototype = Object.create(Actor.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function() {

};

module.exports = Player;
