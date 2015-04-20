(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
	this.executing.dispatch(this.model);
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

},{"../resources/items":19}],2:[function(require,module,exports){
'use strict';

//global variables
window.onload = function () {
  var game = new Phaser.Game(960, 640, Phaser.AUTO, 'ludumdare32');

  // Game States
  game.state.add('boot', require('./states/boot'));
  game.state.add('gameover', require('./states/gameover'));
  game.state.add('menu', require('./states/menu'));
  game.state.add('play', require('./states/play'));
  game.state.add('preload', require('./states/preload'));
  

  game.state.start('boot');
};
},{"./states/boot":21,"./states/gameover":22,"./states/menu":23,"./states/play":24,"./states/preload":25}],3:[function(require,module,exports){
'use strict';
var foes = require('../resources/foes');
var Foe = require('./Foe');
var Attack = require('./actions/Attack');

var baseCooldown = 10;

var Encounter = function(game, tier, modifiers, player) {
	this.game = game;
	this.globalModifiers = modifiers;
	this.beginPlayerTurn = new Phaser.Signal();

	// for ludum dare 32 we will only have the one foe
	// but later it may be different
	this.foes = getFoes(game);
	this.player = player;
	this.playerCooldown = 0;
	this.foeCooldown = 0;
	this.currentAction = null;
};

Encounter.prototype.constructor = Encounter;

Encounter.prototype.resolveCommand = function(command) {
  console.log(command.name.specific);

  if (this.currentAction) {
  	this.currentAction.completed.remove(actionDone, this);
  };

  this.playerCooldown = baseCooldown * command.modifiers.cooldown;
	switch (command.name.specific) {
		case 'TEETH':
		case 'CLAWS':
			this.currentAction = new Attack(this.game, this.player, this.foes[0], command, this);
		break;
	}

	this.currentAction.completed.add(actionDone, this);
	this.currentAction.do();
}

function actionDone () {
	if (this.playerCooldown > this.foeCooldown) {
		this.playerCooldown = Math.floor(this.playerCooldown -= this.foeCooldown);
		foeAction.call(this);
	} else if (this.playerCooldown < this.foeCooldown) {
		this.foeCooldown = Math.floor(this.foeCooldown -= this.playerCooldown);
		this.beginPlayerTurn.dispatch();
	} else {
		this.playerCooldown = this.foeCooldown = 0;
		this.beginPlayerTurn.dispatch();
	};
}

function foeAction () {
	// maybe something other than attacking?
	this.foeCooldown = baseCooldown * this.foes[0].attack.modifiers.cooldown;
  if (this.currentAction) {
  	this.currentAction.completed.remove(actionDone, this);
  };

	this.currentAction = new Attack(this.game, this.foes[0], this.player, this.foes[0].attack, this);
	this.currentAction.completed.add(actionDone, this);
	this.currentAction.do();
}

function calculateDamage (attacker, defender, command, context) {

}

function getFoes(game) {
	var retval = [];
	var foeIndex = Math.floor(Math.random() * foes.length);

	// there will be more than one maybe
	retval.push(new Foe(game, foes[foeIndex]));

	return retval;
}

module.exports = Encounter;

},{"../resources/foes":18,"./Foe":5,"./actions/Attack":9}],4:[function(require,module,exports){
'use strict';
var Encounter = require('./Encounter');
var HealthBar = require('./hud/statusBar');

var EncounterManager = function(game, player, commands) {
	this.game = game;
	this.currentTier = 0;
	this.player = player;
	this.commands = commands;

	this.beginInteraction = new Phaser.Signal();
	this.endInteraction = new Phaser.Signal();

	this.traveling = new Phaser.Signal();
	this.encountering = new Phaser.Signal();
  this.playerHealthBar = new HealthBar(game, 20, 30, this.game.width / 2 - 40, 20, 'ltr');
  this.foeHealthBar = new HealthBar(game, this.game.width / 2 + 20, 30, this.game.width / 2 - 40, 20, 'rtl');
};

EncounterManager.prototype.constructor = EncounterManager;

EncounterManager.prototype.start = function() {
	startWalking.call(this);
};

EncounterManager.prototype.executeCommand = function (commandName) {
	// we need an encounter to act
	if (this.encounter) {
		this.endInteraction.dispatch();
		this.encounter.resolveCommand(commandName);
	};
}

function startWalking () {
	this.traveling.dispatch();
	this.game.time.events.add(500, introFoes, this);
	this.player.run();
}

function introFoes () {
	this.encounter = new Encounter(this.game, 0, null, this.player);
	this.encounter.beginPlayerTurn.add(function () {
		this.beginInteraction.dispatch();
	}.bind(this));

	this.game.time.events.add(500, stopWalking, this);
}

function stopWalking () {
	this.encountering.dispatch();
	this.encounter.foes.forEach(function (foe) {
		foe.intro = false;
	});
	this.player.stop();

	startCombat.call(this);
}

function startCombat () {
	// combat simulation!
	this.beginInteraction.dispatch();

  this.game.add.existing(this.foeHealthBar);
  this.foeHealthBar.setLabel(this.encounter.foes[0].name);
  this.foeHealthBar.setValue(this.encounter.foes[0].getHealthRatio());
  this.encounter.foes[0].onHealthChanged.add(foeHealthChange, this);
  this.encounter.foes[0].onDeath.add(foeDead, this);

  this.game.add.existing(this.playerHealthBar);
  this.playerHealthBar.setLabel('BLOCKMAN AND TUNA');
  this.playerHealthBar.setValue(this.player.getHealthRatio());
  this.player.onHealthChanged.add(playerHealthChange, this);
  this.player.onDeath.add(playerDead, this);
}

function playerHealthChange() {
  this.playerHealthBar.setValue(this.player.getHealthRatio());
}

function foeHealthChange() {
  this.foeHealthBar.setValue(this.encounter.foes[0].getHealthRatio());
}

function playerDead() {
  console.log('OH GOD NO! THE PLAYER IS DEAD');
  this.game.state.start('play');
}

function foeDead() {
  console.log('SWEET! YOU KILLED THE BAD GUY');
  this.game.state.start('play');
}

module.exports = EncounterManager;

},{"./Encounter":3,"./hud/statusBar":10}],5:[function(require,module,exports){
'use strict';

var Foe = function(game, config) {
  Phaser.Sprite.call(this, game, game.width, config.sprite.y, config.sprite.key, 0);

  config.sprite.animations.forEach(function (anim) {
		this.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
		if (anim.name === 'idle') {
			this.animations.play('idle');
		}
  }.bind(this));

  this.scale.setTo(4, 4);
  this.smoothed = false;
  this.intro = true;
  this.game.add.existing(this);
  this.name = config.name.toUpperCase();

  this.onHealthChanged = new Phaser.Signal();
  this.onDeath = new Phaser.Signal();

  this.maxHealth = config.stats.health;
  this.health = this.maxHealth;

  this.attack = config.attack;
  window.foe = this;
};

Foe.prototype = Object.create(Phaser.Sprite.prototype);
Foe.prototype.constructor = Foe;

Foe.prototype.update = function() {
  if (this.intro) {
  	this.x -= 10.25;
  };
  // write your prefab's specific update code here

};

Foe.prototype.damage = function(value) {
  this.setHealth(this.health - value);
};

Foe.prototype.heal = function(value) {
  this.setHealth(this.health + value);
};

Foe.prototype.setHealth = function(value) {
  this.health = value;
  if (this.health > this.maxHealth) {
    this.health = this.maxHealth;
  }
  else if (this.health <= 0) {
    this.health = 0;
    this.onDeath.dispatch(this);
  }
  this.onHealthChanged.dispatch(this);
};

Foe.prototype.getHealthRatio = function() {
  return this.health / this.maxHealth;
};

module.exports = Foe;

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

ParallaxStage.prototype.startScroll = function () {
	this.layers.forEach(function (layer) {
		layer.startScroll();
	});
}

ParallaxStage.prototype.stopScroll = function () {
	this.layers.forEach(function (layer) {
		layer.stopScroll();
	});
}

module.exports = ParallaxStage;

},{"../prefabs/InfiniteScroller":6}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
'use strict';
var ActionBase = require('./ActionBase');

var baseDamage = 20;

var Attack = function(game, attacker, defender, command) {
	ActionBase.call(this, game);

	this.damageText = new Phaser.BitmapText(game, 10, 10, 'yoster-white', '0', 8);
	this.game.physics.enable(this.damageText, Phaser.Physics.ARCADE);
	this.damageText.body.gravity.set(0, 180);
	this.damageText.body.velocity.setTo(20, -50);

	this.attacker = attacker;
	this.defender = defender;
	this.command = command;
};

Attack.prototype = Object.create(ActionBase.prototype);
Attack.prototype.constructor = Attack;

Attack.prototype._do = function () {
	var anim;
	var animName = this.command.name.specific.toLowerCase();
	if (this.attacker && this.attacker.animations) {
		anim = this.attacker.animations.play(animName);
		anim.onComplete.add(this._attackComplete, this);
	} else {
		this._attackComplete.call(this);
	};
}

Attack.prototype._done = function () {
	//cleanup
	this.damageText.destroy();
}

Attack.prototype._attackComplete =	function () {
	var anim = this.defender.animations.play('hit');
	var damage = Math.floor(baseDamage * this.command.modifiers.power);
  this.defender.damage(damage);
	this.damageText.setText(damage);
	this.defender.addChild(this.damageText);

	this.game.time.events.add(800, afterPause, this);

	function afterPause () {
		if (anim) {
			anim.onComplete.add(this.done, this);
		} else {
			this.done();
		};
	}
}

module.exports = Attack;

},{"./ActionBase":8}],10:[function(require,module,exports){
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

},{"../../resources/colors":16}],11:[function(require,module,exports){
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

},{"./commandOption":12}],12:[function(require,module,exports){
var commands = require('../../resources/commands');
var colors = require('../../resources/colors');

function CommandOption(game, x, y, command) {

  this.command = command;
  this.bmd = new Phaser.BitmapData(game, this.key, 200, 16);
  this.bullet = new Phaser.BitmapText(game, 0, 2, 'yoster-white', '>', 12);
  this.name = new Phaser.BitmapText(game, 15, 0, 'yoster-blue', this.command.getName(), 18);

  Phaser.Sprite.call(this, game, x, y, this.bmd);

  this.active(false);
  this.addChild(this.bullet);
  this.addChild(this.name);

  this.command.onGranularityChange.add(function() {
    this.name.font = 'yoster-white';
    this.name.text = this.command.getName();
  }, this);
}

CommandOption.prototype = Object.create(Phaser.Sprite.prototype);
CommandOption.constructor = CommandOption;

CommandOption.prototype.disable = function() {
  this.active(false);
  this.name.font = 'yoster-gray';
};

CommandOption.prototype.enable = function() {
  if (this.command.granularity === 'specific') {
    this.name.font = 'yoster-white';
  }
  else {
    this.name.font = 'yoster-blue';
  }
};

CommandOption.prototype.active = function(isActive) {

  if (isActive !== undefined) {
    this._active = Boolean(isActive);
    this.bullet.visible = this._active;
  }

  return this._active;
};

module.exports = CommandOption;

},{"../../resources/colors":16,"../../resources/commands":17}],13:[function(require,module,exports){
var Panel = require('./../panel');
var CommandList = require('./commandList');

function Menu(game, x, y, w, h) {

  this.bmd = new Phaser.BitmapData(game, this.key, w, h);

  Phaser.Sprite.call(this, game, x, y, this.bmd);

  this.panel = new Panel(game, 0, 0, w, h);
  this.commands = new CommandList(game, this);

  this.addChild(this.panel);
  this.addChild(this.commands);
  this.disable();
}

Menu.prototype = Object.create(Phaser.Sprite.prototype);
Menu.constructor = Menu;

Menu.prototype.disable = function() {
  this.commands.disable();
};

Menu.prototype.enable = function() {
  this.commands.enable();
};

module.exports = Menu;

},{"./../panel":14,"./commandList":11}],14:[function(require,module,exports){
var colors = require('../resources/colors');

function Panel(game, x, y, w, h) {

  this.key = 'panel-' + Date.now();
  this.bmd = new Phaser.BitmapData(game, this.key, w, h);

  Phaser.Sprite.call(this, game, x, y, this.bmd);

  this.checkWorldBounds = false;
  this.width = w;
  this.height = h;
  this._fillWithColor(colors.blue, colors.dark_blue);
  this._drawBorder(colors.white);
}

Panel.prototype = Object.create(Phaser.Sprite.prototype);
Panel.constructor = Panel;

Panel.prototype._drawBorder = function(color) {

  this.bmd.ctx.lineWidth = 5;
  this.bmd.ctx.strokeStyle = "white";
  this.bmd.ctx.strokeRect(2.5, 2.5, this.width - 5, this.height - 5);
};

Panel.prototype._fillWithColor = function(from, to) {

  var y = -15;
  var step = 0;
  var steps = Math.ceil(this.height / 15);
  var color = null;

  while (steps >= step) {

    color = Phaser.Color.interpolateColor(from, to, steps, step);
    this.bmd.rect(0, y, this.width, y + (15 * step), Phaser.Color.getWebRGB(color));
    step++;
    y = y + 15;
  }
};

module.exports = Panel;

},{"../resources/colors":16}],15:[function(require,module,exports){
'use strict';
var _ = require('underscore');
var playerConfig = require('../resources/player');
var blockmanConfig = playerConfig[0]
var tunaConfig = playerConfig[1];

var Player = function(game, config) {

  this.game = game;
  this.config = _.extend(config, {
    tuna: {
      x: config.x,
      y: config.y,
    },
    blockman: {
      x: config.x - 264,
      y: config.y - 59
    }
  });

  this.tuna = this.game.add.sprite(config.x, config.y, 'tuna', tunaConfig.sprite.defaultFrame);
  this.tuna.smoothed = false;
  this.tuna.scale.setTo(tunaConfig.sprite.scaleX, tunaConfig.sprite.scaleY);

  this.blockman = this.game.add.sprite(this.config.blockman.x, this.config.blockman.y, 'blockman', blockmanConfig.sprite.defaultFrame);
  this.blockman.smoothed = false;
  this.blockman.scale.setTo(blockmanConfig.sprite.scaleX, blockmanConfig.sprite.scaleY);

  tunaConfig.sprite.animations.forEach(function (anim) {
    this.tuna.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
    tunaConfig[anim.name] = {};
    if (anim.bm_pos) {
      // if we have a blockman delta with the animation, add it!
      tunaConfig[anim.name].blockmanPosLookup = {};
      _.each(anim.frames, function(k,i){
        tunaConfig[anim.name].blockmanPosLookup[k] = anim.bm_pos[i];
      });
    }
    if (anim.tuna_pos) {
      // if we have a tuna delta with the animation, add it!
      tunaConfig[anim.name].tunaPosLookup = {};
      _.each(anim.frames, function(k,i){
        tunaConfig[anim.name].tunaPosLookup[k] = anim.tuna_pos[i];
      });
    }
  }.bind(this));

  blockmanConfig.sprite.animations.forEach(function (anim) {
    this.blockman.animations.add(anim.name, anim.frames, anim.frameRate, anim.loop);
  }.bind(this));

  this.tuna.animations.play('walk');
  this.blockman.animations.play('walk');
  this.animations = new AnimationDelegate(this);
  this.addChild = function () {
    this.blockman.addChild.apply(this.blockman, arguments);
  }

  this.onHealthChanged = new Phaser.Signal();
  this.onDeath = new Phaser.Signal();

  this.maxHealth = 100;
  this.health = this.maxHealth;
  this.lastFrame = null;

  window.player = this;
};

function AnimationDelegate (context) {
  this.play = function (key) {
    var anim = context.tuna.animations.getAnimation(key) || context.blockman.animations.getAnimation(key);
    if (anim) {
      anim.play();
    };

    return anim;
  }
}

Player.prototype = Object.create(Object);
Player.prototype.constructor = Player;

Player.prototype.stop = function() {
  this.blockman.animations.stop();
  this.tuna.animations.stop();

  this.blockman.frame = blockmanConfig.sprite.defaultFrame;
  this.tuna.frame = tunaConfig.sprite.defaultFrame;

  this.blockman.x = this.config.blockman.x;
  this.blockman.y = this.config.blockman.y;
  this.tuna.x = this.config.tuna.x;
  this.tuna.y = this.config.tuna.y;
  this.lastFrame = null;
}

Player.prototype.walk = function () {
  this.tuna.animations.play('walk');
  this.blockman.animations.play('walk');
}

Player.prototype.trot = function () {
  this.tuna.animations.play('trot');
  this.blockman.animations.play('reins');
}

Player.prototype.run = function () {
  this.tuna.animations.play('run');
  this.blockman.animations.play('reins');
  this.blockman.x += 18;
}

Player.prototype.teeth = function () {
  var anim = this.tuna.animations.play('teeth');
  this.blockman.animations.play('wave');

  anim.onComplete.add(this.stop, this);

}

Player.prototype.claws = function () {
  var anim = this.tuna.animations.play('claws');
  this.blockman.animations.play('wave');

  anim.onComplete.add(this.stop, this);
}

Player.prototype.update = function() {
  var currentAnim = this.tuna.animations.currentAnim;
  var currentFrame = this.tuna.animations.currentFrame;
  if (!currentAnim.paused && _.has(tunaConfig, currentAnim.name) ) {
    if (this.lastFrame === null) {
      this.lastFrame = currentFrame.index;
    } else if (this.lastFrame !== currentFrame.index) {
      this.lastFrame = currentFrame.index;

      if(_.has(tunaConfig[currentAnim.name], 'blockmanPosLookup')) {
        var bmOffset = tunaConfig[currentAnim.name].blockmanPosLookup[currentFrame.index];
        if (bmOffset) {
          this.blockman.x = this.config.blockman.x + (bmOffset[0] * tunaConfig.sprite.scaleY)
          this.blockman.y = this.config.blockman.y + (bmOffset[1] * tunaConfig.sprite.scaleY);
        }
      }
      if(_.has(tunaConfig[currentAnim.name], 'tunaPosLookup')) {
        var tunaOffset = tunaConfig[currentAnim.name].tunaPosLookup[currentFrame.index];
        if (tunaOffset) {
          this.tuna.x = this.config.tuna.x + (tunaOffset[0] * tunaConfig.sprite.scaleY)
          this.tuna.y = this.config.tuna.y + (tunaOffset[1] * tunaConfig.sprite.scaleY);
        }
      }
    }
  }
};

Player.prototype.damage = function(value) {
  this.setHealth(this.health - value);
};

Player.prototype.heal = function(value) {
  this.setHealth(this.health + value);
};

Player.prototype.setHealth = function(value) {
  this.health = value;
  if (this.health > this.maxHealth) {
    this.health = this.maxHealth;
  }
  else if (this.health <= 0) {
    this.health = 0;
    this.onDeath.dispatch(this);
  }
  this.onHealthChanged.dispatch(this);
};

Player.prototype.getHealthRatio = function() {
  return this.health / this.maxHealth;
};

module.exports = Player;

},{"../resources/player":20,"underscore":26}],16:[function(require,module,exports){
module.exports={
  "black": "0x111111",
  "white": "0xfdfdfd",
  "blue": "0x6B6BC6",
  "dark_blue": "0x000029"
}

},{}],17:[function(require,module,exports){
module.exports={
  "fight": "Fight",
  "run": "Run Away!",
  "item": "Use an Item"
}

},{}],18:[function(require,module,exports){
module.exports=[
	{
		"name": "golem",
		"sprite": {
			"key": "golem",
			"x": 460,
			"y": 210,
      "scaleX": 4,
      "scaleY": 4,
			"animations": [{
				"name": "walk",
				"frames": [0,1,2,3],
				"frameRate": 4,
				"loop": true
			},{
				"name": "fists",
				"frames": [4,5,6,5],
				"frameRate": 5,
				"loop": false
			},{
				"name": "block",
				"frames": [8,9,10,9],
				"frameRate": 5,
				"loop": false
			},{
				"name": "attack",
				"frames": [12,13,14,13],
				"frameRate": 5,
				"loop": false
			}]
		},
		"stats": {
			"power": 10,
			"stamina": 15,
			"health": 50,
			"defense": 20
		},
		"attack": {
	    "name": {
	      "specific": "attack"
	    },
	    "description": {
	      "general": "My claws must be good for something...",
	      "specific": "Tear 'em to shreds!"
	    },
	    "modifiers": {
	      "cooldown": 1,
	      "power": 1
	    }
	  }
	},{
		"name": "jug",
		"sprite": {
			"key": "jug",
			"x": 460,
			"y": 250,
      "scaleX": 4,
      "scaleY": 4,
			"animations": [{
				"name": "idle",
				"frames": [4,3,2,1],
				"frameRate": 1,
				"loop": true
			},{
				"name": "walk",
				"frames": [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],
				"frameRate": 5,
				"loop": true
			},{
				"name": "attack",
				"frames": [5,6,7,6,7,6,7,8],
				"frameRate": 5,
				"loop": false
			}]
		},
		"stats": {
			"power": 10,
			"stamina": 15,
			"health": 50,
			"defense": 20
		},
		"attack": {
	    "name": {
	      "specific": "attack"
	    },
	    "description": {
	      "general": "My claws must be good for something...",
	      "specific": "Tear 'em to shreds!"
	    },
	    "modifiers": {
	      "cooldown": 1,
	      "power": 1
	    }
	  }
	}
]
},{}],19:[function(require,module,exports){
module.exports={
  "claws": {
    "name": {
      "general": "CLAWS?",
      "specific": "CLAWS"
    },
    "description": {
      "general": "My claws must be good for something...",
      "specific": "Tear 'em to shreds!"
    },
    "modifiers": {
      "cooldown": 1,
      "power": 1
    }
  },
  "teeth": {
    "name": {
      "general": "TEETH?",
      "specific": "TEETH"
    },
    "description": {
      "general": "My teeth must be good for something...",
      "specific": "Go for the jugular!"
    },
    "modifiers": {
      "cooldown": 1.2,
      "power": 1.2
    }
  },
  "tuna": {
    "name": {
      "general": "UNOPENED CAN?",
      "specific": "CANNED TUNA"
    },
    "description": {
      "general": "Smells fishy...",
      "specific": "Regain some HP"
    },
    "modifiers": {
      "cooldown": 1.2,
      "health": 0.5
    }
  },
  "bad_tuna": {
    "name": {
      "general": "UNOPENED CAN?",
      "specific": "EXPIRED TUNA"
    },
    "description": {
      "general": "Smells really fishy...",
      "specific": "Lose some HP"
    },
    "modifiers": {
      "cooldown": 1.2,
      "health": -0.33
    }
  }
}

},{}],20:[function(require,module,exports){
module.exports=[
  {
    "name": "blockman",
    "sprite": {
      "key": "blockman",
      "x": 460,
      "y": 350,
      "scaleX": 8,
      "scaleY": 8,
      "defaultFrame": 23,
      "animations": [{
        "name": "walk",
        "frames": [38, 39, 38, 40],
        "frameRate": 4,
        "loop": true
      },{
        "name": "reins",
        "frames": [23, 24, 25, 26, 27, 28],
        "frameRate": 4,
        "loop": true
      },{
        "name": "wave",
        "frames": [375, 376, 377, 378, 378, 379, 379, 380,
                  381, 381, 381, 381, 
                  380, 379, 377, 376, 375,],
        "derpframes": [414, 415, 416, 417, 418, 419, 420, 421,
                  422, 422, 422, 422, 
                  420, 418, 416, 415, 414,],
        "frameRate": 8,
        "loop": false
      },{
        "name": "dumpwater",
        "frames": [],
        "frameRate": 4,
        "loop": false
      },{
        "name": "throw",
        "frames": [],
        "frameRate": 4,
        "loop": false
      },{
        "name": "rockspin",
        "frames": [],
        "frameRate": 4,
        "loop": true
      }]
    }
  },
  {
    "name": "tuna",
    "sprite": {
      "key": "tuna",
      "x": 460,
      "y": 350,
      "scaleX": -5,
      "scaleY": 5,
      "defaultFrame": 0,
      "animations": [{
        "name": "walk",
        "frames": [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44],
        "frameRate": 8,
        "loop": true
      },{
        "name": "trot",
        "frames": [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46],
        "frameRate": 10,
        "loop": true
      },{
        "name": "run",
        "frames": [ 3,  7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47],
        "bm_pos": [[8, 1], [8, 0], [8, 1], [8, 1], [8, 2], [8, 4], [8, 5], [8, 6], [8, 7], [8, 7], [8, 5], [8, 3],],
        "frameRate": 4,
        "loop": true
      },{
        "name": "claws",
        "frames": [2, 6, 10, 14, 18, 22, 26, 30,
                  34, 34, 34, 34, 
                  18, 14, 10, 6, 2,],
        "bm_pos": [[0,0], [10,0], [20,0], [30,0], [40,0], [50,0], [60,0], [70,0], 
                    [80,0], [80,0], [80,0], [80,0], 
                    [60,0], [40,0], [20,0], [10,0], [0,0],],
        "tuna_pos": [[0,0], [10,0], [20,0], [30,0], [40,0], [50,0], [60,0], [70,0], 
                    [80,0], [80,0], [80,0], [80,0], 
                    [60,0], [40,0], [20,0], [10,0], [0,0],],
        "frameRate": 8,
        "loop": false
      },{
        "name": "teeth",
        "frames": [ 3,  7, 11, 15, 19, 23, 27, 31, 
                  35, 35, 35, 35, 
                  27, 19, 11, 7, 3,],
        "derpframes": [2, 6, 10, 14, 18, 22, 26, 30,
                  34, 34, 34, 34, 
                  18, 14, 10, 6, 2,],
        "bm_pos": [[8,1], [18,0], [28,1], [38,1], [48,2], [58,4], [68,5], [78,6], 
                    [88,7], [88,7], [88,7], [88,7], 
                    [68,5], [48,2], [28,1], [18,0], [8,0],],
        "tuna_pos": [[0,0], [10,0], [20,0], [30,0], [40,0], [50,0], [60,0], [70,0], 
                    [80,0], [80,0], [80,0], [80,0], 
                    [60,0], [40,0], [20,0], [10,0], [0,0],],
        "frameRate": 8,
        "loop": false
      },{
        "name": "sit",
        "frames": [1, 5, 9, 13, 17, 21],
        "frameRate": 8,
        "loop": false
      },{
        "name": "unsit",
        "frames":  [21, 17, 13, 9, 5, 1],
        "frameRate": 8,
        "loop": false
      }]
    }
  }
]
},{}],21:[function(require,module,exports){

'use strict';

function Boot() {
}

Boot.prototype = {
  preload: function() {
    this.load.image('preloader', 'assets/preloader.gif');
  },
  create: function() {
    this.game.input.maxPointers = 1;
    this.game.state.start('preload');
  }
};

module.exports = Boot;

},{}],22:[function(require,module,exports){

'use strict';
function GameOver() {}

GameOver.prototype = {
  preload: function () {

  },
  create: function () {
    var style = { font: '65px Arial', fill: '#ffffff', align: 'center'};
    this.titleText = this.game.add.text(this.game.world.centerX,100, 'Game Over!', style);
    this.titleText.anchor.setTo(0.5, 0.5);

    this.congratsText = this.game.add.text(this.game.world.centerX, 200, 'You Win!', { font: '32px Arial', fill: '#ffffff', align: 'center'});
    this.congratsText.anchor.setTo(0.5, 0.5);

    this.instructionText = this.game.add.text(this.game.world.centerX, 300, 'Click To Play Again', { font: '16px Arial', fill: '#ffffff', align: 'center'});
    this.instructionText.anchor.setTo(0.5, 0.5);
  },
  update: function () {
    if(this.game.input.activePointer.justPressed()) {
      this.game.state.start('play');
    }
  }
};
module.exports = GameOver;

},{}],23:[function(require,module,exports){
'use strict';

function Menu() {}

Menu.prototype = {

  preload: function() {

  },

  create: function() {
    var style = { font: '65px Arial', fill: '#ffffff', align: 'center'};
    this.sprite = this.game.add.sprite(this.game.world.centerX, 138, 'yeoman');
    this.sprite.anchor.setTo(0.5, 0.5);

    this.titleText = this.game.add.text(this.game.world.centerX, 300, '\'Allo, \'Allo!', style);
    this.titleText.anchor.setTo(0.5, 0.5);

    this.instructionsText = this.game.add.text(this.game.world.centerX, 400, 'Click anywhere to play "Click The Yeoman Logo"', { font: '16px Arial', fill: '#ffffff', align: 'center'});
    this.instructionsText.anchor.setTo(0.5, 0.5);

    this.sprite.angle = -20;
    this.game.add.tween(this.sprite).to({angle: 20}, 1000, Phaser.Easing.Linear.NONE, true, 0, 1000, true);
  },

  update: function() {
    if(this.game.input.activePointer.justPressed()) {
      this.game.state.start('play');
    }
  }
};

module.exports = Menu;

},{}],24:[function(require,module,exports){
'use strict';

var ParallaxStage = require('../prefabs/ParallaxStage');
var Player = require('../prefabs/player');
var Menu = require('../prefabs/menu');
var Command = require('../commands/Command');
var EncounterManager = require('../prefabs/EncounterManager');

function Play() {}
Play.prototype = {

  create: function() {

    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    var parallaxStageConfig = [
      { imageName: 'forestBack', speed: 0.5 },
      { imageName: 'forestLights', speed: 0.75 },
      { imageName: 'forestMiddle', speed: 1 },
      { imageName: 'forestFront', speed: 1.25 }
    ];

    this.parallaxStage = new ParallaxStage(this.game, parallaxStageConfig);

    this.player = new Player(this.game, {
      x: 460,
      y: 220,
    });

    this.menu = new Menu(this.game, 0, this.game.height - 200, this.game.width, 200);
    this.game.add.existing(this.menu);

    this.game.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(this.menu.commands.chooseUp, this.menu.commands);
    this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(this.menu.commands.chooseRight, this.menu.commands);
    this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(this.menu.commands.chooseDown, this.menu.commands);
    this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(this.menu.commands.chooseLeft, this.menu.commands);

    this.game.input.keyboard.addKey(Phaser.Keyboard.A).onDown.add(this.menu.disable, this.menu);
    this.game.input.keyboard.addKey(Phaser.Keyboard.O).onDown.add(this.menu.enable, this.menu);

    this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(function() {
      var command = this.menu.commands.getActiveCommand();
      if (command) {
        command.execute();
      }
    }, this);

    this.menu.commands.add(new Command('claws'));
    this.menu.commands.add(new Command('teeth'));
    this.menu.commands.add(new Command('tuna'));
    this.menu.commands.add(new Command('bad_tuna'));
    this.menu.commands.commandExecuted.add(this.commandHandler, this);
    this.menu.disable();

    this.encounterManager = new EncounterManager(this.game, this.player, this.menu.commands);
    this.encounterManager.traveling.add(this.travelHandler, this);
    this.encounterManager.encountering.add(this.encounterHandler, this);
    this.encounterManager.beginInteraction.add(this.menu.enable, this.menu);
    this.encounterManager.endInteraction.add(this.menu.disable, this.menu);
    this.encounterManager.start();
  },

  update: function() {
    this.parallaxStage.update();
    this.player.update();
  },

  render: function() {
    // this.game.debug.spriteBounds(fightCommand);
  },

  clickListener: function() {
    this.game.state.start('gameover');
  },

  travelHandler: function() {
    this.parallaxStage.startScroll();
  },

  commandHandler: function(e) {
    this.encounterManager.executeCommand(e);
  },

  encounterHandler: function() {
    this.parallaxStage.stopScroll();
    this.menu.enable();
  }
};

module.exports = Play;

},{"../commands/Command":1,"../prefabs/EncounterManager":4,"../prefabs/ParallaxStage":7,"../prefabs/menu":13,"../prefabs/player":15}],25:[function(require,module,exports){

'use strict';
function Preload() {
  this.asset = null;
  this.ready = false;
}

Preload.prototype = {

  preload: function() {

    this.asset = this.add.sprite(this.width/2,this.height/2, 'preloader');
    this.asset.anchor.setTo(0.5, 0.5);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.load.setPreloadSprite(this.asset);

    /* load the assets here */
    this.load.image('forestBack', 'assets/placeholder/parallax-forest-back-trees.png');
    this.load.image('forestFront', 'assets/placeholder/parallax-forest-front-trees.png');
    this.load.image('forestLights', 'assets/placeholder/parallax-forest-lights.png');
    this.load.image('forestMiddle', 'assets/placeholder/parallax-forest-middle-trees.png');

    this.load.spritesheet('golem', 'assets/placeholder/Golem.png', 48, 56, 16);
    this.load.spritesheet('jug', 'assets/placeholder/jug.png', 63, 45);

    // Fonts
    this.load.bitmapFont('8bit-light', 'assets/fonts/8bit_wonder-light.png', 'assets/fonts/8bit_wonder-light.fnt');
    this.load.bitmapFont('yoster-white', 'assets/fonts/yoster-white.png', 'assets/fonts/yoster-white.fnt');
    this.load.bitmapFont('yoster-gray', 'assets/fonts/yoster-gray.png', 'assets/fonts/yoster-gray.fnt');
    this.load.bitmapFont('yoster-blue', 'assets/fonts/yoster-blue.png', 'assets/fonts/yoster-blue.fnt');

    // Actors
    this.load.spritesheet('blockman', 'assets/placeholder/blockman_oneleg3.png', 25, 24);
    this.load.spritesheet('tuna', 'assets/placeholder/tuna_sprite_all_5.png', 100, 50);
  },

  create: function() {
    this.asset.cropEnabled = false;
  },

  update: function() {
    if(!!this.ready) {
      this.game.state.start('play');
    }
  },

  onLoadComplete: function() {
    this.ready = true;
  }
};

module.exports = Preload;

},{}],26:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},[2])