import { Scene } from "phaser";
import { Player } from "./Player";
import { Enemy } from "./Enemy";
import { Game } from "./scenes/Game";

const ENEMY_SPAWN_INTERVAL = 1400;
const ENEMY_RANDOM_SPAWN_MAX = 5;
export class EnemySpawner {
    constructor(
        public scene: Scene,
        public player: Player,
        public enemies: Phaser.Physics.Arcade.Group,
        public enemiesBody: Phaser.Physics.Arcade.Group
    ) {
        //Gegner spawnen
        this.scene.time.addEvent({
            delay: ENEMY_SPAWN_INTERVAL,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });
    }

    spawnLocations = new Map<string, { x: number; y: number; count: number }>();

    activeSpawns: { x: number; y: number; count: number }[] = [];

    public spawnEnemy() {
        // First spawn active spawns:
        for (const spawnLocation of this.activeSpawns) {
            spawnLocation.count--;
            if(spawnLocation.count <= 0) continue;
            console.log(
                `Spawning Enemy at: ${spawnLocation.x}_${spawnLocation.y} Count: `,
                spawnLocation.count
            );
            const enemySpawn = new Enemy(
                this.scene as Game,
                spawnLocation.x,
                spawnLocation.y,
                this.player
            );
            enemySpawn.setDepth(10); // Gleiche Tiefe wie Spieler
            this.enemies.add(enemySpawn);
            this.enemiesBody.add(enemySpawn.sprite);
            enemySpawn.currentDirectionX = 0;
            enemySpawn.currentDirectionY = 1;
            if (spawnLocation.count <= 0) {
                this.spawnLocations.delete(
                    `${spawnLocation.x}_${spawnLocation.y}`
                );
                this.activeSpawns.indexOf(spawnLocation);
                this.activeSpawns.splice(this.activeSpawns.indexOf(spawnLocation), 1);
            }
        }

        if (this.enemies.countActive(true) >= ENEMY_RANDOM_SPAWN_MAX) return;

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

        const enemy = new Enemy(this.scene as Game, x, y, this.player);
        enemy.setDepth(10); // Gleiche Tiefe wie Spieler
        this.enemies.add(enemy);
        this.enemiesBody.add(enemy.sprite);
    }

    update() {
        for (const spawnLocation of this.spawnLocations.values()) {
            if (
                Phaser.Math.Distance.BetweenPoints(
                    { x: this.player.x, y: this.player.y },
                    { x: spawnLocation.x, y: spawnLocation.y }
                ) < 100 && this.activeSpawns.indexOf(spawnLocation) === -1
            ) {
                this.activeSpawns.push(spawnLocation);
                console.log('Spawnpoint activated: ', spawnLocation);
            }
        }
    }
}
