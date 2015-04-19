'use strict';
var InfiniteScroller = function(game, x, y, textureName, speed) {
	this.game = game;
  this.sprite = this.game.add.sprite(0, 0, textureName);
  this.altSprite = this.game.add.sprite(this.sprite.width + game.width, 0, textureName);
  this.currentSprite = this.sprite;
  this.stagedSprite = this.altSprite;

  this.sprite.smoothed = false;
  this.altSprite.smoothed = false;

  this.sprite.scale.setTo(4, 4);
  this.altSprite.scale.setTo(4, 4);

  this.scrollSpeed = speed;
  this.paused = true;
};


InfiniteScroller.prototype.constructor = InfiniteScroller;

InfiniteScroller.prototype.update = function() {
	if (!this.paused) {
		this.sprite.x -= this.scrollSpeed;
		this.altSprite.x -= this.scrollSpeed;

		checkForSwap.call(this, this.sprite, this.altSprite);
	}
};

InfiniteScroller.prototype.startScroll = function() {
	this.paused = false;
};

InfiniteScroller.prototype.stopScroll = function() {
	this.paused = true;
};

function checkForSwap(sprite, altSprite) {
	if ((this.currentSprite.width + this.currentSprite.x) < this.game.width) {
		var stagedSprite = this.stagedSprite;
		this.stagedSprite.x = this.game.width - 1;

		this.stagedSprite = this.currentSprite;
		this.currentSprite = stagedSprite;
	};
}

module.exports = InfiniteScroller;
