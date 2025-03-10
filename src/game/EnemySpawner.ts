import { Scene } from "phaser";
import { Player } from "./Player";
import { Enemy } from "./Enemy";

const ENEMY_SPAWN_INTERVAL = 2000;

export class EnemySpawner {
    private scene: Scene;
    private player: Player;
    private enemies: Phaser.Physics.Arcade.Group;

    constructor(
        scene: Scene,
        player: Player,
        enemies: Phaser.Physics.Arcade.Group
    ) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemies;

        // Gegner spawnen
        // this.scene.time.addEvent({
        //     delay: ENEMY_SPAWN_INTERVAL,
        //     callback: this.spawnEnemy,
        //     callbackScope: this,
        //     loop: true,
        // });
    }

    public spawnEnemy() {
        if (this.enemies.countActive(true) >= 5) return;

        // Gegner um den Spieler herum spawnen, aber außerhalb des Bildschirms
        const camera = this.scene.cameras.main;

        // Zufällige Position am Rand des Sichtfelds der Kamera
        let x, y;
        const side = Phaser.Math.Between(0, 3); // 0: oben, 1: rechts, 2: unten, 3: links

        switch (side) {
            case 0: // Oben
                x = Phaser.Math.Between(
                    this.player.x - camera.width / 2,
                    this.player.x + camera.width / 2
                );
                y = this.player.y - camera.height / 2 - 50; // Etwas außerhalb des Bildschirms
                break;
            case 1: // Rechts
                x = this.player.x + camera.width / 2 + 50;
                y = Phaser.Math.Between(
                    this.player.y - camera.height / 2,
                    this.player.y + camera.height / 2
                );
                break;
            case 2: // Unten
                x = Phaser.Math.Between(
                    this.player.x - camera.width / 2,
                    this.player.x + camera.width / 2
                );
                y = this.player.y + camera.height / 2 + 50;
                break;
            case 3: // Links
                x = this.player.x - camera.width / 2 - 50;
                y = Phaser.Math.Between(
                    this.player.y - camera.height / 2,
                    this.player.y + camera.height / 2
                );
                break;
        }

        const enemy = new Enemy(this.scene, x, y, this.player);
        enemy.setDepth(10); // Gleiche Tiefe wie Spieler
        this.enemies.add(enemy);
    }
}
