import { Actor } from "./actor";
export class Player extends Actor {
    private keyW: Phaser.Input.Keyboard.Key;
    private keyA: Phaser.Input.Keyboard.Key;
    private keyS: Phaser.Input.Keyboard.Key;
    private keyD: Phaser.Input.Keyboard.Key;

    public currentDirectionX = 0;
    public currentDirectionY = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "sprites");
        // KEYS
        this.keyW = this.scene.input.keyboard!.addKey("W");
        this.keyA = this.scene.input.keyboard!.addKey("A");
        this.keyS = this.scene.input.keyboard!.addKey("S");
        this.keyD = this.scene.input.keyboard!.addKey("D");
        // PHYSICS
        this.getBody().setSize(14, 20);
        this.getBody().setOffset(1, 0);

        // Setze das Startframe auf 'up0'
        this.setFrame('player-down-right-0');

    }

 

    update(): void {
        this.getBody().setVelocity(0);
        let directionX = 0;
        let directionY = 0;

        // Y-Richtung prüfen
        if (this.keyW?.isDown) {
            directionY = -1;
            this.currentDirectionY = directionY;
            if (!this.keyA?.isDown && !this.keyD?.isDown) {
                this.currentDirectionX = 0;
            }
        } else if (this.keyS?.isDown) {
            directionY = 1;
            this.currentDirectionY = directionY;
            if (!this.keyA?.isDown && !this.keyD?.isDown) {
                this.currentDirectionX = 0;
            }
        }

        // X-Richtung prüfen
        if (this.keyA?.isDown) {
            directionX = -1;
            this.currentDirectionX = directionX;
            if (!this.keyW?.isDown && !this.keyS?.isDown) {
                this.currentDirectionY = 0;
            }
        } else if (this.keyD?.isDown) {
            directionX = 1;
            this.currentDirectionX = directionX;
            if (!this.keyW?.isDown && !this.keyS?.isDown) {
                this.currentDirectionY = 0;
            }
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
                this.anims.play('player-' + animationKey, true);
            }

        } else {
            this.anims.stop();
        }
    }
}
