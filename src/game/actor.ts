import { Physics } from "phaser";
export class Actor extends Phaser.GameObjects.Container {
    sprite: Phaser.GameObjects.Sprite;
    protected hp = 100;
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        frame: string
    ) {
        super(scene, x, y, []);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.getBody().setCollideWorldBounds(true);

        this.sprite = scene.add.sprite(7, 10, "sprites", frame);
        this.sprite.setData("actor", this);
        this.add(this.sprite);
        scene.physics.add.existing(this.sprite,false);
    }

    setVelocity(x: number, y: number) {
        this.getBody().setVelocity(x, y);
    }

    protected getBody(): Physics.Arcade.Body {
        return this.body as Physics.Arcade.Body;
    }

    protected getSpriteBody(): Physics.Arcade.Body {
        return this.sprite.body as Physics.Arcade.Body;
    }
}
