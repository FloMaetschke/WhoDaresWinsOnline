import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../Player";
import { Enemy } from "../Enemy";
import { GameMap } from "../GameMap";
import { EnemySpawner } from "../EnemySpawner";
import { ShootingController } from "../ShootingController";
import { DebugController } from "../DebugController";

export class Game extends Scene {
    player: Player;
    enemies: Phaser.Physics.Arcade.Group;
    gameMap: GameMap;
    enemySpawner: EnemySpawner;
    shootingController: ShootingController;
    debugController: DebugController;

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
        this.shootingController.setupCollisions(this.player, this.enemies);

        // Kamera folgt dem Spieler in der Mitte des Bildschirms
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setFollowOffset(0, 0);

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
        this.gameMap.updateChunks(this.player);
    }

    destroy() {
        this.gameMap.destroy();
        // Debug Controller aufräumen
        this.debugController.destroy();

    }
}
