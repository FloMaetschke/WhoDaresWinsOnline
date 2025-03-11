import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { initAnimations } from "../animations";

export class Preload extends Scene {
    constructor() {
        super("Preload");
    }

    preload() {
        // Lade-Anzeige erstellen
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Einfacher Ladebalken
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/4, height/2 - 10, width/2, 20);
        
        // Lade-Text
        const loadingText = this.add.text(width/2, height/2 - 30, 'Laden...', { 
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Progress Event Handler
        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width/4, height/2 - 10, (width/2) * value, 20);
        });

        // Ressourcen laden
        this.load.setPath("assets");
        this.load.atlas("sprites", "sprites.png", "sprites.json");
        this.load.audio("bullet", "audio/shot.wav");
        this.load.audio("enemy_die", "audio/enemy_die.wav");
        this.load.audio("player_die", "audio/player_die.wav");
        this.load.audio("music", "audio/music.mp3");
        this.load.image("tiles", "tileset.png");
        this.load.image("mute", "icons/mute.png");

        this.load.tilemapTiledJSON('tree', 'templates/tree.tmj');
        this.load.tilemapTiledJSON('rock', 'templates/rock.tmj');
    }

    create() {
        // Animationen initialisieren
        initAnimations(this);
        
        // Zur Game-Szene wechseln
        EventBus.emit("loading-complete");
        this.scene.start("Game");
    }

    
}
