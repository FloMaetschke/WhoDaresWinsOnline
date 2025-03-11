import { Entity } from "./Entity";

const entitySizesInTiles = new Map<string, { width: number; height: number }>();
const TILE_SIZE = 8;

entitySizesInTiles.set("tree", { width: 3, height: 5 });
entitySizesInTiles.set("rock", { width: 3, height: 2 });

/**
 * Prüft, ob ein Bereich bereits von einem Entity belegt ist
 * @param x X-Koordinate des zu prüfenden Bereichs
 * @param y Y-Koordinate des zu prüfenden Bereichs
 * @param entityType Typ des Entities (um die Größe zu bestimmen)
 * @param existingEntities Liste der existierenden Entities im Chunk
 * @returns true, wenn der Bereich bereits belegt ist, sonst false
 */
export function isAreaOccupied(
    x: number,
    y: number,
    entityType: string,
    existingEntities: Set<Entity>
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

    return false; // Bereich ist frei
}

/**
 * Prüft, ob sich zwei Rechtecke überschneiden
 * @param rect1 Erstes Rechteck {x, y, width, height}
 * @param rect2 Zweites Rechteck {x, y, width, height}
 * @returns true, wenn sich die Rechtecke überschneiden, sonst false
 */
function doRectanglesOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
): boolean {
    // Überschneidung liegt vor, wenn kein Nicht-Überschneiden vorliegt
    return !(
        rect1.x + rect1.width <= rect2.x ||
        rect2.x + rect2.width <= rect1.x ||
        rect1.y + rect1.height <= rect2.y ||
        rect2.y + rect2.height <= rect1.y
    );
}
