'use strict';

var Foe = function(game, config) {
  Phaser.Sprite.call(this, game, game.width, config.sprite.y, config.sprite.key, 0);

  config.sprite.animations.forEach(function (anim) {
		this.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
		if (anim.name === 'idle') {
			this.animations.play('idle');
		}
  }.bind(this));

  this.scale.setTo(4, 4);
  this.smoothed = false;
  this.intro = true;
  this.game.add.existing(this);
  this.name = config.name.toUpperCase();

  this.onHealthChanged = new Phaser.Signal();
  this.onDeath = new Phaser.Signal();

  this.maxHealth = config.stats.health;
  this.health = this.maxHealth;

  window.foe = this;
};

Foe.prototype = Object.create(Phaser.Sprite.prototype);
Foe.prototype.constructor = Foe;

Foe.prototype.update = function() {
  if (this.intro) {
  	this.x -= 10.25;
  };
  // write your prefab's specific update code here

};

Foe.prototype.damage = function(value) {
  this.setHealth(this.health - value);
};

Foe.prototype.heal = function(value) {
  this.setHealth(this.health + value);
};

Foe.prototype.setHealth = function(value) {
  this.health = value;
  if (this.health > this.maxHealth) {
    this.health = this.maxHealth;
  }
  else if (this.health <= 0) {
    this.health = 0;
    this.onDeath.dispatch(this);
  }
  this.onHealthChanged.dispatch(this);
};

Foe.prototype.getHealthRatio = function() {
  return this.health / this.maxHealth;
};

module.exports = Foe;
