'use strict';
var foes = require('../resources/foes');
var Foe = require('./Foe');

var Encounter = function(game, tier, modifiers, player) {
	this.game = game;
	this.globalModifiers = modifiers

	// for ludum dare 32 we will only have the one foe
	// but later it may be different
	this.foes = getFoes(game);
};

Encounter.prototype.constructor = Encounter;

Encounter.prototype.start = function() {

};

Encounter.prototype.resolveCommand = function(command) {
  console.log(this.text);

	switch (command.data.name.specific) {
		case 'Claws':
			// kill it
		break;
	}
}

function getFoes(game) {
	var retval = [];
	var foeIndex = Math.floor(Math.random() * foes.length);

	// there will be more than one maybe
	retval.push(new Foe(game, foes[foeIndex]));

	return retval;
}

module.exports = Encounter;
