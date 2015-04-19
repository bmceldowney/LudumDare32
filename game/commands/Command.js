var items = require('../resources/items');

function Command(key) {
  this.key = key;
  this.model = items[key];
  this.executing = new Phaser.Signal();
  this.onGranularityChange = new Phaser.Signal();
  this.granularity = 'general';
}

Command.prototype = Object.create(Object.prototype);
Command.constructor = Command;

Command.prototype.execute = function() {
  this.setGranularity('specific');
	this.executing.dispatch(this);
  console.log(this.key);
};

Command.prototype.setGranularity = function(level) {
  if (level !== this.granularity) {
    this.granularity = level;
    this.onGranularityChange.dispatch(this);
  }
};

Command.prototype.getName = function() {
  return this.model.name[this.granularity];
};

Command.prototype.getDescription = function() {
  return this.model.description[this.granularity];
};

Command.prototype.getModifier = function(type) {
  return this.model.modifiers[type] || 0;
};

module.exports = Command;

