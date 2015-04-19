'use strict';
var _ = require('underscore');
var playerConfig = require('../resources/player');
var blockmanConfig = playerConfig[0]
var tunaConfig = playerConfig[1];

var Player = function(game, config) {

  this.game = game;
  this.config = config;
  this.config.blockman = {
    x: config.x - 264,
    y: config.y - 59
  };
  // this.tuna = this.game.add.sprite(game.width, 0, 'tuna');
  this.tuna = this.game.add.sprite(config.x, config.y, 'tuna', tunaConfig.sprite.defaultFrame);
  this.tuna.smoothed = false;
  this.tuna.scale.setTo(tunaConfig.sprite.scaleX, tunaConfig.sprite.scaleY);

  this.blockman = this.game.add.sprite(this.config.blockman.x, this.config.blockman.y, 'blockman', blockmanConfig.sprite.defaultFrame);
  this.blockman.smoothed = false;
  this.blockman.scale.setTo(blockmanConfig.sprite.scaleX, blockmanConfig.sprite.scaleY);

  tunaConfig.sprite.animations.forEach(function (anim) {
    this.tuna.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
    if (anim.bm_pos) {
      // if we have a blockman delta with the animation, add it!
      tunaConfig.blockmanRunPos = {};
      _.each(anim.frames, function(k,i){
        tunaConfig.blockmanRunPos[k] = anim.bm_pos[i];
      });
      console.log("blockmandelta");
      console.log(tunaConfig.blockmanRunPos);
    }
  }.bind(this));

  blockmanConfig.sprite.animations.forEach(function (anim) {
        this.blockman.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
  }.bind(this));

  this.tuna.animations.play('walk');
  this.blockman.animations.play('walk');

  this.onHealthChanged = new Phaser.Signal();
  this.onDeath = new Phaser.Signal();

  this.maxHealth = 100;
  this.health = this.maxHealth;
  this.lastFrame = null;

  window.player = this;
};

Player.prototype = Object.create(Object);
Player.prototype.constructor = Player;

Player.prototype.stop = function() {
  this.tuna.animations.stop();
  this.blockman.animations.stop();
  this.tuna.frame = tunaConfig.sprite.defaultFrame;
  this.blockman.frame = blockmanConfig.sprite.defaultFrame;
  this.blockman.x = this.config.blockman.x;
  this.blockman.y = this.config.blockman.y;
  this.lastFrame = null;
}

Player.prototype.walk = function () {
  this.tuna.animations.play('walk');
  this.blockman.animations.play('walk');
}

Player.prototype.trot = function () {
  this.tuna.animations.play('trot');
  this.blockman.animations.play('reins');
}

Player.prototype.run = function () {
  this.tuna.animations.play('run');
  this.blockman.animations.play('reins');
  this.blockman.x += 18;
}

Player.prototype.swipe = function () {
    this.animations.play('attack');
};

Player.prototype.update = function() {
  if (this.tuna.animations.currentAnim.name === 'run'
    && !this.tuna.animations.currentAnim.paused
    ) {
    if (this.lastFrame === null) {
      this.lastFrame = this.tuna.animations.currentFrame.index;

    } else if (this.lastFrame !== this.tuna.animations.currentFrame.index) {
      this.lastFrame = this.tuna.animations.currentFrame.index;

      var blockmanOffset = tunaConfig.blockmanRunPos[this.tuna.animations.currentFrame.index];
      blockmanOffset = blockmanOffset* tunaConfig.sprite.scaleY;

      if (blockmanOffset) {
        this.blockman.y = this.config.blockman.y + blockmanOffset;
      }
    }

  }
};

Player.prototype.damage = function(value) {
  this.setHealth(this.health - value);
};

Player.prototype.heal = function(value) {
  this.setHealth(this.health + value);
};

Player.prototype.setHealth = function(value) {
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

Player.prototype.getHealthRatio = function() {
  return this.health / this.maxHealth;
};

module.exports = Player;
