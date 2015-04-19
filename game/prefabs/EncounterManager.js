'use strict';
var Encounter = require('./Encounter');
var HealthBar = require('./hud/statusBar');

var EncounterManager = function(game, player, commands) {
	this.game = game;
	this.currentTier = 0;
	this.player = player;
	this.commands = commands;
	this.canAct = false;

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
	if (this.encounter && this.canAct) {
		// this.canAct = false;
		this.encounter.resolveCommand(commandName);
	};
}

function startWalking () {
	this.traveling.dispatch();
	this.game.time.events.add(5000, introFoes, this);
	this.player.run();
}

function introFoes () {
	this.encounter = new Encounter(this.game, 0, null, this.player);

	this.game.time.events.add(500, stopWalking, this);
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
	this.canAct = true;

  this.game.add.existing(this.foeHealthBar);
  this.foeHealthBar.setLabel('ENEMY');
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
