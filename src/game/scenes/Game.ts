import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../player";
import { Enemy } from "../enemy";
import { GameMap } from "../GameMap";
import { EnemySpawner } from "../EnemySpawner";
import { ShootingController } from "../ShootingController";
import { DebugController } from "../DebugController";

export class Game extends Scene {
    private player: Player;
    private enemies: Phaser.Physics.Arcade.Group;
    private gameMap: any;
    private enemySpawner: EnemySpawner;
    private shootingController: ShootingController;
    private debugController: DebugController;

    constructor() {
        super("Game");
    }

    create() {
        // Definiere virtuelle Größe
        const virtualWidth = 304;
        const virtualHeight = 192;

        // Konfiguriere die Kamera für "Pixelart"-Look
        this.cameras.main.setSize(virtualWidth, virtualHeight);

        // Skaliere die Kamera um die Browserhöhe auszunutzen
        const scale = window.innerHeight / virtualHeight;

        // Setze den Zoom so, dass das Bild die Browserhöhe ausfüllt
        this.cameras.main.setZoom(1); // Zurücksetzen, falls vorher geändert wurde

        // Scale Manager konfigurieren
        this.scale.setGameSize(virtualWidth, virtualHeight);
        this.scale.setZoom(scale);

        // Zentriere das Spiel im Browser
        this.scale.autoCenter = Phaser.Scale.CENTER_BOTH;

        // Anpassen beim Ändern der Fenstergröße
        window.addEventListener("resize", () => {
            const newScale = window.innerHeight / virtualHeight;
            this.scale.setZoom(newScale);
        });

        // Container für Spieler und Gegner (über der Karte)
        const entityContainer = this.add.container(0, 0);
        entityContainer.setDepth(1);

        this.gameMap = new GameMap(this);

        const { startX, startY } = this.gameMap.getPlayerStartPosition();
        this.player = new Player(this, startX, startY);

        
        // Auch für Gegner und Projektile
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
        });
        this.enemies.setDepth(10);

        // ShootingController initialisieren
        this.shootingController = new ShootingController(this);

        // Kollisionen einrichten
        this.physics.add.collider(
            this.shootingController.getBullets(),
            this.enemies,
            (object1, object2) => {
                const bullet = object1 as Phaser.Physics.Arcade.Image;
                const enemy = object2 as Phaser.Physics.Arcade.Sprite;
                this.handleBulletEnemyCollision(bullet, enemy);
            },
            undefined,
            this
        );

        // Kollision zwischen Feindkugeln und Spieler einrichten
        this.physics.add.collider(
            this.shootingController.getEnemyBullets(),
            this.player,
            (object1, object2) => {
                const bullet = object1 as Phaser.Physics.Arcade.Image;
                const player = object2 as Player;
                this.handleEnemyBulletPlayerCollision(bullet, player);
            },
            undefined,
            this
        );

        // Kamera folgt dem Spieler in der Mitte des Bildschirms
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setFollowOffset(0, 0);

        // Schießen mit Leertaste
        this.input.keyboard!.on("keydown-SPACE", () => {
            this.shoot();
        });

        // Gegner-Spawner initialisieren
        this.enemySpawner = new EnemySpawner(this, this.player, this.enemies);

        // Gegner spawnen
        this.time.addEvent({
            delay: 2000,
            callback: this.enemySpawner.spawnEnemy,
            callbackScope: this.enemySpawner,
            loop: true,
        });

        // Erste Chunks um Spieler laden
        this.gameMap.updateChunks(this.player);

        // Debug Controller initialisieren
        this.debugController = new DebugController(this);

        // Rest des Codes wie zuvor
        EventBus.emit("current-scene-ready", this);
    }

    update() {
        this.player.update();

        // Prüfen, ob neue Chunks geladen werden müssen
        this.gameMap.updateChunks(this.player);
    }

    private shoot() {
        this.shootingController.shoot(
            this.player,
            'enemy',
            this.player.currentDirectionX,
            this.player.currentDirectionY
        );
    }

    private handleBulletEnemyCollision(
        bullet: Phaser.Physics.Arcade.Image,
        enemy: Enemy
    ) {
        bullet.destroy();
        enemy.die();
    }

    // Neue Methode für Feindkugel-Spieler-Kollision
    private handleEnemyBulletPlayerCollision(
        player: Player,
        bullet: Phaser.Physics.Arcade.Image
    ) {
        bullet.destroy();
        player.die(); //Spieler töten
    }

    public enemyShoot(enemy: Enemy) {
        this.shootingController.shoot(
            enemy,
            'player',
            enemy.currentDirectionX,
            enemy.currentDirectionY
        );
    }

    // Optional: Cleanup im destroy
    destroy() {
        // Chunks aufräumen
        for (const layer of this.activeChunks.values()) {
            layer.destroy();
        }
        this.activeChunks.clear();
        this.loadedChunks.clear();

        // Animationen NICHT löschen beim Destroy

        // Debug Controller aufräumen
        this.debugController.destroy();

        super.destroy();
    }
}
