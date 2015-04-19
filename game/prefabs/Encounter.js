'use strict';
var foes = require('../resources/foes');
var Foe = require('./Foe');
var Attack = require('./actions/Attack');

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

Encounter.prototype.start = function() {

};

Encounter.prototype.resolveCommand = function(command) {
  console.log(command.name.specific);

  this.playerCooldown = command.modifiers.cooldown;
	switch (command.name.specific) {
		case 'CLAWS':
			this.currentAction = new Attack(this.game, this.player, this.foes[0], command, this);
		break;
	}

	this.currentAction.completed.add(actionDone, this);
	this.currentAction.do();
}

function buff () {

}

function actionDone () {
	if (this.playerCooldown > this.foeCooldown) {
		this.playerCooldown -= this.foeCooldown;
		foeAction.call(this);
	} else {
		this.foeCooldown -= this.playerCooldown;
		this.beginPlayerTurn.dispatch();
	};
}

function foeAction () {
	// maybe something other than attacking?
	this.foeCooldown = this.foes[0].attack.modifiers.cooldown;
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
