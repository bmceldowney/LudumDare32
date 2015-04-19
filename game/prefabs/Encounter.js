'use strict';
var foes = require('../resources/foes');
var Foe = require('./Foe');

var Encounter = function(game, tier, modifiers, player) {
	this.game = game;
	this.globalModifiers = modifiers;

	// for ludum dare 32 we will only have the one foe
	// but later it may be different
	this.foes = getFoes(game);
	this.player = player;
	this.damageText = new Phaser.BitmapText(game, 10, 10, 'yoster-white', '0', 8);
	this.game.physics.enable(this.damageText, Phaser.Physics.ARCADE);
	this.damageText.body.gravity.set(50, 50);
	this.damageText.body.velocity.setTo(0, 180);
};

Encounter.prototype.constructor = Encounter;

Encounter.prototype.start = function() {

};

Encounter.prototype.resolveCommand = function(command) {
  console.log(command.name.specific);

	switch (command.name.specific) {
		case 'CLAWS':
			attack(this.player, this.foes[0], command, this);
		break;
	}
}

function attack (attacker, defender, command, context) {
	var anim;
	if (attacker && attacker.animations) {
		anim = attacker.animations.play('attack');
		anim.onComplete.add(attackComplete, context);
	} else {
		attackComplete.call(context);
	};


	function attackComplete() {
		var anim = defender.animations.play('hit');
		this.damageText.setText('yowch');//command.modifiers.power
		defender.addChild(this.damageText);
    defender.damage(20);

		if (anim) {
			anim.onComplete.add(hitComplete, this);
		};

	}

	function hitComplete() {

	}
}

function buff () {

}

function getFoes(game) {
	var retval = [];
	var foeIndex = Math.floor(Math.random() * foes.length);

	// there will be more than one maybe
	retval.push(new Foe(game, foes[foeIndex]));

	return retval;
}

module.exports = Encounter;
