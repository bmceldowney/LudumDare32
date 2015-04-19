'use strict';
var playerConfig = require('../resources/player');
var blockmanConfig = playerConfig[0]
var tunaConfig = playerConfig[1];

var Player = function(game, config) {

  this.game = game;
  this.tuna = this.game.add.sprite(config.x, config.y, 'tuna');
  this.tuna.smoothed = false;
  this.tuna.scale.setTo(tunaConfig["sprite"]["scaleX"], tunaConfig["sprite"]["scaleY"]);

  this.blockman = this.game.add.sprite(config.x - 264, config.y - 59, 'blockman', 23);
  this.blockman.smoothed = false;
  this.blockman.scale.setTo(blockmanConfig["sprite"]["scaleX"], blockmanConfig["sprite"]["scaleY"]);

  tunaConfig.sprite.animations.forEach(function (anim) {
        this.tuna.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
  }.bind(this));

  blockmanConfig.sprite.animations.forEach(function (anim) {
        this.blockman.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
  }.bind(this));

  this.tuna.animations.play('walk');
  this.blockman.animations.play('walk');

  this.onHealthChanged = new Phaser.Signal();

  this.maxHealth = 100;
  this.health = this.maxHealth;

  window.player = this;
};

Player.prototype = Object.create(Object);
Player.prototype.constructor = Player;

Player.prototype.swipe = function () {
    this.animations.play('attack');
};

Player.prototype.update = function() {
  console.log("updating player...")
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
  else if (this.health < 0) {
    this.health = 0;
  }
  this.onHealthChanged.dispatch(this);
};

Player.prototype.getHealthRatio = function() {
  return this.health / this.maxHealth;
};

module.exports = Player;
