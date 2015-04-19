var items = require('../resources/items');

function Command(key) {
  this.key = key;
  this.model = items[key];
  this.executing = new Phaser.Signal();
}

Command.prototype = Object.create(Object.prototype);
Command.constructor = Command;

Command.prototype.execute = function() {
	this.executing.dispatch(this);
  console.log(this.key);
};

module.exports = Command;

