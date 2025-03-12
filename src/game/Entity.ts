import { Game } from "./scenes/Game";

export class Entity extends Phaser.GameObjects.Container {
    blockLayer: Phaser.Tilemaps.TilemapLayer;
    overlayLayer: Phaser.Tilemaps.TilemapLayer;
    collider: Phaser.Physics.Arcade.Collider;
    map: Phaser.Tilemaps.Tilemap;
    tiles: any;
    constructor(scene: Phaser.Scene, x: number, y: number, templateKey: string) {
        super(scene, x, y);
        scene.add.existing(this);
        this.map = this.scene.make.tilemap({ key: templateKey })!;
        this.tiles = this.map.addTilesetImage('tileset', 'tiles');
        this.blockLayer = this.map.createLayer("Block", this.tiles!, x,y)!;
        this.overlayLayer = this.map.createLayer("Overlay", this.tiles!, x,y)!;
        this.add(this.blockLayer!);
        this.add(this.overlayLayer!);

        this.blockLayer?.setDepth(400);
        this.overlayLayer?.setDepth(400);
        this.blockLayer?.setCollisionBetween(0, 225);
        this.collider = this.scene.physics.add.collider(
            (this.scene as Game).player,
            this.blockLayer!
        );

        this.setDepth(this.y + this.map.height * this.map.tileHeight - 2* this.map.tileHeight );
    }

    entityWidth() { 
        return this.map.width;
    }

    entityHeight() { 
        return this.map.height;
    }

    destroy() {
        this.collider?.destroy();
        this.removeAll(true);
        super.destroy();
    }
}
