import { Scene } from "phaser";
import { DebugController } from "../DebugController";
import { Enemy } from "../Enemy";
import { EnemySpawner } from "../EnemySpawner";
import { EventBus } from "../EventBus";
import { GameMap } from "../GameMap";
import { KeyboardController } from "../KeboardController";
import { Player } from "../Player";
import { ScreenSetup } from "../ScreenSetup";
import { ShootingController } from "../ShootingController";
import { SoundController } from "../SoundController";
import { TouchController } from "../TouchController";

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
    touchController: TouchController;
    soundController: SoundController;
    enemiesBody: Phaser.Physics.Arcade.Group;
    fontTest: Phaser.GameObjects.BitmapText;

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

        this.keyboardController = new KeyboardController(this, this.player);
        this.touchController = new TouchController(this, this.player);
        // Auch für Gegner und Projektile
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
        });
        this.enemiesBody = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
        });

        this.enemies.setDepth(10);

        // ShootingController initialisieren
        this.shootingController = new ShootingController(this);
        
        // Kollisionen einrichten
        this.shootingController.setupCollisions(this.player, this.enemiesBody);

        // Kamera folgt dem Spieler in der Mitte des Bildschirms
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setFollowOffset(0, 0);

        // Gegner-Spawner initialisieren
        this.enemySpawner = new EnemySpawner(this, this.player, this.enemies, this.enemiesBody);

        this.soundController = new SoundController(this);

        // Erste Chunks um Spieler laden
        this.gameMap.updateChunks(this.player);

        // Debug Controller initialisieren
        this.debugController = new DebugController(this);

        // Rest des Codes wie zuvor
        EventBus.emit("current-scene-ready", this);


        // const config = {
        //     image: 'font',
        //     width: 8,
        //     height: 8,
        //     chars: Phaser.GameObjects.RetroFont.TEXT_SET3,
        //     charsPerRow: 13,
        //     spacing: { x: 0, y: 0 }
        // } as unknown as Phaser.Types.GameObjects.BitmapText.RetroFontConfig;

        // this.cache.bitmapFont.add('font', Phaser.GameObjects.RetroFont.Parse(this, config));

        // this.fontTest = this.add.bitmapText(0, 0, 'font', 'WHO DARES WINS');

        // this.fontTest.setScale(1);
        // this.fontTest.setDepth(1000000000000);

    }

    update(time: number, delta: number) {
        this.enemies.getChildren().forEach((enemy) => {
            (enemy as Enemy).update(time, delta);
        });
        this.player.update();
        this.gameMap.updateChunks(this.player);
        this.enemySpawner.update();
       // this.fontTest.setPosition(this.cameras.main.scrollX + this.screenSetup.getVirtualWidth()/2 - this.fontTest.width/2, this.cameras.main.scrollY + this.screenSetup.getVirtualHeight()/2);
    }

    destroy() {
        this.gameMap.destroy();
        this.debugController.destroy();
        if (this.touchController) {
            this.touchController.cleanup();
        }
        this.soundController.cleanup();
    }
}
