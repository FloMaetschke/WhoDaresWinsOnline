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
    
    // Neues tooltip Element zum Anzeigen der Tile-ID
    private tooltip: HTMLElement | null = null;

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

        // Tooltip erstellen
        this.createTooltip();
        
        // Mausbewegung verfolgen
        this.scene.input.on('pointermove', this.handleMouseMove, this);
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

        // Temporärer Array zum Speichern der Tile-Typen
        const tileTypes: Array<Array<{ floorType: FloorType, noiseValue: number }>> = [];

        // Erste Phase: Generiere und speichere alle Tile-Typen
        for (let y = 0; y < this.chunkSize; y++) {
            tileTypes[y] = [];
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
                tileTypes[y][x] = { floorType, noiseValue };
            }
        }

        // Zweite Phase: Entferne alleinstehende Wassertiles
        this.removeWaterFringes(tileTypes);

        // Dritte Phase: Platziere Tiles basierend auf bereinigtem Array
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                const { floorType, noiseValue } = tileTypes[y][x];
                
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

    // Neue Methode zum Entfernen von alleinstehenden Wassertiles
    private removeWaterFringes(tileTypes: Array<Array<{ floorType: FloorType, noiseValue: number }>>) {
        const chunkSize = this.chunkSize;
        
        // Temporäres Array für die Änderungen
        const tilesToChange: Array<{ x: number, y: number }> = [];
        
        for (let y = 0; y < chunkSize; y++) {
            for (let x = 0; x < chunkSize; x++) {
                if (tileTypes[y][x].floorType === "water") {
                    // Zähle direkte Wasser-Nachbarn (oben, rechts, unten, links)
                    let waterNeighbors = 0;
                    
                    // Oben
                    if (y > 0 && tileTypes[y-1][x].floorType === "water") {
                        waterNeighbors++;
                    }
                    
                    // Rechts
                    if (x < chunkSize-1 && tileTypes[y][x+1].floorType === "water") {
                        waterNeighbors++;
                    }
                    
                    // Unten
                    if (y < chunkSize-1 && tileTypes[y+1][x].floorType === "water") {
                        waterNeighbors++;
                    }
                    
                    // Links
                    if (x > 0 && tileTypes[y][x-1].floorType === "water") {
                        waterNeighbors++;
                    }
                    
                    // Wenn weniger als 2 Wasser-Nachbarn, markiere zum Ändern
                    if (waterNeighbors < 2) {
                        tilesToChange.push({ x, y });
                    }
                }
            }
        }
        
        // Ändere alle markierten Tiles zu "grass"
        for (const tile of tilesToChange) {
            tileTypes[tile.y][tile.x].floorType = "grass";
        }
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
        
        // Tooltip entfernen
        if (this.tooltip && document.body.contains(this.tooltip)) {
            document.body.removeChild(this.tooltip);
        }
        
        // Event-Listener entfernen
        this.scene.input.off('pointermove', this.handleMouseMove, this);
    }

    // Erstellt das Tooltip-Element
    private createTooltip() {
        // Tooltip erstellen wenn es noch nicht existiert
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.style.position = 'absolute';
            this.tooltip.style.padding = '8px';
            this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            this.tooltip.style.color = 'white';
            this.tooltip.style.borderRadius = '4px';
            this.tooltip.style.pointerEvents = 'none';
            this.tooltip.style.zIndex = '1000';
            this.tooltip.style.display = 'none';
            this.tooltip.style.fontFamily = 'Arial, sans-serif';
            this.tooltip.style.fontSize = '12px';
            this.tooltip.style.lineHeight = '1.4';
            this.tooltip.style.whiteSpace = 'nowrap';
            document.body.appendChild(this.tooltip);
        }
    }
    
    // Behandelt Mausbewegungen und aktualisiert das Tooltip
    private handleMouseMove(pointer: Phaser.Input.Pointer) {
        // Mausposition im Weltkoordinatensystem
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        
        // Position im Tile-Koordinatensystem
        const tileX = Math.floor(worldPoint.x / 8);
        const tileY = Math.floor(worldPoint.y / 8);
        const pixelX = worldPoint.x;  // Exakte Pixelposition für Entity-Tile-Erkennung
        const pixelY = worldPoint.y;
        
        // Bestimme den Chunk
        const chunkX = Math.floor(tileX / this.chunkSize);
        const chunkY = Math.floor(tileY / this.chunkSize);
        
        // Bestimme die Position innerhalb des Chunks
        const localTileX = tileX % this.chunkSize;
        const localTileY = tileY % this.chunkSize;
        
        // Hole den Layer für diesen Chunk
        const chunkKey = `${chunkX},${chunkY}`;
        const layer = this.activeChunks.get(chunkKey);
        
        if (layer) {
            // Hole das Tile an dieser Position
            const tile = layer.getTileAt(localTileX, localTileY);
            
            if (tile) {
                // Tooltip mit erweiterten Informationen aktualisieren
                if (this.tooltip) {
                    this.tooltip.style.display = 'block';
                    
                    // Verwende die tatsächlichen Mauskoordinaten im Browserfenster
                    this.tooltip.style.left = `${pointer.event.pageX + 15}px`;
                    this.tooltip.style.top = `${pointer.event.pageY + 15}px`;
                    
                    // Prüfe, ob das Tile Kollision hat
                    const isBlocked = tile.collides;
                    
                    // Suche nach Entities an dieser Position
                    const worldX = tileX * 8; // Konvertiere zurück zu Weltkoordinaten
                    const worldY = tileY * 8;
                    const entitiesAtPosition = this.findEntitiesAtPosition(worldX, worldY);
                    
                    // Bereite den Tooltip-Text vor
                    let tooltipContent = `Ground:\nTile: ${tile.index}\nBlocked: ${isBlocked}\n`;
                    
                    // Füge Entity-Informationen hinzu, wenn vorhanden
                    if (entitiesAtPosition.length > 0) {
                        tooltipContent += `\nEntity:\n`;
                        entitiesAtPosition.forEach(entity => {
                            try {
                                tooltipContent += `Name: ${entity.getType()}\n`;
                                
                                // Berechne die relative Position innerhalb des Entities
                                const relativeX = pixelX - entity.x;
                                const relativeY = pixelY - entity.y;
                                
                                // Hole den spezifischen Tile-Index an dieser Position
                                const specificTileIndex = entity.getTileAt(relativeX, relativeY);
                                
                                // Zeige "-" für leere Tiles und den korrigierten Index für vorhandene Tiles
                                tooltipContent += `Tile: ${specificTileIndex !== -1 ? specificTileIndex : '-'}\n`;
                            } catch (error) {
                                console.log("Error getting entity info:", error);
                                tooltipContent += "Error getting entity info\n";
                            }
                        });
                    }
                    
                    // Ersetze Zeilenumbrüche mit HTML-Zeilenumbrüchen
                    this.tooltip.innerHTML = tooltipContent.replace(/\n/g, '<br>');
                }
            } else {
                // Kein Tile gefunden, Tooltip verstecken
                if (this.tooltip) {
                    this.tooltip.style.display = 'none';
                }
            }
        } else {
            // Kein Layer für diesen Chunk gefunden, Tooltip verstecken
            if (this.tooltip) {
                this.tooltip.style.display = 'none';
            }
        }
    }

    // Sucht nach Entities an einer bestimmten Position
    private findEntitiesAtPosition(x: number, y: number): Entity[] {
        const foundEntities: Entity[] = [];
        
        // Durchsuche alle Entities
        this.allEntities.forEach(entity => {
            // Verbesserte Kollisionserkennung für Entities mit ihren tatsächlichen Dimensionen
            // Die Position muss innerhalb des Entity-Bereichs liegen
            const entityX = entity.x;
            const entityY = entity.y;
            const entityWidth = entity.entityWidth() * 8;  // Breite in Pixeln
            const entityHeight = entity.entityHeight() * 8; // Höhe in Pixeln
            
            // Prüfe, ob die Position innerhalb des Entity-Bereichs liegt
            if (x >= entityX && x < entityX + entityWidth && 
                y >= entityY && y < entityY + entityHeight) {
                foundEntities.push(entity);
            }
        });
        
        return foundEntities;
    }
}
