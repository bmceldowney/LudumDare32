var CommandOption = require('./commandOption');
var optionOffsetLeft = 20;
var optionOffsetTop = -12;
var optionHeight = 30;

function CommandList(game, parent) {
  Phaser.Group.call(this, game, parent, 'CommandList');
  this.commandExecuted = new Phaser.Signal();
}

CommandList.MAX = 30;

CommandList.prototype = Object.create(Phaser.Group.prototype);
CommandList.constructor = CommandList;

CommandList.prototype.add = function(command) {

  if (this.length >= CommandList.MAX) {
    throw new Error('Can\'t add more commands to the list. Max length exceeded.');
  }

  Phaser.Group.prototype.add.call(this, new CommandOption(this.game, 0, 0, command.model));

  if (this.length === 1) {
    this.setActive(this.getAt(0));
  }

  command.executing.add(this._handleExecution, this);

  this._reposition();
};

CommandList.prototype.remove = function(command) {

  if (this.length <= 0) {
    throw new Error('There are no commands to remove from the list.');
  }

  this.forEach(function(child) {
    if (child.command === command) {
      Phaser.Group.prototype.remove.call(this, child);
    }
  }.bind(this));

  if (this.length > 0) {

    if (!this.cursor) {
      this.setActive(this.getAt(0));
    }
    else {
      this.setActive(this.cursor);
    }

    this._reposition();
  }
};

CommandList.prototype.setActive = function(command) {
  this.cursor && this.cursor.active(false);
  this.cursor = command;
  this.cursor.active(true);
};

CommandList.prototype.chooseNext = function() {
  this.cursor && this.cursor.active(false);
  this.next().active(true);
};

CommandList.prototype.choosePrev = function() {
  this.cursor && this.cursor.active(false);
  this.previous().active(true);
};

CommandList.prototype.getActiveCommand = function() {
  return this.cursor.command;
};

CommandList.prototype._handleExecution = function (e) {
  this.commandExecuted.dispatch(e);
};

CommandList.prototype._reposition = function() {

  var x = optionOffsetLeft;
  var y = optionOffsetTop;

  this.forEach(function(child) {

    y += optionHeight;

    if (y + child.height > this.parent.height) {
      x += child.width;
      y = optionHeight + optionOffsetTop;
    }

    child.x = x;
    child.y = y;

  }.bind(this));
};

module.exports = CommandList;
