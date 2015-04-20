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
