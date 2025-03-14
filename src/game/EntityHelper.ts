import { Entity } from "./Entity";

 // Sucht nach Entities an einer bestimmten Position
 export function findEntitiesAtPosition(x: number, y: number, entities: Set<Entity>): Entity[] {
    const foundEntities: Entity[] = [];
    
    // Durchsuche alle Entities
    entities.forEach(entity => {
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