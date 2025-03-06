import { Actor } from "./actor";
export class Player extends Actor {
    private keyW: Phaser.Input.Keyboard.Key;
    private keyA: Phaser.Input.Keyboard.Key;
    private keyS: Phaser.Input.Keyboard.Key;
    private keyD: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "a-player");
        // KEYS
        this.keyW = this.scene.input.keyboard!.addKey("W");
        this.keyA = this.scene.input.keyboard!.addKey("A");
        this.keyS = this.scene.input.keyboard!.addKey("S");
        this.keyD = this.scene.input.keyboard!.addKey("D");
        // PHYSICS
        this.getBody().setSize(30, 30);
        this.getBody().setOffset(8, 0);

        // Setze das Startframe auf 'up0'
        this.setFrame('player-down-right-0');

        this.initAnimations();
    }

    private initAnimations(): void {
        this.scene.anims.create({
            key: "up",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-up-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "down",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-down-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "left",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "right",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "up-left",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-up-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "up-right",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-up-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "down-left",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-down-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        this.scene.anims.create({
            key: "down-right",
            frames: this.anims.generateFrameNames("a-player", {
                prefix: "player-down-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });

    }

    update(): void {
        this.getBody().setVelocity(0);
        let directionX = 0;
        let directionY = 0;

        if (this.keyW?.isDown) {
            directionY = -1;
        } else if (this.keyS?.isDown) {
            directionY = 1;
        }

        if (this.keyA?.isDown) {
            directionX = -1;
        } else if (this.keyD?.isDown) {
            directionX = 1;
        }

        const speed = 110;
        this.body!.velocity.x = directionX * speed;
        this.body!.velocity.y = directionY * speed;

        if (directionX !== 0 || directionY !== 0) {
            let animationKey = '';
            if (directionY === -1) {
                animationKey = directionX === -1 ? 'up-left' : (directionX === 1 ? 'up-right' : 'up');
            } else if (directionY === 1) {
                animationKey = directionX === -1 ? 'down-left' : (directionX === 1 ? 'down-right' : 'down');
            } else {
                animationKey = directionX === -1 ? 'left' : 'right';
            }

            if (!this.anims.isPlaying || this.anims.currentAnim!.key !== animationKey) {
                this.anims.play(animationKey, true);
            }

            if (directionX === -1) {
                this.getBody().setOffset(48, 15);
            } else if (directionX === 1) {
                this.getBody().setOffset(15, 15);
            }
        } else {
            this.anims.stop();
        }
    }
}
