import { Entity } from "./Entity";
import { FloorType, getFloorType } from "./TilePlacement";

const entitySizesInTiles = new Map<string, { width: number; height: number }>();
const TILE_SIZE = 8;

entitySizesInTiles.set("tree", { width: 3, height: 5 });
entitySizesInTiles.set("rock", { width: 3, height: 2 });

/**
 * Prüft, ob ein Bereich bereits von einem Entity belegt ist oder Wasser enthält
 * @param x X-Koordinate des zu prüfenden Bereichs
 * @param y Y-Koordinate des zu prüfenden Bereichs
 * @param entityType Typ des Entities (um die Größe zu bestimmen)
 * @param existingEntities Set der existierenden Entities
 * @param noiseFunction Optional: Funktion zur Bestimmung des Bodentyps an einer Position
 * @returns true, wenn der Bereich bereits belegt ist oder Wasser enthält, sonst false
 */
export function isAreaOccupied(
    x: number, 
    y: number, 
    entityType: string, 
    existingEntities: Set<Entity>,
    noiseFunction?: (worldX: number, worldY: number) => number
): boolean {
    const entitySizeInTiles = entitySizesInTiles.get(entityType)!;
    // Rechteck des neuen Entities
    const newRect = {
        x: x,
        y: y,
        width: entitySizeInTiles.width * TILE_SIZE,
        height: entitySizeInTiles.height * TILE_SIZE,
    };
    
    // Prüfe Überschneidungen mit vorhandenen Entities
    for (const entity of existingEntities) {
        const existingRect = {
            x: entity.x,
            y: entity.y,
            width: entity.entityWidth() * 8,
            height: entity.entityHeight() * 8,
        };
        
        // Prüfe, ob sich die Rechtecke überschneiden
        if (doRectanglesOverlap(newRect, existingRect)) {
            return true; // Bereich ist belegt
        }
    }
    
    // Wenn eine Noise-Funktion bereitgestellt wurde, prüfen wir auch den Bodentyp
    if (noiseFunction) {
        // Prüfe jeden Tile innerhalb des Entity-Bereichs
        const tileSize = 8; // Angenommen, ein Tile ist 8x8 Pixel
        const startTileX = Math.floor(x / tileSize);
        const startTileY = Math.floor(y / tileSize);
        const endTileX = Math.floor((x + newRect.width) / tileSize);
        const endTileY = Math.floor((y + newRect.height) / tileSize);
        
        // Prüfe jeden Tile im Bereich des Entities
        for (let tileY = startTileY; tileY <= endTileY; tileY++) {
            for (let tileX = startTileX; tileX <= endTileX; tileX++) {
                const noiseValue = noiseFunction(tileX, tileY);
                const floorType = getFloorType(noiseValue);
                
                // Wenn es Wasser ist, kann hier kein Entity platziert werden
                if (floorType === "water") {
                    return true;
                }
            }
        }
    }
    
    return false; // Bereich ist frei und enthält kein Wasser
}

/**
 * Prüft, ob sich zwei Rechtecke überschneiden
 * @param rect1 Erstes Rechteck {x, y, width, height}
 * @param rect2 Zweites Rechteck {x, y, width, height}
 * @returns true, wenn sich die Rechtecke überschneiden, sonst false
 */
export function doRectanglesOverlap(
    rect1: {x: number, y: number, width: number, height: number}, 
    rect2: {x: number, y: number, width: number, height: number}
): boolean {
    // Überschneidung liegt vor, wenn kein Nicht-Überschneiden vorliegt
    return !(rect1.x + rect1.width <= rect2.x || 
            rect2.x + rect2.width <= rect1.x || 
            rect1.y + rect1.height <= rect2.y || 
            rect2.y + rect2.height <= rect1.y);
}
