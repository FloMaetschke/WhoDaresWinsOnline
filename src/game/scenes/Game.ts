import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../Player";
import { Enemy } from "../Enemy";
import { GameMap } from "../GameMap";
import { EnemySpawner } from "../EnemySpawner";
import { ShootingController } from "../ShootingController";
import { DebugController } from "../DebugController";
import { ScreenSetup } from "../ScreenSetup";
import { KeyboardController } from "../KeboardController";

export class Game extends Scene {
    player: Player;
    enemies: Phaser.Physics.Arcade.Group;
    gameMap: GameMap;
    enemySpawner: EnemySpawner;
    shootingController: ShootingController;
    debugController: DebugController;
    screenSetup: ScreenSetup;
    disableKeyboard = false;
    keyboardController: KeyboardController;
    
    constructor() {
        super("Game");
    }

    create() {
        // Bildschirm-Setup initialisieren
        this.screenSetup = new ScreenSetup(this);

        // Container für Spieler und Gegner (über der Karte)
        const entityContainer = this.add.container(0, 0);
        entityContainer.setDepth(1);

        this.gameMap = new GameMap(this);

        const { startX, startY } = this.gameMap.getPlayerStartPosition();
        this.player = new Player(this, startX, startY);

        this.keyboardController = new KeyboardController(this);
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
        this.debugController.destroy();
        this.screenSetup.cleanup(); // Wichtig: Touch-Controls aufräumen
    }
}
