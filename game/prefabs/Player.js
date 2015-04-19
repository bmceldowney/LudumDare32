'use strict';
var playerConfig = require('../resources/player');
var blockmanConfig = playerConfig[0]
var tunaConfig = playerConfig[1];

var Player = function(game, config) {
  this.game = game;
  // this.tuna = this.game.add.sprite(game.width, 0, 'tuna');
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
};

Player.prototype = Object.create(Object);
Player.prototype.constructor = Player;

Player.prototype.swipe = function () {
    this.animations.play('attack');
}


Player.prototype.update = function() {
  console.log("updating player...")
};

module.exports = Player;
