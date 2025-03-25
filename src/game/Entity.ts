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

    getHideOutInfos():
        | {
              hideOutX: number;
              hideOutY: number;
              hideOut: boolean;
              id: number;
          }[] {
        const result = [];
        for (let i = 0; i < this.dimetricMap.objects.length; i++) {
            const object = this.dimetricMap.objects[i];
            if (object.type.toLowerCase() === "hideout") {
                result.push({
                    hideOutX: object.x,
                    hideOutY: object.y,
                    hideOut: true,
                    id: i,
                });
            }
        }
        return result;
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
        occupiedBy: Phaser.GameObjects.GameObject | undefined,
        id: number
    ) {
        //this.setData(OCCUPIED_BY, occupiedBy);
        this.setData(OCCUPIED_BY + "_" + id, occupiedBy);
    }

    public isOccupied(id: number): boolean {
        return this.getData(OCCUPIED_BY + "_" + id) !== undefined;
    }

    private checkOccupationIsShooter(
        bullet: Phaser.GameObjects.Image
    ): boolean {
        const infos = this.getHideOutInfos();
        for (const info of infos) {
            if (
                this.getData(OCCUPIED_BY + "_" + info.id) ===
                bullet.getData(SHOOTER)
            ) {
                return true;
            }
        }
        return false;
    }

    applySpawnLocations(
        spawnLocations:
            | Map<string, { x: number; y: number; count: number }>
            | undefined
    ) {
        if (spawnLocations) {
            this.dimetricMap.objects
                .filter((o) => o.type.toLowerCase() === "spawner")
                .forEach((o) => {
                    if (spawnLocations.has(`${this.x + o.x}_${this.y + o.y}`))
                        return;
                    const newSpawnPoint = {
                        x: this.x + o.x,
                        y: this.y + o.y,
                        count: Phaser.Math.Between(
                            o.properties?.find((p) => p.name.toLowerCase() === "minamount")
                                ?.value as number,
                            o.properties?.find((p) => p.name.toLowerCase() === "maxamount")
                                ?.value as number
                        ),
                    };
                    spawnLocations.set(
                        `${this.x + o.x}_${this.y + o.y}`,
                        newSpawnPoint
                    );
                    console.log(
                        "Spawner added at: ",
                        this.x + o.x,
                        this.y + o.y,
                        newSpawnPoint
                    );
                });
        }
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
