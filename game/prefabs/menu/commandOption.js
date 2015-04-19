var commands = require('../../resources/commands');
var colors = require('../../resources/colors');

function CommandOption(game, x, y, command) {

  this.command = command;
  this.bmd = new Phaser.BitmapData(game, this.key, 200, 16);
  this.bullet = new Phaser.BitmapText(game, 0, 2, 'yoster-white', '>', 12);
  this.text = new Phaser.BitmapText(game, 15, 0, 'yoster-white', this.command.model.name.general, 18);

  Phaser.Sprite.call(this, game, x, y, this.bmd);

  this.active(false);
  this.addChild(this.bullet);
  this.addChild(this.text);
}

CommandOption.prototype = Object.create(Phaser.Sprite.prototype);
CommandOption.constructor = CommandOption;

CommandOption.prototype.active = function(isActive) {

  if (isActive !== undefined) {
    this._active = Boolean(isActive);
    this.bullet.visible = this._active;
  }

  return this._active;
};

module.exports = CommandOption;
