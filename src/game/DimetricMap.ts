export class DimetricMap extends Phaser.GameObjects.GameObject {
    sprites = new Map<string, Phaser.GameObjects.Sprite>();

    constructor(
        public scene: Phaser.Scene,
        public tileSize: 8,
        public offsetX: number,
        public offsetY: number,
        public width: number,
        public height: number
    ) {
        super(scene, "DimetricMap");
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const sprite = this.scene.add.sprite(
                    x * tileSize + offsetX + 4,
                    y * tileSize + offsetY + 4,
                    "tileset",
                    0
                );
                sprite.setDepth(y * tileSize);
                this.sprites.set(`${x}_${y}`, sprite);
                sprite.visible = false;
                sprite.ignoreDestroy = true;
            }
        }
    }

    update() {}

    setSprites(
        backgroundLayer: Phaser.Tilemaps.TilemapLayer,
        blockLayer: Phaser.Tilemaps.TilemapLayer,
        height1Layer: Phaser.Tilemaps.TilemapLayer,
        height2Layer: Phaser.Tilemaps.TilemapLayer,
        height3Layer: Phaser.Tilemaps.TilemapLayer
    ) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const backgroundTile = backgroundLayer.getTileAt(x, y);
                const blockTile = blockLayer.getTileAt(x, y);
                const height1Tile = height1Layer.getTileAt(x, y);
                const height2Tile = height2Layer.getTileAt(x, y);
                const height3Tile = height3Layer.getTileAt(x, y);
                const sprite = this.sprites.get(`${x}_${y}`)!;

                const groundHeight = y * this.tileSize + this.offsetY - 8 - 4;

                if (backgroundTile) {
                    sprite.setFrame(backgroundTile.index - 1);
                    sprite.setVisible(true);
                    sprite.setDepth(1);
                    // console.log(x,y,'BackgroundTile Index:',blockTile.index);
                } else if (blockTile) {
                    sprite.setFrame(blockTile.index - 1);
                    sprite.setVisible(true);
                    sprite.setDepth(groundHeight);
                    // console.log(x,y,'BlockTile Index:',blockTile.index);
                } else if (height1Tile) {
                    sprite.setFrame(height1Tile.index - 1);
                    sprite.setVisible(true);
                    sprite.setDepth(groundHeight + this.tileSize);
                    //console.log(x,y,'OverlayTile Index:',blockTile.index);
                } else if (height2Tile) {
                    sprite.setFrame(height2Tile.index - 1);
                    sprite.setVisible(true);
                    sprite.setDepth(groundHeight + this.tileSize * 2);
                    //console.log(x,y,'OverlayTile Index:',blockTile.index);
                } else if (height3Tile) {
                    sprite.setFrame(height3Tile.index - 1);
                    sprite.setVisible(true);
                    sprite.setDepth(9001);
                    //console.log(x,y,'OverlayTile Index:',blockTile.index);
                }
            }
        }
    }

    destroy() {
        for (const sprite of this.sprites.values()) {
            if (sprite.active) {
                sprite.destroy();
            }
        }
        super.destroy();
    }
}
