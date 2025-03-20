import { DimetricMap } from "./DimetricMap";
import { Game } from "./scenes/Game";
import { SHOOTER } from "./ShootingController";

export const OCCUPIED_BY = "occupied_by";

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
    enemyCollider: Phaser.Physics.Arcade.Collider;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        templateKey: string
    ) {
        super(scene, x, y);
        scene.add.existing(this);
        this.entityType = templateKey; // Speichere den Entity-Typ

        this.dimetricMap = new DimetricMap(this.scene, 8, "tileset", x, y);

        this.collider = this.scene.physics.add.collider(
            (this.scene as Game).player,
            this.dimetricMap.blockingTiles!
        );

        this.enemyCollider = this.scene.physics.add.collider(
            (this.scene as Game).enemySpawner.enemies,
            this.dimetricMap.blockingTiles!
        );

        this.bulletCollider = this.scene.physics.add.collider(
            (this.scene as Game).shootingController.bullets,
            this.dimetricMap.blockingTiles,
            (bullet) => {
                bullet.destroy();
            },
            undefined,
            this
        );

        this.enemyBulletCollider = this.scene.physics.add.collider(
            (this.scene as Game).shootingController.enemyBullets,
            this.dimetricMap.blockingTiles,
            (bullet) => {
                bullet.destroy();
            },
            (bullet, tile) => {
                // only deactivate collision for enemy bullets of the shooter who is occupying this tile
                return !this.checkOccupationIsShooter(
                    bullet as Phaser.GameObjects.Image
                );
            },
            this
        );

        this.dimetricMap.setTilesFromEntityType(this.entityType);
    }

    getHideOutInfo():
        | { hideOutX: number; hideOutY: number; hideOut: boolean }
        | undefined {
        const props = this.dimetricMap.getData("properties");
        if (props) {
            return {
                hideOutX: props.find((x) => x.name === "hideOutX").value,
                hideOutY: props.find((x) => x.name === "hideOutY").value,
                hideOut: props.find((x) => x.name === "hideOut").value,
            };
        }
        return undefined;
    }

    entityWidth() {
        return this.dimetricMap.width;
    }

    entityHeight() {
        return this.dimetricMap.height;
    }

    // Korrigierte Methode zum Abrufen des Entity-Typs
    public getType(): string {
        return this.entityType;
    }

    public setOccupation(
        occupiedBy: Phaser.GameObjects.GameObject | undefined
    ) {
        this.setData(OCCUPIED_BY, occupiedBy);
    }

    public isOccupied(): boolean {
        return this.getData(OCCUPIED_BY) !== undefined;
    }

    private checkOccupationIsShooter(
        bullet: Phaser.GameObjects.Image
    ): boolean {
        return this.getData(OCCUPIED_BY) === bullet.getData(SHOOTER);
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
