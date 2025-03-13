import { Scene } from "phaser";
import { Player } from "./Player2";
import { Enemy } from "./Enemy";

export class ShootingController {
    private scene: Scene;
    private bullets: Phaser.Physics.Arcade.Group;
    private enemyBullets: Phaser.Physics.Arcade.Group;

    constructor(scene: Scene) {
        this.scene = scene;

        // Projektile für Spieler
        this.bullets = this.scene.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 3,
        });
        this.bullets.setDepth(11);

        // Projektile für Gegner
        this.enemyBullets = this.scene.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 10,
        });
        this.enemyBullets.setDepth(11);


    }

    public setupCollisions(
        player: Player,
        enemies: Phaser.Physics.Arcade.Group
    ): void {
        // Kollision zwischen Spielerkugeln und Gegnern
        this.scene.physics.add.collider(
            this.bullets,
            enemies,
            (bullet, enemy) => {
                this.handleBulletEnemyCollision(
                    bullet as Phaser.Physics.Arcade.Image,
                    enemy as Enemy
                );
            },
            undefined,
            this
        );

        // Kollision zwischen Feindkugeln und Spieler
        this.scene.physics.add.collider(
            this.enemyBullets,
            player.sprite,
            (bullet, playerSprite) => {
                this.handleEnemyBulletPlayerCollision(
                    bullet as Phaser.Physics.Arcade.Image,
                    playerSprite as Phaser.Physics.Arcade.Image
                );
            },
            undefined,
            this
        );
    }

    private handleBulletEnemyCollision(
        bullet: Phaser.Physics.Arcade.Image,
        enemy: Enemy
    ): void {
        bullet.destroy();
        enemy.die();
    }

    private handleEnemyBulletPlayerCollision(
        player: Phaser.Physics.Arcade.Image,
        bullet: Phaser.Physics.Arcade.Image
    ): void {
        bullet.destroy();
        (player.getData('actor') as Player).die();
    }

    public shoot(
        shooter: Player | Enemy,
        target: "player" | "enemy",
        directionX: number,
        directionY: number
    ) {
        const bulletGroup =
            target === "enemy" ? this.bullets : this.enemyBullets;
        const speed = 150;

        const bullet = bulletGroup.get(
            shooter.x + shooter.sprite.x,
            shooter.y + shooter.sprite.y,
            "sprites",
            "ammo-0"
        );
        // Temporarily disabled:
        (this.scene as Game).soundController.playSound("bullet");

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(directionX * speed);
            bullet.setVelocityY(directionY * speed);

            // Projektil nach Zeit zerstören
            const lifetime = target === "enemy" ? 1200 : 1000;
            this.scene.time.delayedCall(lifetime, () => {
                bullet.destroy();
            });
        }
    }

    public getBullets() {
        return this.bullets;
    }

    public getEnemyBullets() {
        return this.enemyBullets;
    }
}
