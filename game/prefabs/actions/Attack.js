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
