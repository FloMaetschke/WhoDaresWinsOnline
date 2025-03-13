import { createNoise2D } from "simplex-noise";
import { Entity } from "./Entity";
import { Player } from "./Player";
import { isAreaOccupied } from "./MapHelper";
import {
    FloorType,
    getFloorType,
    getTileFromNoise,
    TileBorderDirections,
    determineWaterBorderType,
    getWaterBorderTile,
} from "./TilePlacement";
import { Game } from "./scenes/Game";
import { Enemy } from "./Enemy";
const tileScale = 0.02;

export class GameMap {
    noise: (x: number, y: number) => number;
    chunkSize = 16; // Größe eines Chunks in Tiles
    map: Phaser.Tilemaps.Tilemap;
    worldWidth = 10000;
    worldHeight = 10000;
    mapData: number[][] = [];
    activeChunks: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
    activeEntities: Map<string, Entity[]> = new Map();
    loadedChunks: Set<string> = new Set();
    allEntities = new Set<Entity>();

    constructor(private scene: Phaser.Scene) {
        // Erstelle zuerst einen Container für die Karte
        const mapContainer = this.scene.add.container(0, 0);
        mapContainer.setDepth(0); // Karte im Hintergrund

        // Spielwelt und Physik-Grenzen setzen (sehr groß für "endlos"-Effekt)

        this.scene.physics.world.setBounds(
            0,
            0,
            this.worldWidth,
            this.worldHeight
        );

        // Simplex-Noise initialisieren - Angepasst für neue API
        this.noise = createNoise2D();

        // Definiere Tiles-Array für die Map
        const tiles = [4, 5, 6, 7, 8, 9, 13, 14, 64];

        // Leere Basistilemap erstellen
        this.map = this.scene.make.tilemap({
            tileWidth: 8,
            tileHeight: 8,
            width: this.chunkSize,
            height: this.chunkSize,
        });

        const tileset = this.map.addTilesetImage("tiles");
    }

    getPlayerStartPosition(): { x: number; y: number } {
        return { startX: this.worldWidth / 2, startY: this.worldHeight / 2 };
    }

    // Generiert und verwaltet die Chunks um den Spieler herum
    public updateChunks(player: Player) {
        // Bestimme, in welchem Chunk der Spieler ist
        const playerChunkX = Math.floor(player.x / (this.chunkSize * 8));
        const playerChunkY = Math.floor(player.y / (this.chunkSize * 8));

        // Entferne Chunks, die zu weit entfernt sind
        for (const [key, layer] of this.activeChunks.entries()) {
            const [chunkX, chunkY] = key.split(",").map(Number);
            const distance = Phaser.Math.Distance.Between(
                playerChunkX,
                playerChunkY,
                chunkX,
                chunkY
            );

            if (distance > 3) {
                this.destroyChunk(key, layer);
            }
        }

        // Generiere neue Chunks in der Nähe des Spielers
        const renderDistance = 2; // Chunks in jeder Richtung

        for (
            let y = playerChunkY - renderDistance;
            y <= playerChunkY + renderDistance;
            y++
        ) {
            for (
                let x = playerChunkX - renderDistance;
                x <= playerChunkX + renderDistance;
                x++
            ) {
                const key = `${x},${y}`;

                // Wenn dieser Chunk noch nicht existiert, erstelle ihn
                if (!this.activeChunks.has(key)) {
                    this.createChunk(x, y);
                }
            }
        }
    }



