import { Scene } from "phaser";
import { Player } from "./player";
import { Enemy } from "./enemy";

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

    public shoot(shooter: Player | Enemy, target: 'player' | 'enemy', directionX: number, directionY: number) {
        const bulletGroup = target === 'enemy' ? this.bullets : this.enemyBullets;
        const speed = 150;

        const bullet = bulletGroup.get(
            shooter.x,
            shooter.y,
            "sprites",
            "ammo-0"
        );

        const bulletSound = this.scene.sound.add("bullet");
        bulletSound.play();

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(directionX * speed);
            bullet.setVelocityY(directionY * speed);

            // Projektil nach Zeit zerstören
            const lifetime = target === 'enemy' ? 1200 : 1000;
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