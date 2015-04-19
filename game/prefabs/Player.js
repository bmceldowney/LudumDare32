'use strict';
var _ = require('underscore');
var playerConfig = require('../resources/player');
var blockmanConfig = playerConfig[0]
var tunaConfig = playerConfig[1];

var Player = function(game, config) {

  this.game = game;
  this.config = _.extend(config, {
    tuna: {
      x: config.x,
      y: config.y,
    },
    blockman: {
      x: config.x - 264,
      y: config.y - 59
    }
  });

  this.tuna = this.game.add.sprite(config.x, config.y, 'tuna', tunaConfig.sprite.defaultFrame);
  this.tuna.smoothed = false;
  this.tuna.scale.setTo(tunaConfig.sprite.scaleX, tunaConfig.sprite.scaleY);

  this.blockman = this.game.add.sprite(this.config.blockman.x, this.config.blockman.y, 'blockman', blockmanConfig.sprite.defaultFrame);
  this.blockman.smoothed = false;
  this.blockman.scale.setTo(blockmanConfig.sprite.scaleX, blockmanConfig.sprite.scaleY);

  tunaConfig.sprite.animations.forEach(function (anim) {
    this.tuna.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
    tunaConfig[anim.name] = {};
    if (anim.bm_pos) {
      // if we have a blockman delta with the animation, add it!
      tunaConfig[anim.name].blockmanPosLookup = {};
      _.each(anim.frames, function(k,i){
        tunaConfig[anim.name].blockmanPosLookup[k] = anim.bm_pos[i];
      });
    }
    if (anim.tuna_pos) {
      // if we have a tuna delta with the animation, add it!
      tunaConfig[anim.name].tunaPosLookup = {};
      _.each(anim.frames, function(k,i){
        tunaConfig[anim.name].tunaPosLookup[k] = anim.tuna_pos[i];
      });
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
  this.blockman.animations.stop();
  this.tuna.animations.stop();

  this.blockman.frame = blockmanConfig.sprite.defaultFrame;
  this.tuna.frame = tunaConfig.sprite.defaultFrame;

  this.blockman.x = this.config.blockman.x;
  this.blockman.y = this.config.blockman.y;
  this.tuna.x = this.config.tuna.x;
  this.tuna.y = this.config.tuna.y;
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

Player.prototype.claws = function () {
  this.tuna.animations.play('claws');
  this.blockman.animations.play('wave');
}

Player.prototype.update = function() {
  var currentAnim = this.tuna.animations.currentAnim;
  var currentFrame = this.tuna.animations.currentFrame;
  if (!currentAnim.paused &&
    _.has(tunaConfig, currentAnim.name)
  ) {
    if (this.lastFrame === null) {
      this.lastFrame = currentFrame.index;
    } else if (this.lastFrame !== currentFrame.index) {
      this.lastFrame = currentFrame.index;

      if(_.has(tunaConfig[currentAnim.name], 'blockmanPosLookup')) {
        var bmOffset = tunaConfig[currentAnim.name].blockmanPosLookup[currentFrame.index];
        if (bmOffset) {
          this.blockman.x = this.config.blockman.x + (bmOffset[0] * tunaConfig.sprite.scaleY)
          this.blockman.y = this.config.blockman.y + (bmOffset[1] * tunaConfig.sprite.scaleY);
        }
      }
      if(_.has(tunaConfig[currentAnim.name], 'tunaPosLookup')) {
        var tunaOffset = tunaConfig[currentAnim.name].tunaPosLookup[currentFrame.index];
        if (tunaOffset) {
          this.tuna.x = this.config.tuna.x + (tunaOffset[0] * tunaConfig.sprite.scaleY)
          this.tuna.y = this.config.tuna.y + (tunaOffset[1] * tunaConfig.sprite.scaleY);
        }
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
