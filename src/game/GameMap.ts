import { createNoise2D } from "simplex-noise";
import { Entity } from "./Entity";
import { Player } from "./Player";
import { isAreaOccupied } from "./MapHelper";
import { getFloorType, getTileFromNoise } from "./TilePlacement";

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
                // Chunks, die zu weit weg sind, entfernen
                this.loadedChunks.delete(key);
                layer.destroy();
                this.activeChunks.delete(key);
                const entities = this.activeEntities.get(key);
                entities?.forEach((entity) => {
                    this.allEntities.delete(entity);
                    entity.destroy();
                });

                this.activeEntities.delete(key);
                // Behalte die Chunk-ID, damit wir wissen, dass wir diesen Chunk schon generiert haben
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
        const tileScale = 0.02; //

        // Erstelle Layer für den Chunk
        const layer = this.map.createBlankLayer(
            `chunk_${chunkX}_${chunkY}`,
            "tiles",
            chunkX * this.chunkSize * 8,
            chunkY * this.chunkSize * 8,
            this.chunkSize,
            this.chunkSize
        )!;

        const entities: Entity[] = [];
        // Fülle den Layer mit Tiles basierend auf Perlin Noise
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                // Berechne globale Position für konsistenten Noise
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const noiseValue = this.generateNoiseValue(worldX, worldY);

                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const patternNoiseValue = this.generateNoiseValue(
                    worldX,
                    worldY,
                    tileScale
                );

                // DEBUG NOISE
                //const bgRect = this.scene.add.rectangle(worldX*8,worldY*8,8,8,0xFFFFFF);
                // bgRect.setDepth(100000-1);
                // const rect = this.scene.add.rectangle(worldX*8,worldY*8,8,8,0x000000,noiseValue < 0.2 ? 0:0.5);
                // rect.setDepth(100000);
                const floorType = getFloorType(patternNoiseValue);
                // // Wähle einen Tile-Index basierend auf dem Noise-Wert
                const tileIndex = getTileFromNoise(noiseValue, floorType);

                //console.log("noiseValue: ", noiseValue);

                if (floorType !== "water") {
                    // Platziere Tree-Entities
                    if (noiseValue > 0.95) {
                        const entityX = worldX * 8;
                        const entityY = worldY * 8;
                        const entityType = "tree";

                        // Prüfe, ob der Bereich bereits von einem Entity belegt ist
                        if (
                            !isAreaOccupied(
                                entityX,
                                entityY,
                                entityType,
                                this.allEntities
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
                if (floorType === "ground2") {
                    // Platziere Rock-Entities
                    if (noiseValue > 0.3 && noiseValue < 0.302) {
                        const entityX = worldX * 8;
                        const entityY = worldY * 8;
                        const entityType = "rock";

                        // Prüfe, ob der Bereich bereits von einem Entity belegt ist
                        if (
                            !isAreaOccupied(
                                entityX,
                                entityY,
                                entityType,
                                this.allEntities
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

                // Setze den Tile
                layer!.putTileAt(tileIndex, x, y);
            }
        }

        // Setze explizit die Tiefe des Layers niedriger als die des Spielers
        layer.setDepth(0);
        this.activeEntities.set(`${chunkX},${chunkY}`, entities);
        // Speichere den Layer
        this.activeChunks.set(`${chunkX},${chunkY}`, layer);
        this.loadedChunks.add(`${chunkX},${chunkY}`);
    }

    // Erzeugt einen Perlin-Noise-Wert für die gegebenen Koordinaten
    private generateNoiseValue(x: number, y: number, scale = 1): number {
        // Angepasst an die neue API
        return (this.noise(x * scale, y * scale) + 1) / 2;
        //return (this.noise(x, y) + 1) / 2;
    }

    private getFloorType(noiseValue: number): "water" | "ground1" | "ground2" {
        if (noiseValue < 0.2) {
            return "water";
        } else if (noiseValue >= 0.2 && noiseValue < 0.6) {
            return "ground1";
        } else {
            return "ground2";
        }
    }

    // Wählt einen Tile basierend auf dem Noise-Wert aus
    private getTileFromNoise(
        noiseValue: number,
        patternNoiseValue: number
    ): number {
        const boden = [4, 5, 6, 7, 8, 9]; // Deine vordefinierten Tile-Indizes
        const boden2 = [8, 9, 13, 14, 64]; // Deine vordefinierten Tile-Indizes
        const wasser = [93, 94, 95, 96]; // Deine vordefinierten Tile-Indizes

        if (patternNoiseValue < 0.2) {
            const index = Math.floor(noiseValue * wasser.length);
            return wasser[index];
        }

        if (patternNoiseValue >= 0.2 && patternNoiseValue < 0.6) {
            const index = Math.floor(noiseValue * boden2.length);
            return boden2[index];
        }

        // Skaliere den Wert auf den Bereich des Arrays
        const index = Math.floor(noiseValue * boden.length);
        return boden[index];
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
