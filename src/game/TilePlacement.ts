


const ground = [4, 5, 6, 7, 8, 9]; // Deine vordefinierten Tile-Indizes
const ground2 = [8, 9, 13, 14, 64]; // Deine vordefinierten Tile-Indizes
const water = [91,92,93, 94, 95,110,110,110,110,110,110,111]; // Deine vordefinierten Tile-Indizes
export type FloorType = "water" | "ground1" | "ground2";

// Wählt einen Tile basierend auf dem Noise-Wert aus

export function  getTileFromNoise(
    noiseValue: number,
    floorType: FloorType
): number {
    switch (floorType) {
        case "water":
            return water[Math.floor(noiseValue * water.length)];
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
