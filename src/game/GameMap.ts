import { createNoise2D } from "simplex-noise";
import { Player } from "./Player";

export class GameMap {
    noise: (x: number, y: number) => number;
    chunkSize = 64; // Größe eines Chunks in Tiles
    map: Phaser.Tilemaps.Tilemap;
    worldWidth = 1000000;
    worldHeight = 1000000;
    mapData: number[][] = [];
    activeChunks: Map<string, Phaser.Tilemaps.TilemapLayer[]> = new Map();
    loadedChunks: Set<string> = new Set();

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
        this.noise = createNoise2D(() => 0.55337); //Math.random);

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
        for (const [key, layers] of this.activeChunks.entries()) {
            const [chunkX, chunkY] = key.split(",").map(Number);
            const distance = Phaser.Math.Distance.Between(
                playerChunkX,
                playerChunkY,
                chunkX,
                chunkY
            );

            if (distance > 3) {
                // Chunks, die zu weit weg sind, entfernen
                for (const layer of layers) {
                    layer.destroy();
                }
                this.activeChunks.delete(key);
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
        const tiles = [4, 5, 6, 7, 8, 9, 13, 14, 64]; // Deine vordefinierten Tile-Indizes
        const tileScale = 0.02; // Skalierungsfaktor für Perlin Noise (höher = größere Muster)

        // Erstelle Layer für den Chunk
        const layer = this.map.createBlankLayer(
            `chunk_${chunkX}_${chunkY}`,
            "tiles",
            chunkX * this.chunkSize * 8,
            chunkY * this.chunkSize * 8,
            this.chunkSize,
            this.chunkSize
        );

        // Erstelle Layer für den Chunk
        const layer2 = this.map.createBlankLayer(
            `chunk_${chunkX}_${chunkY}_2`,
            "tiles",
            chunkX * this.chunkSize * 8,
            chunkY * this.chunkSize * 8,
            this.chunkSize,
            this.chunkSize
        );

        // Erstelle Layer für den Chunk
        const layer3 = this.map.createBlankLayer(
            `chunk_${chunkX}_${chunkY}_3}`,
            "tiles",
            chunkX * this.chunkSize * 8,
            chunkY * this.chunkSize * 8,
            this.chunkSize,
            this.chunkSize
        );

        // Fülle den Layer mit Tiles basierend auf Perlin Noise
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                // Berechne globale Position für konsistenten Noise
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;

                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const noiseValue = this.generateNoiseValue(
                    worldX,
                    worldY,
                    tileScale
                );

                // Wähle einen Tile-Index basierend auf dem Noise-Wert
                const tileIndex = this.getTileFromNoise(noiseValue, tiles);

                // Setze den Tile
                layer!.putTileAt(tileIndex, x, y);
            }
        }

        // Setze explizit die Tiefe des Layers niedriger als die des Spielers
        layer!.setDepth(0);
        layer2!.setDepth(9);
        layer3!.setDepth(100);

        layer2!.putTileAt(18, 1, 0);
        layer3!.putTileAt(15, 0, 0);
        // Speichere den Layer
        this.activeChunks.set(`${chunkX},${chunkY}`, [layer!, layer2!, layer3!]);
        this.loadedChunks.add(`${chunkX},${chunkY}`);
    }

    // Erzeugt einen Perlin-Noise-Wert für die gegebenen Koordinaten
    private generateNoiseValue(x: number, y: number, scale: number): number {
        // Angepasst an die neue API
        //return (this.noise(x * scale, y * scale) + 1) / 2;
        return (this.noise(x, y) + 1) / 2;
    }

    // Wählt einen Tile basierend auf dem Noise-Wert aus
    private getTileFromNoise(
        noiseValue: number,
        tileOptions: number[]
    ): number {
        // Skaliere den Wert auf den Bereich des Arrays
        const index = Math.floor(noiseValue * tileOptions.length);
        return tileOptions[index];
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
