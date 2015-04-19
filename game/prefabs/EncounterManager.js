'use strict';
var Encounter = require('./Encounter');

var EncounterManager = function(game, player, commands) {
	this.game = game;
	this.currentTier = 0;
	this.player = player;
	this.commands = commands;

	this.traveling = new Phaser.Signal();
	this.encountering = new Phaser.Signal();
};

EncounterManager.prototype.constructor = EncounterManager;

EncounterManager.prototype.start = function() {
	startWalking.call(this);
};

EncounterManager.prototype.executeCommand = function (e) {
	// delegate to something
	switch (e) {
		case 'claws':
		break;
	}
}

function startWalking () {
	this.traveling.dispatch();
	this.game.time.events.add(5000, introFoes, this);
	this.player.run();
}

function introFoes () {
	this.encounter = new Encounter(this.game);

	this.game.time.events.add(5000, stopWalking, this);
}

function stopWalking () {
	this.encountering.dispatch();
	this.encounter.foes.forEach(function (foe) {
		foe.intro = false;
	});
	// this.player.trot();
	this.player.stop();

	startCombat.call(this);
}

function startCombat () {
	// combat simulation!

	// this.game.time.events.add(5000, startWalking, this);
	// startWalking.call(this);
}

module.exports = EncounterManager;
