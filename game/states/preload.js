
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
    this.load.spritesheet('food', 'assets/items/Food-Icons-Floating.png', 32, 32);

    // Fonts
    this.load.bitmapFont('8bit-light', 'assets/fonts/8bit_wonder-light.png', 'assets/fonts/8bit_wonder-light.fnt');
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
