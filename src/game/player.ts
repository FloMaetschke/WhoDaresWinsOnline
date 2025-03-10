import { Actor } from "./actor";
import { Game } from "./scenes/Game";

export class Player extends Actor {
    public currentDirectionX = 0;
    public currentDirectionY = 0;
    public speed = 60;
    dead: boolean;

    constructor(public scene: Game, x: number, y: number) {
        super(scene, x, y, "sprites");

        // PHYSICS
        this.getBody().setSize(13, 20);
        this.getBody().setOffset(1, 0);

        // Setze das Startframe auf 'up0'
        this.setFrame("player-down-right-0");

        // Spieler-Tiefe anpassen, damit er über der Tilemap liegt
        this.setDepth(10);
        
    }

    public shoot() {
        if (!this.dead) {
            this.scene.shootingController.shoot(
                this,
                "enemy",
                this.currentDirectionX,
                this.currentDirectionY
            );
        }
    }

    update(): void {
        if (this.dead) return;
        this.scene.keyboardController.updateKeyboardMovement(this);
    }

    public move(directionX: number, directionY: number) {
        if (this.body) {
            this.body.velocity.x = directionX * this.speed;
            this.body.velocity.y = directionY * this.speed;
        }
        if (directionX !== 0 || directionY !== 0) {
            let animationKey = "";
            if (directionY === -1) {
                animationKey =
                    directionX === -1
                        ? "up-left"
                        : directionX === 1
                        ? "up-right"
                        : "up";
            } else if (directionY === 1) {
                animationKey =
                    directionX === -1
                        ? "down-left"
                        : directionX === 1
                        ? "down-right"
                        : "down";
            } else {
                animationKey = directionX === -1 ? "left" : "right";
            }

            if (
                !this.anims.isPlaying ||
                this.anims.currentAnim!.key !== animationKey
            ) {
                this.anims.play("player-" + animationKey, true);
            }
        } else {
            this.anims?.stop();
        }
    }

    public die() {
        this.dead = true;
        console.log("Spieler ist tot");

        // Sound abspielen
        (this.scene as Game).soundController.playSound("player_die");

        // Kollisionen deaktivieren
        this.getBody().enable = false;

        // Tod-Animation abspielen
        this.anims.play("player-dead");

        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.stop("Game");
            this.scene.scene.start("Game");
        });
    }
}
