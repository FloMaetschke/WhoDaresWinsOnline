export class DimetricMap extends Phaser.GameObjects.GameObject {
    sprites = new Map<string, Phaser.GameObjects.Sprite>();

    constructor(
        private scene: Phaser.Scene,
        tileSize: 8,
        offsetX: number,
        offsetY: number,
        tileWidth: number,
        tileHeight: number
    ) {
        super(scene, "DimetricMap");

        console.log(
            "DimetricMap created",
            tileWidth,
            tileHeight,
            offsetX,
            offsetY,
            tileSize
        );

        for (let y = 0; y < tileHeight; y++) {
            for (let x = 0; x < tileWidth ; x++) {
                const sprite = this.scene.add.sprite(
                    x * tileSize + offsetX,
                    y * tileSize + offsetY,
                    "tileset",
                    0
                );
                sprite.setDepth(y * tileSize);
                this.sprites.set(`${x}_${y}`, sprite);
            }
        }
    }

    update() {}

    destroy() {
        this.sprites.forEach((sprite) => {
            sprite.destroy();
        });
        this.sprites.clear();
    }
}
