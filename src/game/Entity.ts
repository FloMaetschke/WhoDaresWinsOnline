import { DimetricMap } from "./DimetricMap";
import { Game } from "./scenes/Game";

export class Entity extends Phaser.GameObjects.Container {
    backgroundLayer: Phaser.Tilemaps.TilemapLayer;
    blockLayer: Phaser.Tilemaps.TilemapLayer;
    height1Layer: Phaser.Tilemaps.TilemapLayer;
    collider: Phaser.Physics.Arcade.Collider;
    map: Phaser.Tilemaps.Tilemap;
    tiles: Phaser.Tilemaps.Tileset;
    entityType: string; // Hinzugefügt: Speichert den Entity-Typ
    bulletCollider: Phaser.Physics.Arcade.Collider;
    enemyBulletCollider: Phaser.Physics.Arcade.Collider;
    dimetricMap: DimetricMap;
    height2Layer: Phaser.Tilemaps.TilemapLayer;
    height3Layer: Phaser.Tilemaps.TilemapLayer;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        templateKey: string
    ) {
        super(scene, x, y);
        scene.add.existing(this);
        this.entityType = templateKey; // Speichere den Entity-Typ
        this.map = this.scene.make.tilemap({ key: templateKey })!;
        this.tiles = this.map.addTilesetImage("tileset", "tiles")!;
        this.backgroundLayer = this.map.createLayer(
            "Background",
            this.tiles!,
            x,
            y
        )!;
        this.blockLayer = this.map.createLayer("Block", this.tiles!, x, y)!;
        this.height1Layer = this.map.createLayer("Height1", this.tiles!, x, y)!;
        this.height2Layer = this.map.createLayer("Height2", this.tiles!, x, y)!;
        this.height3Layer = this.map.createLayer("Height3", this.tiles!, x, y)!;
        this.add(this.backgroundLayer!);
        this.add(this.blockLayer!);
        this.add(this.height1Layer!);
        this.add(this.height2Layer!);
        this.add(this.height3Layer!);

        this.backgroundLayer?.setDepth(1);
        this.blockLayer?.setDepth(400);
        this.height1Layer?.setDepth(400);
        this.height2Layer?.setDepth(400);
        this.height3Layer?.setDepth(400);
        this.blockLayer?.setCollisionBetween(0, 225);

        this.collider = this.scene.physics.add.collider(
            (this.scene as Game).player,
            this.blockLayer!
        );

        this.setDepth(
            this.y +
                this.map.height * this.map.tileHeight -
                2 * this.map.tileHeight
        );

        this.backgroundLayer.visible = false;
        this.blockLayer.visible = false;
        this.height1Layer.visible = false;
        this.height2Layer.visible = false;
        this.height3Layer.visible = false;

        this.blockLayer?.setDepth(1);
        this.backgroundLayer?.setDepth(1);
        this.bulletCollider = this.scene.physics.add.collider(
            (this.scene as Game).shootingController.bullets,
            this.blockLayer,
            (bullet) => {
                bullet.destroy();
            },
            undefined,
            this
        );

        this.enemyBulletCollider = this.scene.physics.add.collider(
            (this.scene as Game).shootingController.enemyBullets,
            this.blockLayer,
            (bullet) => {
                bullet.destroy();
            },
            undefined,
            this
        );

        this.dimetricMap = new DimetricMap(
            this.scene,
            8,
            x,
            y,
            this.map.width,
            this.map.height
        );
        this.dimetricMap.setSprites(
            this.backgroundLayer,
            this.blockLayer,
            this.height1Layer,
            this.height2Layer,
            this.height3Layer
        );
    }

    entityWidth() {
        return this.map.width;
    }

    entityHeight() {
        return this.map.height;
    }

    // Korrigierte Methode zum Abrufen des Entity-Typs
    public getType(): string {
        return this.entityType;
    }

    // Verbesserte Methode zum Abrufen eines repräsentativen sichtbaren Tile-Index
    public getFrame(): number {
        // Beginne mit dem Overlay-Layer, da dieser in der Regel die sichtbaren Elemente enthält
        if (this.height1Layer) {
            const overlayTiles = this.height1Layer.getTilesWithin();
            if (overlayTiles && overlayTiles.length > 0) {
                // Suche nach dem ersten sichtbaren, nicht-leeren Tile im Overlay
                for (const tile of overlayTiles) {
                    if (tile.index !== -1 && tile.visible) {
                        return tile.index;
                    }
                }
            }
        }

        // Wenn im Overlay nichts gefunden wurde, prüfe den Block-Layer
        if (this.blockLayer) {
            const blockTiles = this.blockLayer.getTilesWithin();
            if (blockTiles && blockTiles.length > 0) {
                // Suche nach dem ersten sichtbaren, nicht-leeren Tile im Block-Layer
                for (const tile of blockTiles) {
                    if (tile.index !== -1 && tile.visible) {
                        return tile.index;
                    }
                }

                // Wenn kein sichtbares Tile gefunden wurde, nimm das erste nicht-leere
                for (const tile of blockTiles) {
                    if (tile.index !== -1) {
                        return tile.index;
                    }
                }
            }
        }

        // Fallback wenn kein Tile gefunden wurde
        return -1;
    }

    // Neue Methode, die das spezifische Tile an einer bestimmten relativen Position innerhalb des Entities zurückgibt
    public getTileAt(relativeX: number, relativeY: number): number {
        // Konvertiere zu Layer-Koordinaten (in Tiles)
        const tileX = Math.floor(relativeX / 8);
        const tileY = Math.floor(relativeY / 8);

        // Prüfe zuerst das Overlay-Layer, da es im Vordergrund liegt
        if (this.height1Layer) {
            const overlayTile = this.height1Layer.getTileAt(tileX, tileY);
            if (overlayTile && overlayTile.index !== -1) {
                // Korrigiere die Tile-ID, indem 1 subtrahiert wird
                return overlayTile.index - 1;
            }
        }

        // Wenn im Overlay nichts gefunden wurde, prüfe den Block-Layer
        if (this.blockLayer) {
            const blockTile = this.blockLayer.getTileAt(tileX, tileY);
            if (blockTile && blockTile.index !== -1) {
                // Korrigiere die Tile-ID, indem 1 subtrahiert wird
                return blockTile.index - 1;
            }
        }

        if (this.backgroundLayer) {
            const backgroundTile = this.backgroundLayer.getTileAt(tileX, tileY);
            if (backgroundTile && backgroundTile.index !== -1) {
                // Korrigiere die Tile-ID, indem 1 subtrahiert wird
                return backgroundTile.index - 1;
            }
        }

        // Wenn kein Tile gefunden wurde, gibt -1 zurück (wird als "-" angezeigt)
        return -1;
    }

    destroy() {
        this.collider?.destroy();
        this.bulletCollider?.destroy();
        this.enemyBulletCollider.destroy();
        this.dimetricMap.destroy();
        this.removeAll(true);
        super.destroy();
    }
}
