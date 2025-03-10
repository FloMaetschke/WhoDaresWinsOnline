export interface ObjectTemplate {
    width: number;
    height: number;
    backgroundLayer: number[];
    blockLayer: number[];
    overlayLayer: number[];
}

export const treeTemplate: ObjectTemplate = {
    width: 3,
    height: 5,
    backgroundLayer: [
        -1,
        -1,
        -1,
        -1,
        -1 - 1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
    ],
    blockLayer: [
        -1,
        -1,
        -1,
        -1,
        -1 - 1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        49,
        -1,
    ],
    overlayLayer: [25, 26, 27, 33, 34, 35, 39, 40, 41, -1, 45, -1, -1, -1, -1],
};

export function createObject(
    background: Phaser.Tilemaps.TilemapLayer,
    block: Phaser.Tilemaps.TilemapLayer,
    overlay: Phaser.Tilemaps.TilemapLayer,
    posX = 0,
    posY = 0,
    obj: ObjectTemplate
) {
    for (let y = 0; y < obj.height; y++) {
        for (let x = 0; x < obj.width; x++) {
            const index = y * obj.width + x;
            if (obj.backgroundLayer[index] > 0) {
                background.putTileAt(
                    obj.backgroundLayer[index],
                    posX + x,
                    posY + y
                );
            }
            if (obj.blockLayer[index] > 0) {
                block.putTileAt(obj.blockLayer[index], posX + x, posY + y);
            }
            if (obj.overlayLayer[index] > 0) {
                overlay.putTileAt(obj.overlayLayer[index], posX + x, posY + y);
            }
        }
    }
}
