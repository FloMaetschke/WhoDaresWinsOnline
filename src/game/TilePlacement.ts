const groundOk = [4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9];

const treibsand = [112, 113];
const ground = [...groundFactor(10), ...treibsand]; // etwas Treibsand
const ground2 = [8, 9, 13, 14, 64];
const water = [91, 92, 93, 94, 95, 110, 110, 110, 110, 110, 110, 111];
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

waterTiles.set(
    TileBorderDirections.None,
    [91, 92, 93, 94, 95, 110, 110, 110, 110, 110, 110, 111]
);
waterTiles.set(TileBorderDirections.Top, [88, 89, 96, 97, 98, 99]);
waterTiles.set(TileBorderDirections.Right, [100, 102, 103]);
waterTiles.set(TileBorderDirections.Bottom, [105, 106, 107, 108]);
waterTiles.set(TileBorderDirections.Left, [101, 114]);
waterTiles.set(TileBorderDirections.TopRight, [90]);
waterTiles.set(TileBorderDirections.TopLeft, [87]);
waterTiles.set(TileBorderDirections.BottomRight, [103]);
waterTiles.set(TileBorderDirections.BottomLeft, [104]);

function groundFactor(value: number) {
    let result: number[] = [];
    for (let i = 0; i < value; i++) {
        result = result.concat(groundOk);
    }
    return result;
}

// Wählt einen Tile basierend auf dem Noise-Wert aus
export function getTileFromNoise(
    noiseValue: number,
    floorType: FloorType
): number {
    switch (floorType) {
        case "water":
            return water[
                Math.floor(
                    noiseValue *
                        waterTiles.get(TileBorderDirections.None)!.length
                )
            ];
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

/**
 * Bestimmt den Typ des Randtiles für Wasser basierend auf den Nachbartiles
 * @param isWater Array von booleans, das angibt, ob die Nachbartiles Wasser sind [center, top, right, bottom, left, topRight, bottomRight, bottomLeft, topLeft]
 * @returns Die passende Randrichtung für den Tile
 */
export function determineWaterBorderType(
    isWater: boolean[]
): TileBorderDirections {
    // Wenn das zentrale Tile kein Wasser ist, benötigen wir keinen Wasserrand
    if (!isWater[0]) return TileBorderDirections.None;

    let borderDirection = TileBorderDirections.None;

    // Prüfe die vier direkten Nachbarn (Oben, Rechts, Unten, Links)
    // Wenn ein Nachbar kein Wasser ist, müssen wir einen Rand in diese Richtung setzen
    if (!isWater[1]) borderDirection |= TileBorderDirections.Top;
    if (!isWater[2]) borderDirection |= TileBorderDirections.Right;
    if (!isWater[3]) borderDirection |= TileBorderDirections.Bottom;
    if (!isWater[4]) borderDirection |= TileBorderDirections.Left;

    return borderDirection;
}

/**
 * Wählt einen zufälligen Wassertile basierend auf der Randrichtung aus
 * @param borderDirection Die Richtung des Randes
 * @param noiseValue Ein Zufallswert für die Auswahl
 * @returns Die Tile-ID für den Wassertile
 */
export function getWaterBorderTile(
    borderDirection: TileBorderDirections,
    noiseValue: number
): number {
    const borderTiles = waterTiles.get(borderDirection);

    // Wenn keine passenden Border-Tiles definiert sind, verwende Standard-Wassertiles
    if (!borderTiles || borderTiles.length === 0) {
        const defaultWaterTiles = waterTiles.get(TileBorderDirections.None);
        return defaultWaterTiles![
            Math.floor(noiseValue * defaultWaterTiles!.length)
        ];
    }

    // Wähle einen zufälligen Tile aus den verfügbaren Border-Tiles
    return borderTiles[Math.floor(noiseValue * borderTiles.length)];
}