    // Erstellt einen einzelnen Tilemap-Chunk an der angegebenen Position
    private createChunk(chunkX: number, chunkY: number) {
        // Erstelle Layer für den Chunk
        const layer = this.map.createBlankLayer(
            `chunk_${chunkX}_${chunkY}`,
            "tiles",
            chunkX * this.chunkSize * 8,
            chunkY * this.chunkSize * 8,
            this.chunkSize,
            this.chunkSize
        )!;

        layer.setCollisionBetween(91, 95);
        layer.setCollisionBetween(110, 111);
        
        // Kollision für Spieler beibehalten
        const waterPlayerCollider = this.scene.physics.add.collider(
            (this.scene as Game).player,
            layer,
            () => (this.scene as Game).player.die(true)
        );
        const colliders = layer.getData("colliders") || [];
        colliders.push(waterPlayerCollider);
        layer.setData("colliders", colliders);
        
        // Die Wasserkollision für spätere Verwendung durch Feinde speichern
        layer.setData("water_layer", layer);

        const entities: Entity[] = [];

        // Generiere und platziere Tiles in einem einzigen Durchlauf
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                // Berechne globale Position für konsistenten Noise
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const noiseValue = this.generateNoiseValue(worldX, worldY);
                
                // Generiere Perlin Noise-Wert zwischen 0 und 1 für Bodentyp
                const patternNoiseValue = this.generateNoiseValue(
                    worldX,
                    worldY,
                    tileScale
                );

                const floorType = getFloorType(patternNoiseValue);
                
                // Wenn es Wasser ist, prüfe die Übergänge
                if (floorType === "water") {
                    // Prüfe Nachbarn für Wasserübergänge
                    const isWater = this.checkNeighborWaterTiles(worldX, worldY, chunkX, chunkY);
                    
                    // Bestimme den Randtyp
                    const borderDirection = determineWaterBorderType(isWater);

                    // Wenn ein Randtile benötigt wird, setze das entsprechende Tile
                    if (borderDirection !== TileBorderDirections.None) {
                        const borderTileIndex = getWaterBorderTile(borderDirection, noiseValue);
                        layer.putTileAt(borderTileIndex, x, y);
                    } else {
                        // Normales Wassertile
                        const tileIndex = getTileFromNoise(noiseValue, floorType);
                        layer.putTileAt(tileIndex, x, y);
                    }
                } else {
                    // Normaler Boden (nicht Wasser)
                    const tileIndex = getTileFromNoise(noiseValue, floorType);
                    layer.putTileAt(tileIndex, x, y);
                }

                // Entities platzieren, wenn es sich nicht um Wasser handelt
                if (floorType !== "water" && noiseValue > 0.95) {
                    this.placeEntity(
                        "tree",
                        worldX,
                        worldY,
                        floorType,
                        noiseValue,
                        entities
                    );
                }
            }
        }

        // Setze explizit die Tiefe des Layers niedriger als die des Spielers
        layer.setDepth(0);
        this.activeEntities.set(`${chunkX},${chunkY}`, entities);
        // Speichere den Layer
        this.activeChunks.set(`${chunkX},${chunkY}`, layer);
        this.loadedChunks.add(`${chunkX},${chunkY}`);
    }

    // Neue Methode zum Prüfen von Nachbartiles für Wasserübergänge
    private checkNeighborWaterTiles(worldX: number, worldY: number, chunkX: number, chunkY: number): boolean[] {
        // [center, top, right, bottom, left, topRight, bottomRight, bottomLeft, topLeft]
        const isWater: boolean[] = [true, true, true, true, true, true, true, true, true];
        
        // Prüfe für jeden Nachbarn, ob es Wasser ist (mittels getFloorType und generateNoiseValue)
        // Zentrum (aktuelles Tile)
        const centerNoise = this.generateNoiseValue(worldX, worldY, tileScale);
        isWater[0] = getFloorType(centerNoise) === "water";
        
        // Oben
        const topNoise = this.generateNoiseValue(worldX, worldY - 1, tileScale);
        isWater[1] = getFloorType(topNoise) === "water";
        
        // Rechts
        const rightNoise = this.generateNoiseValue(worldX + 1, worldY, tileScale);
        isWater[2] = getFloorType(rightNoise) === "water";
        
        // Unten
        const bottomNoise = this.generateNoiseValue(worldX, worldY + 1, tileScale);
        isWater[3] = getFloorType(bottomNoise) === "water";
        
        // Links
        const leftNoise = this.generateNoiseValue(worldX - 1, worldY, tileScale);
        isWater[4] = getFloorType(leftNoise) === "water";
        
        // Oben-Rechts
        const topRightNoise = this.generateNoiseValue(worldX + 1, worldY - 1, tileScale);
        isWater[5] = getFloorType(topRightNoise) === "water";
        
        // Unten-Rechts
        const bottomRightNoise = this.generateNoiseValue(worldX + 1, worldY + 1, tileScale);
        isWater[6] = getFloorType(bottomRightNoise) === "water";
        
        // Unten-Links
        const bottomLeftNoise = this.generateNoiseValue(worldX - 1, worldY + 1, tileScale);
        isWater[7] = getFloorType(bottomLeftNoise) === "water";
        
        // Oben-Links
        const topLeftNoise = this.generateNoiseValue(worldX - 1, worldY - 1, tileScale);
        isWater[8] = getFloorType(topLeftNoise) === "water";
        
        return isWater;
    }

    // Neue Methode: Lasse Feinde mit Wasserbereichen kollidieren
    public addEnemyWaterCollision(enemy: Enemy) {
        this.activeChunks.forEach((layer) => {
            const waterLayer = layer.getData("water_layer");
            if (waterLayer) {
                const collider = this.scene.physics.add.collider(enemy, waterLayer, () => enemy.onWaterCollision());
                const colliders: Phaser.Physics.Arcade.Collider[] = waterLayer.getData("colliders") || [];
                colliders.push(collider);
                layer.setData("colliders", colliders);
            }
        });
    }

    // Erzeugt einen Perlin-Noise-Wert für die gegebenen Koordinaten
    private generateNoiseValue(x: number, y: number, scale = 1): number {
        // Angepasst an die neue API
        return (this.noise(x * scale, y * scale) + 1) / 2;
        //return (this.noise(x, y) + 1) / 2;
    }

    private placeEntity(
        entityType: string,
        worldX: number,
        worldY: number,
        floorType: FloorType,
        noiseValue: number,
        entities: Entity[]
    ) {
        if (floorType !== "water") {
            // Platziere Tree-Entities
            const entityX = worldX * 8;
            const entityY = worldY * 8;
            const entityType = "tree";

            // Übergebe die generateNoiseValue-Funktion als Parameter, um die Wasserprüfung zu ermöglichen
            if (
                !isAreaOccupied(
                    entityX,
                    entityY,
                    entityType,
                    this.allEntities,
                    (x, y) => this.generateNoiseValue(x, y, tileScale)
                )
            ) {
                const entity = new Entity(
                    this.scene,
                    entityX,
                    entityY,
                    entityType
                );
                entities.push(entity);
                this.allEntities.add(entity);
            }
        }
    }

    private destroyChunk(key: string, layer: Phaser.Tilemaps.TilemapLayer) {
        this.loadedChunks.delete(key);
        const colliders =layer.getData("colliders");
        colliders?.forEach((collider: Phaser.Physics.Arcade.Collider) => {
            collider.destroy();
        });
        layer.destroy();
        this.activeChunks.delete(key);
        const entities = this.activeEntities.get(key);
        entities?.forEach((entity) => {
            this.allEntities.delete(entity);
            entity.destroy();
        });

        this.activeEntities.delete(key);
    }

    destroy() {
        // Chunks aufräumen
        for (const layer of this.activeChunks.values()) {
            layer.destroy();
        }
        this.activeChunks.clear();
        this.loadedChunks.clear();
        this.map.destroy();
    }
}
