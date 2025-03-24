import { Scene } from "phaser";

export class Sandbox extends Scene {
    fontTest: Phaser.GameObjects.BitmapText;

    constructor() {
        super("Sandbox");
    }

    preload() {
        const config = {
            image: "font",
            width: 8,
            height: 8,
            chars: Phaser.GameObjects.RetroFont.TEXT_SET3,
            charsPerRow: 13,
            spacing: { x: 0, y: 0 },
        } as unknown as Phaser.Types.GameObjects.BitmapText.RetroFontConfig;

        this.cache.bitmapFont.add(
            "font",
            Phaser.GameObjects.RetroFont.Parse(this, config)
        );

        this.fontTest = this.add.bitmapText(0, 0, "font", "WHO DARES WINS ONLINE");

        this.fontTest.setScale(1);
        this.fontTest.setDepth(100);
        
        console.log('Sandbox creation completed.')
    }
}
