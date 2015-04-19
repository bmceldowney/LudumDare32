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
    this.player.run();

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
    this.menu.commands.add(new Command('claws'));
    this.menu.commands.add(new Command('teeth'));
    this.menu.commands.add(new Command('tuna'));
    this.menu.commands.add(new Command('bad_tuna'));
    this.menu.commands.add(new Command('claws'));
    this.menu.commands.add(new Command('teeth'));
    this.menu.commands.add(new Command('tuna'));
    this.menu.commands.add(new Command('bad_tuna'));
    this.menu.commands.add(new Command('claws'));
    this.menu.commands.add(new Command('teeth'));
    this.menu.commands.add(new Command('tuna'));
    this.menu.commands.add(new Command('bad_tuna'));
    this.menu.commands.add(new Command('claws'));
    this.menu.commands.add(new Command('teeth'));
    this.menu.commands.add(new Command('tuna'));
    this.menu.commands.add(new Command('bad_tuna'));
    this.menu.commands.add(new Command('claws'));
    this.menu.commands.add(new Command('teeth'));
    this.menu.commands.add(new Command('tuna'));
    this.menu.commands.add(new Command('bad_tuna'));
    this.menu.commands.commandExecuted.add(this.commandHandler, this);

    this.encounterManager = new EncounterManager(this.game, this.player, this.menu.commands);
    this.encounterManager.traveling.add(this.travelHandler, this);
    this.encounterManager.encountering.add(this.encounterHandler, this);
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
  }
};

module.exports = Play;
