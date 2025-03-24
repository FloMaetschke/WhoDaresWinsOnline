const DEBUG = false;

export interface MapObject {
    height: number;
    id: number;
    name: string;
    point: boolean;
    rotation: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
}

export class DimetricMap extends Phaser.GameObjects.GameObject {
    sprites = new Map<string, Phaser.GameObjects.Sprite>();
    blockingTiles: Phaser.Physics.Arcade.StaticGroup;
    height: number;
    width: number;

    objects: MapObject[];

    constructor(
        public scene: Phaser.Scene,
        public tileSize: 8,
        private tileset: string,
        public offsetX: number,
        public offsetY: number
    ) {
        super(scene, "DimetricMap");
        this.blockingTiles = this.scene.physics.add.staticGroup({
            classType: Phaser.Physics.Arcade.Sprite,
        });
    }

    public setTile(x: number, y: number, frame: number, depth: number) {
        if (this.sprites.has(`${x}_${y}`)) {
            const sprite = this.sprites.get(`${x}_${y}`)!;
            sprite.setFrame(frame);
            sprite.setDepth(depth);
            return sprite;
        } else {
            const sprite = this.scene.add.sprite(
                x * this.tileSize + this.offsetX + 4,
                y * this.tileSize + this.offsetY + 4,
                this.tileset,
                frame
            );
            sprite.setDepth(depth);
            this.sprites.set(`${x}_${y}`, sprite);
            sprite.ignoreDestroy = true;
            return sprite;
        }
    }

    update() {}

    setTilesFromEntityType(key: string) {
        const entityJson = this.scene.cache.json.get(key + "Json");
        this.setData("properties", entityJson.properties);

        this.width = entityJson.width;
        this.height = entityJson.height;

        
        const entityLayers = entityJson.layers;
        if (entityLayers) {
            const backgroundLayer = entityLayers.find(
                (layer: { name: string }) => layer.name?.toLowerCase() === "background"
            );
            const blockLayer = entityLayers.find(
                (layer: { name: string }) => layer.name?.toLowerCase() === "block"
            );
            const height1Layer = entityLayers.find(
                (layer: { name: string }) => layer.name?.toLowerCase() === "height1"
            );
            const height2Layer = entityLayers.find(
                (layer: { name: string }) => layer.name?.toLowerCase() === "height2"
            );
            const height3Layer = entityLayers.find(
                (layer: { name: string }) => layer.name?.toLowerCase() === "height3"
            );

            const objectsLayer = entityLayers.find(
                (layer: { name: string }) => layer.name?.toLowerCase() === "objects"
            );

            this.objects = objectsLayer?.objects || [];

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const backgroundTile =
                        backgroundLayer.data[x + y * backgroundLayer.width];
                    const blockTile = blockLayer.data[x + y * blockLayer.width];
                    const height1Tile =
                        height1Layer.data[x + y * height1Layer.width];
                    const height2Tile =
                        height2Layer.data[x + y * height2Layer.width];
                    const height3Tile =
                        height3Layer.data[x + y * height3Layer.width];

                    const groundHeight =
                        y * this.tileSize + this.offsetY - 8 - 4;

                    if (backgroundTile) {
                        this.setTile(x, y, backgroundTile - 1, 1);
                    }
                    if (blockTile) {
                        const sprite = this.setTile(
                            x,
                            y,
                            blockTile - 1,
                            groundHeight
                        );

                        this.blockingTiles.add(sprite);
                    }
                    if (height1Tile) {
                        this.setTile(
                            x,
                            y,
                            height1Tile - 1,
                            groundHeight + this.tileSize
                        );
                    }
                    if (height2Tile) {
                        this.setTile(
                            x,
                            y,
                            height2Tile - 1,
                            groundHeight + this.tileSize * 2
                        );
                    }
                    if (height3Tile) {
                        this.setTile(
                            x,
                            y,
                            height3Tile - 1,
                            groundHeight + this.tileSize * 3
                        );
                    }
                }
            }
        }


        if (DEBUG) {
            const rect = this.scene.add
                .rectangle(
                    this.offsetX + this.width * this.tileSize * 0.5,
                    this.offsetY + this.height * this.tileSize * 0.5,
                    this.width * this.tileSize,
                    this.height * this.tileSize,
                    0x0000ff,
                    0.3
                )
                .setDepth(10000);

            const hideOut= this.objects.find(
                (x) => x.type.toLowerCase() === "hideout"
            );

            if (hideOut) {
                const posX =
                    this.offsetX  + hideOut.x;
                const posY =
                    this.offsetY  + hideOut.y;

                this.scene.add
                    .rectangle(posX, posY, 1, 16, 0xffff00)
                    .setDepth(1000000);
                this.scene.add
                    .rectangle(posX, posY, 16, 1, 0xffff00)
                    .setDepth(1000000);

                // this.scene.add
                //     .rectangle(posX - 10, posY, 40, 2, 0xffff00)
                //     .setDepth(1000000);
                // this.scene.add
                //     .rectangle(posX, posY - 10, 2, 40, 0xffff00)
                //     .setDepth(1000000);
            }

            //console.log(key, this.width, this.height);
        }

    }

    destroy() {
        for (const sprite of this.sprites.values()) {
            if (sprite.active) {
                sprite.destroy();
            }
        }
        super.destroy();
    }
}
