import { Actor } from "./actor";
import { Player } from "./player";

export class Enemy extends Actor {
    private target: Player;
    private AGRESSOR_RADIUS = 500;
    private currentDirectionX = 0;
    private currentDirectionY = 0;
    private wanderTimer: number = 0;
    private isWandering: boolean = false;
    private wanderDirection = { x: 0, y: 0 };
    private wanderEvent: Phaser.Time.TimerEvent | null = null;
    dead = false;

    constructor(scene: Phaser.Scene, x: number, y: number, target: Player) {
        super(scene, x, y, "sprites");
        this.target = target;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Kollisionsbox anpassen
        this.getBody().setSize(13, 20);
        this.getBody().setOffset(1, 0);

        // Physik aktivieren
        this.body!.enable = true;

        // Initial animation starten
        this.anims.play("enemy-down");

        this.startWandering();
    }

    private startWandering(): void {
        if (this.wanderEvent) {
            this.wanderEvent.destroy();
        }

        this.wanderTimer = Math.random() * 4000 + 1000;
        this.isWandering = true;

        const directions = [
            { x: 0, y: -1 }, // up
            { x: 0, y: 1 }, // down
            { x: -1, y: 0 }, // left
            { x: 1, y: 0 }, // right
            { x: -1, y: -1 }, // up-left
            { x: 1, y: -1 }, // up-right
            { x: -1, y: 1 }, // down-left
            { x: 1, y: 1 }, // down-right
        ];

        const randomDirection =
            directions[Math.floor(Math.random() * directions.length)];
        this.wanderDirection = randomDirection;

        if (this.scene?.time) {
            this.wanderEvent = this.scene.time.addEvent({
                delay: this.wanderTimer,
                callback: this.startWandering,
                callbackScope: this,
            });
        }
    }

    private handleWandering(): void {
        if (!this.isWandering) return;

        const speed = 50;
        this.getBody().setVelocityX(this.wanderDirection.x * speed);
        this.getBody().setVelocityY(this.wanderDirection.y * speed);

        this.currentDirectionX = this.wanderDirection.x;
        this.currentDirectionY = this.wanderDirection.y;

        this.updateAnimation();
    }

    private updateAnimation(): void {
        let animationKey = "";

        // Bestimme die Animations-Richtung basierend auf der aktuellen Bewegung
        if (this.currentDirectionY < 0) {
            animationKey =
                this.currentDirectionX < 0
                    ? "enemy-up-left"
                    : this.currentDirectionX > 0
                    ? "enemy-up-right"
                    : "enemy-up";
        } else if (this.currentDirectionY > 0) {
            animationKey =
                this.currentDirectionX < 0
                    ? "enemy-down-left"
                    : this.currentDirectionX > 0
                    ? "enemy-down-right"
                    : "enemy-down";
        } else if (this.currentDirectionX !== 0) {
            animationKey =
                this.currentDirectionX < 0 ? "enemy-left" : "enemy-right";
        } else {
            // Wenn keine Bewegung, behalte die letzte Richtung bei
            if (this.anims.currentAnim) {
                animationKey = this.anims.currentAnim.key;
            } else {
                animationKey = "enemy-down"; // Standardanimation
            }
        }

        // Spiele die Animation nur ab, wenn sich die Richtung geändert hat
        // oder wenn keine Animation läuft
        if (
            !this.anims.isPlaying ||
            this.anims.currentAnim?.key !== animationKey
        ) {
            this.anims.play(animationKey, true);
        }
    }

    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        if (this.dead) {
            // Ändere die Transparenz des Sprites jedes Frame von 100% auf 50% und zurück
            this.alpha = 0.5 + Math.abs(Math.sin(time / 100)) * 0.2;

            this.getBody().setVelocityX(0);
            this.getBody().setVelocityY(0);
            return;
        }
     

        const distanceToPlayer = Phaser.Math.Distance.BetweenPoints(
            { x: this.x, y: this.y },
            { x: this.target.x, y: this.target.y }
        );

        if (distanceToPlayer < this.AGRESSOR_RADIUS && distanceToPlayer > 150) {
            this.isWandering = false;
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;

            const length = Math.sqrt(dx * dx + dy * dy);
            const directionX = dx / length;
            const directionY = dy / length;

            const speed = 100;
            this.getBody().setVelocityX(directionX * speed);
            this.getBody().setVelocityY(directionY * speed);

            this.currentDirectionX = Math.sign(directionX);
            this.currentDirectionY = Math.sign(directionY);

            this.updateAnimation();
        } else {
            this.handleWandering();
        }

    }

    public setTarget(target: Player): void {
        this.target = target;
    }

    public die() {
        this.dead = true;
        const dieSound = this.scene.sound.add("enemy_die");
        dieSound.play();
        this.anims.play("enemy-die");
        this.scene.time.delayedCall(1000, () => {
            this.destroy();
        });
    }
}
