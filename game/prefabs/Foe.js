'use strict';

var Foe = function(game, config) {
  Phaser.Sprite.call(this, game, game.width, config.sprite.y, config.sprite.key, 0);

  config.sprite.animations.forEach(function (anim) {
		this.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
		if (anim.name === 'idle') {
			this.animations.play('idle');
		};
  }.bind(this));

  this.scale.setTo(4, 4);
  this.smoothed = false;
  this.intro = true;
  this.game.add.existing(this);
};

Foe.prototype = Object.create(Phaser.Sprite.prototype);
Foe.prototype.constructor = Foe;

Foe.prototype.attack = function () {
	this.animations.play('attack');
}

Foe.prototype.update = function() {
  if (this.intro) {
  	this.x -= 1.25;
  };
  // write your prefab's specific update code here
  
};

module.exports = Foe;
