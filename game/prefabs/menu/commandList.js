var CommandOption = require('./commandOption');
var optionOffsetLeft = 20;
var optionOffsetTop = -12;
var optionHeight = 30;

function CommandList(game, parent) {
  Phaser.Group.call(this, game, parent, 'CommandList');
  this.commandExecuted = new Phaser.Signal();
  this.isDisabled = false;
}

CommandList.MAX = 30;

CommandList.prototype = Object.create(Phaser.Group.prototype);
CommandList.constructor = CommandList;

CommandList.prototype.disable = function() {
  this.isDisabled = true;
  this.callAll('disable', null, false);
  this.setActive(null);
};

CommandList.prototype.enable = function() {
  this.isDisabled = false;
  this.callAll('enable', null, false);
  this.setActive(this.getAt(this.cursorIndex));
};

CommandList.prototype.add = function(command) {

  if (this.length >= CommandList.MAX) {
    throw new Error('Can\'t add more commands to the list. Max length exceeded.');
  }

  Phaser.Group.prototype.add.call(this, new CommandOption(this.game, 0, 0, command));

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
  this.callAll('active', null, false);
  this.cursor = command;
  this.cursor && this.cursor.active(true);
};

CommandList.prototype.chooseUp = function() {

  if (this.isDisabled == true) {
    return;
  }

  this.callAll('active', null, false);

  if (this.cursor) {
    this.cursorIndex = (this.cursorIndex + -1 >= 0) ? this.cursorIndex + -1 : this.length + this.cursorIndex + -1;
    this.cursor = this.getAt(this.cursorIndex);
  }
  else {
    this.cursor = this.getAt(0);
  }
  this.cursor.active(true);
};

CommandList.prototype.chooseRight = function() {

  if (this.isDisabled == true) {
    return;
  }

  this.callAll('active', null, false);

  if (this.cursor) {
    this.cursorIndex = (this.cursorIndex + 6 < this.length) ? this.cursorIndex + 6 : (this.cursorIndex + 6) - this.length;
    this.cursor = this.getAt(this.cursorIndex);
  }
  else {
    this.cursor = this.getAt(0);
  }
  this.cursor.active(true);
};

CommandList.prototype.chooseDown = function() {

  if (this.isDisabled == true) {
    return;
  }

  this.callAll('active', null, false);

  if (this.cursor) {
    this.cursorIndex = (this.cursorIndex + 1 < this.length) ? this.cursorIndex + 1 : (this.cursorIndex + 1) - this.length;
    this.cursor = this.getAt(this.cursorIndex);
  }
  else {
    this.cursor = this.getAt(0);
  }
  this.cursor.active(true);
};

CommandList.prototype.chooseLeft = function() {

  if (this.isDisabled == true) {
    return;
  }

  this.callAll('active', null, false);

  if (this.cursor) {
    this.cursorIndex = (this.cursorIndex + -6 >= 0) ? this.cursorIndex + -6 : this.length + this.cursorIndex + -6;
    this.cursor = this.getAt(this.cursorIndex);
  }
  else {
    this.cursor = this.getAt(0);
  }
  this.cursor.active(true);
};

CommandList.prototype.getActiveCommand = function() {
  return (this.cursor) ? this.cursor.command : null;
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
