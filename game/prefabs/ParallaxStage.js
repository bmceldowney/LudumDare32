'use strict';
var InfiniteScroller = require('../prefabs/InfiniteScroller');

var ParallaxStage = function(game, configArray) {
	this.game = game;
	this.layers = [];

	configArray.forEach(function (item) {
		this.layers.push(new InfiniteScroller(this.game, 0, 0, item.imageName, item.speed));
	}.bind(this));
}

ParallaxStage.prototype.update = function () {
	this.layers.forEach(function (layer) {
		layer.update();
	});
}

module.exports = ParallaxStage;
