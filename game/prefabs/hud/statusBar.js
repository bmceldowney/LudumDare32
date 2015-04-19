var colors = require('../../resources/colors');

function StatusBar(game, x, y, w, h) {

  this.key = 'statusbar-' + Date.now();
  this.bmd = new Phaser.BitmapData(game, this.key, w, h);
  this.label = new Phaser.BitmapText(game, 5, -20, 'yoster-white', '', 18);

  Phaser.Sprite.call(this, game, x, y, this.bmd);

  this.checkWorldBounds = false;
  this.width = w;
  this.height = h;

  this.addChild(this.label);
  this._fillWithColor();
  this._drawBorder(colors.white);
}

StatusBar.prototype = Object.create(Phaser.Sprite.prototype);
StatusBar.constructor = StatusBar;

StatusBar.prototype.setLabel = function(value) {
  this.label.text = value;
};

StatusBar.prototype.setValue = function(pct) {
  this.bmd.clear();
  this._fillWithColor();
  this.bmd.rect(0, 0, this.width * pct, this.height, Phaser.Color.getWebRGB(0x00FF0000));
  this._drawBorder(colors.white);
};

StatusBar.prototype._drawBorder = function(color) {
  this.bmd.ctx.lineWidth = 5;
  this.bmd.ctx.strokeStyle = "white";
  this.bmd.ctx.strokeRect(2.5, 2.5, this.width - 5, this.height - 5);
};

StatusBar.prototype._fillWithColor = function(color) {
  this.bmd.rect(0, 0, this.width, this.height, Phaser.Color.getWebRGB(0xDDFFFFFF));
};

module.exports = StatusBar;
