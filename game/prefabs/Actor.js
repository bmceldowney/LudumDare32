'use strict';

var Actor = function(game, x, y, spriteKey, initialFrame, config) {
  Phaser.Sprite.call(this, game, x, y, spriteKey, initialFrame);

  config.sprite.animations.forEach(_addAnimation, this);

  this.onHealthChanged = new Phaser.Signal();
  this.onDeath = new Phaser.Signal();

  this.name = config.name.toUpperCase();
  this.maxHealth = config.stats.health;
  this.health = this.maxHealth;
  this.scale.setTo(4, 4);
  this.smoothed = false;
  this.game.add.existing(this);
};

Actor.prototype = Object.create(Phaser.Sprite.prototype);
Actor.prototype.constructor = Actor;

Actor.prototype.update = function() {

};

Actor.prototype.damage = function(value) {
  _setHealth.call(this, this.health - value);
};

Actor.prototype.heal = function(value) {
  _setHealth.call(this, this.health + value);
};

Actor.prototype.getHealthRatio = function() {
  return this.health / this.maxHealth;
};

var _addAnimation = function (anim) {
	this.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
	if (anim.name === 'idle') {
		this.animations.play('idle');
	}
}

var _setHealth = function(value) {
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

module.exports = Actor;
