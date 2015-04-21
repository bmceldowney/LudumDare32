'use strict';
var Actor = require('./Actor');

var Foe = function(game, config) {
  Actor.call(this, game, game.width, config.sprite.y, config.sprite.key, 0, config);

  this.intro = true;
  this.attack = config.attack;

  // window.foe = this;
};

Foe.prototype = Object.create(Actor.prototype);
Foe.prototype.constructor = Foe;

Foe.prototype.update = function() {
  if (this.intro) {
  	this.x -= 10.25;
  };
};

module.exports = Foe;
