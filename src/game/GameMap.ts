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

        // Speichern der Bodeninformationen für die spätere Randberechnung
        const floorTypes: FloorType[][] = Array(this.chunkSize)
            .fill(null)
            .map(() => Array(this.chunkSize).fill("ground1"));
        const tileNoiseValues: number[][] = Array(this.chunkSize)
            .fill(null)
            .map(() => Array(this.chunkSize).fill(0));

        // Erster Durchlauf: Platziere Grundtiles und speichere ihre Typen
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                // Berechne globale Position für konsistenten Noise
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const noiseValue = this.generateNoiseValue(worldX, worldY);
                tileNoiseValues[y][x] = noiseValue;

                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const patternNoiseValue = this.generateNoiseValue(
                    worldX,
                    worldY,
                    tileScale
                );

                const floorType = getFloorType(patternNoiseValue);
                floorTypes[y][x] = floorType;

                // Wähle einen Tile-Index basierend auf dem Noise-Wert
                const tileIndex = getTileFromNoise(noiseValue, floorType);

                // Setze den Tile
                layer!.putTileAt(tileIndex, x, y);
            }
        }

        // Zweiter Durchlauf: Platziere Randtiles zwischen Wasser und Land
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                // Überspringe, wenn das Tile kein Wasser ist
                if (floorTypes[y][x] !== "water") continue;

                // Prüfe alle Nachbarn und sammle Informationen, ob sie Wasser sind
                // [center, top, right, bottom, left, topRight, bottomRight, bottomLeft, topLeft]
                const isWater: boolean[] = [
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                ];

                // Direkter Mittelpunkt
                isWater[0] = floorTypes[y][x] === "water";

                // Direkte Nachbarn
                if (y > 0) isWater[1] = floorTypes[y - 1][x] === "water"; // Oben
                if (x < this.chunkSize - 1)
                    isWater[2] = floorTypes[y][x + 1] === "water"; // Rechts
                if (y < this.chunkSize - 1)
                    isWater[3] = floorTypes[y + 1][x] === "water"; // Unten
                if (x > 0) isWater[4] = floorTypes[y][x - 1] === "water"; // Links

                // Diagonale Nachbarn
                if (y > 0 && x < this.chunkSize - 1)
                    isWater[5] = floorTypes[y - 1][x + 1] === "water"; // Oben-Rechts
                if (y < this.chunkSize - 1 && x < this.chunkSize - 1)
                    isWater[6] = floorTypes[y + 1][x + 1] === "water"; // Unten-Rechts
                if (y < this.chunkSize - 1 && x > 0)
                    isWater[7] = floorTypes[y + 1][x - 1] === "water"; // Unten-Links
                if (y > 0 && x > 0)
                    isWater[8] = floorTypes[y - 1][x - 1] === "water"; // Oben-Links

                // Bestimme den Randtyp
                const borderDirection = determineWaterBorderType(isWater);

                // Wenn ein Randtile benötigt wird, ersetze das aktuelle Tile
                if (borderDirection !== TileBorderDirections.None) {
                    const noiseValue = tileNoiseValues[y][x];
                    const borderTileIndex = getWaterBorderTile(
                        borderDirection,
                        noiseValue
                    );
                    layer!.putTileAt(borderTileIndex, x, y);
                }
            }
        }

        // Platziere Entities
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                const noiseValue = tileNoiseValues[y][x];
                const floorType = floorTypes[y][x];

                this.placeEntity(
                    "tree",
                    worldX,
                    worldY,
                    floorType,
                    noiseValue,
                    entities
                );
                this.placeEntity(
                    "rock",
                    worldX,
                    worldY,
                    floorType,
                    noiseValue,
                    entities
                );
            }
        }

        // Setze explizit die Tiefe des Layers niedriger als die des Spielers
        layer.setDepth(0);
        this.activeEntities.set(`${chunkX},${chunkY}`, entities);
        // Speichere den Layer
        this.activeChunks.set(`${chunkX},${chunkY}`, layer);
        this.loadedChunks.add(`${chunkX},${chunkY}`);
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
            if (noiseValue > 0.95) {
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
