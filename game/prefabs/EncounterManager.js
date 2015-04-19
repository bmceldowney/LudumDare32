'use strict';
var Encounter = require('./Encounter');

var EncounterManager = function(game, player, commands) {
	this.game = game;
	this.currentTier = 0;
	this.player = player;
	this.commands = commands;
	this.canAct = false;

	this.traveling = new Phaser.Signal();
	this.encountering = new Phaser.Signal();
};

EncounterManager.prototype.constructor = EncounterManager;

EncounterManager.prototype.start = function() {
	startWalking.call(this);
};

EncounterManager.prototype.executeCommand = function (commandName) {
	// we need an encounter to act
	if (this.encounter && this.canAct) {
		// this.canAct = false;
		this.encounter.resolveCommand(commandName);
	};
}

function startWalking () {
	this.traveling.dispatch();
	this.game.time.events.add(5000, introFoes, this);
}

function introFoes () {
	this.encounter = new Encounter(this.game, 0, null, this.player);

	this.game.time.events.add(5000, stopWalking, this);
}

function stopWalking () {
	this.encountering.dispatch();
	this.encounter.foes.forEach(function (foe) {
		foe.intro = false;
	});

	startCombat.call(this);
}

function startCombat () {
	// combat simulation!
	this.canAct = true;

	// this.game.time.events.add(5000, startWalking, this);
	// startWalking.call(this);
}

module.exports = EncounterManager;
