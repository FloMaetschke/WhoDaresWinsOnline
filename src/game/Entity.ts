import { Game } from "./scenes/Game";
import { createObject, treeTemplate } from "./Templates";

export class Entity extends Phaser.GameObjects.Container {
    baumTilemap: Phaser.Tilemaps.Tilemap;
    baumTileset: Phaser.Tilemaps.Tileset;
    backgroundLayer: Phaser.Tilemaps.TilemapLayer;
    blockLayer: Phaser.Tilemaps.TilemapLayer;
    overlayLayer: Phaser.Tilemaps.TilemapLayer;
    collider: Phaser.Physics.Arcade.Collider;
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);
        scene.add.existing(this);
        this.baumTilemap = this.scene.make.tilemap({
            tileWidth: 8,
            tileHeight: 8,
            width: 10,
            height: 10,
        });
        this.baumTileset = this.baumTilemap.addTilesetImage("tiles")!;
        this.backgroundLayer = this.baumTilemap.createBlankLayer(
            "Background",
            this.baumTileset!,
            x,
            y
        )!;
        this.blockLayer = this.baumTilemap.createBlankLayer(
            "Block",
            this.baumTileset!,
            x,
            y
        )!;
        this.overlayLayer = this.baumTilemap.createBlankLayer(
            "Overlay",
            this.baumTileset!,
            x,
            y
        )!;
        this.backgroundLayer?.setDepth(400);
        this.blockLayer?.setDepth(400);
        this.overlayLayer?.setDepth(400);

        this.add(this.backgroundLayer);
        this.add(this.blockLayer);
        this.add(this.overlayLayer);
        //todo: enable collision
        this.blockLayer?.setCollisionBetween(0, 225);
        createObject(
            this.backgroundLayer!,
            this.blockLayer!,
            this.overlayLayer!,
            0,
            0,
            treeTemplate
        );

        this.collider = this.scene.physics.add.collider(
            (this.scene as Game).player,
            this.blockLayer!
        );
    }

    update() {
        this.setDepth(this.y +3*8);
        console.log("Baum.Depth", this.depth);
    }
}
