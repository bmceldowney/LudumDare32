
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

    // Actors
    this.load.spritesheet('blockman', 'assets/placeholder/blockman_oneleg2.png', 25, 24);
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
