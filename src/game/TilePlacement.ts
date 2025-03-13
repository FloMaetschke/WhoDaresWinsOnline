


const ground = [4, 5, 6, 7, 8, 9]; // Deine vordefinierten Tile-Indizes
const ground2 = [8, 9, 13, 14, 64]; // Deine vordefinierten Tile-Indizes
const water = [91,92,93, 94, 95,110,110,110,110,110,110,111]; // Deine vordefinierten Tile-Indizes
export type FloorType = "water" | "ground1" | "ground2";


export enum TileBorderDirections {
    None = 0,
    Top = 1,
    Right = 2,
    Bottom = 4,
    Left = 8,
    TopRight = 3,
    BottomRight = 6,
    BottomLeft = 12,
    TopLeft = 9,
    All = 15,
}

export const waterTiles = new Map<TileBorderDirections, number[]>();

waterTiles.set(TileBorderDirections.None, [91, 92, 93, 94, 95,110,110,110,110,110,110,111]);
waterTiles.set(TileBorderDirections.Top, [88,89,96,97,98,99]);
waterTiles.set(TileBorderDirections.Right, [15]);
waterTiles.set(TileBorderDirections.Bottom, [15]);
waterTiles.set(TileBorderDirections.Left, [15]);
waterTiles.set(TileBorderDirections.TopRight, [15]);
waterTiles.set(TileBorderDirections.TopLeft, [15]);
waterTiles.set(TileBorderDirections.BottomRight, [15]);
waterTiles.set(TileBorderDirections.BottomLeft, [15]);

// Wählt einen Tile basierend auf dem Noise-Wert aus

export function  getTileFromNoise(
    noiseValue: number,
    floorType: FloorType
): number {
    switch (floorType) {
        case "water":
            return water[Math.floor(noiseValue * waterTiles.get(TileBorderDirections.None)!.length)];
        case "ground1":
            return ground[Math.floor(noiseValue * ground.length)];
        case "ground2":
            return ground2[Math.floor(noiseValue * ground2.length)];
        default:
            return ground[Math.floor(noiseValue * ground.length)];
    }
}


export function getFloorType(noiseValue: number): FloorType {
    if (noiseValue < 0.2) {
        return "water";
    } else if (noiseValue >= 0.2 && noiseValue < 0.6) {
        return "ground1";
    } else {
        return "ground2";
    }
}
