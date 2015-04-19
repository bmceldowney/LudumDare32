'use strict';

var ActionBase = function(game) {
	this.game = game;
	this.completed = new Phaser.Signal();
}

ActionBase.prototype.do = function () {
	if (!this._do) throw new Error('actions must define "_do" method');
	this._do()
}

ActionBase.prototype.done = function () {
	if (!this._done) throw new Error('actions must define "_done" method');
	this.completed.dispatch();
	this._done();
}

ActionBase.prototype.constructor = ActionBase;

module.exports = ActionBase;
