import { Scene } from "phaser";
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

    constructor(scene: Phaser.Scene, x: number, y: number, target: Player) {
        super(scene, x, y, "sprites");
        this.target = target;
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.getBody().setSize(30, 30);
        this.getBody().setOffset(8, 0);
        this.setFrame("enemy-down-right-0");
        this.startWandering();
    }

    public static initAnimations(scene: Scene): void {
        scene.anims.create({
            key: "enemy-up",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-up-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-down",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-down-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-up-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-up-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-up-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-up-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-down-left",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-down-left-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
        scene.anims.create({
            key: "enemy-down-right",
            frames: scene.anims.generateFrameNames("sprites", {
                prefix: "enemy-down-right-",
                end: 2,
            }),
            frameRate: 10,
            repeat: -1,
        });
    }

    private startWandering(): void {
        if (this.wanderEvent) {
            this.wanderEvent.destroy();
        }

        this.wanderTimer = Math.random() * 9000 + 1000;
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
        } else {
            animationKey =
                this.currentDirectionX < 0 ? "enemy-left" : "enemy-right";
        }

        if (
            !this.anims.isPlaying ||
            this.anims.currentAnim?.key !== animationKey
        ) {
            this.anims.play(animationKey, true);
        }

        if (this.currentDirectionX < 0) {
            this.getBody().setOffset(48, 15);
        } else if (this.currentDirectionX > 0) {
            this.getBody().setOffset(15, 15);
        }
    }

    preUpdate(): void {
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
}
