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
        for (let y = offsetY; y < tileHeight + offsetY; y++) {
            for (let x = offsetY; x < tileWidth + offsetX; x++) {
                this.sprites.set(
                    `${x}_${y}`,
                    this.scene.add.sprite(
                        x * tileSize,
                        y * tileSize,
                        "tileset",
                        0,
                    )
                );
            }
        }
    }

    update() {}

    destroy(){
        this.sprites.forEach((sprite) => {
            sprite.destroy();
        });
        this.sprites.clear();
    }
}
