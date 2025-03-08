import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../player";
import { initAnimations } from "../animations";
import { Enemy } from "../enemy";
// Importiere SimplexNoise für die Terrain-Generation
import { createNoise2D } from "simplex-noise";

export class Game extends Scene {
    private player: Player;
    private bullets: Phaser.Physics.Arcade.Group;
    private enemies: Phaser.Physics.Arcade.Group;
    // Neue Gruppe für Feind-Kugeln
    private enemyBullets: Phaser.Physics.Arcade.Group;
    private mapData: number[][] = [];
    private map: Phaser.Tilemaps.Tilemap;
    
    // Für endlose Map
    private noise: (x: number, y: number) => number;
    private chunkSize = 32; // Größe eines Chunks in Tiles
    private activeChunks: Map<string, Phaser.Tilemaps.TilemapLayer> = new Map();
    private loadedChunks: Set<string> = new Set();

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath("assets");
        this.load.atlas("sprites", "sprites.png", "sprites.json");
        this.load.image("background", "bg.png");
        this.load.audio("bullet", "shot.wav");
        this.load.audio("enemy_die", "enemy_die.wav");
        this.load.audio("player_die", "player_die.wav");
        this.load.audio("music", "music.mp3");

        this.load.image("tiles", "tileset.png");

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
        window.addEventListener('resize', () => {
            const newScale = window.innerHeight / virtualHeight;
            this.scale.setZoom(newScale);
        });

        // Erstelle zuerst einen Container für die Karte
        const mapContainer = this.add.container(0, 0);
        mapContainer.setDepth(0); // Karte im Hintergrund
        
        // Container für Spieler und Gegner (über der Karte)
        const entityContainer = this.add.container(0, 0);
        entityContainer.setDepth(1);
        
        // Spielwelt und Physik-Grenzen setzen (sehr groß für "endlos"-Effekt)
        const worldWidth = 1000000;
        const worldHeight = 1000000;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Simplex-Noise initialisieren - Angepasst für neue API
        this.noise = createNoise2D(Math.random);
        
        // Definiere Tiles-Array für die Map
        const tiles = [4, 5, 6, 7, 8, 9, 13, 14, 64];

        // Leere Basistilemap erstellen
        this.map = this.make.tilemap({
            tileWidth: 8,
            tileHeight: 8,
            width: this.chunkSize,
            height: this.chunkSize
        });
        
        const tileset = this.map.addTilesetImage("tiles");

        // Spieler erstellen und in der Mitte platzieren
        const startX = worldWidth / 2;
        const startY = worldHeight / 2;
        this.player = new Player(this, startX, startY);
        
        // Spieler-Tiefe anpassen, damit er über der Tilemap liegt
        this.player.setDepth(10);
        
        // Auch für Gegner und Projektile
        this.enemies = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
        });
        this.enemies.setDepth(10);
        
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 3,
        });
        this.bullets.setDepth(11); // Projektile über allem

        // Nach der Erstellung der anderen Gruppen
        this.enemyBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 10,
        });
        this.enemyBullets.setDepth(11); // Gleiche Tiefe wie Spieler-Projektile

        // Kamera folgt dem Spieler in der Mitte des Bildschirms
        this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
        this.cameras.main.setFollowOffset(0, 0);

        // Schießen mit Leertaste
        this.input.keyboard!.on("keydown-SPACE", () => {
            this.shoot();
        });

        // Kollisionen einrichten
        this.physics.add.collider(
            this.bullets,
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
            this.enemyBullets,
            this.player,
            (object1, object2) => {
                const bullet = object1 as Phaser.Physics.Arcade.Image;
                const player = object2 as Player;
                this.handleEnemyBulletPlayerCollision(bullet, player);
            },
            undefined,
            this
        );

        // Gegner spawnen
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true,
        });

        initAnimations(this);
        
        // Erste Chunks um Spieler laden
        this.updateChunks();
        
        // Rest des Codes wie zuvor
        EventBus.emit("current-scene-ready", this);

        // Debug-Toggle-Event-Listener hinzufügen
        EventBus.on("toggle-debug", (debugEnabled: boolean) => {
            // Debug-Einstellungen aktualisieren
            const world = this.physics.world;

            // Debug-Modus setzen
            (world as any).drawDebug = debugEnabled;
            (this.game.config.physics.arcade as any).debug = debugEnabled;

            // Wenn Debug deaktiviert wird und Debug-Grafik existiert
            if (!debugEnabled && world.debugGraphic) {
                world.debugGraphic.clear();
                world.debugGraphic.destroy();
                world.debugGraphic = null;
            }

            // Wenn Debug aktiviert wird
            if (debugEnabled) {
                // Alte Debug-Grafik aufräumen falls vorhanden
                if (world.debugGraphic) {
                    world.debugGraphic.clear();
                    world.debugGraphic.destroy();
                    world.debugGraphic = null;
                }
                // Neue Debug-Grafik erstellen
                (world as any).createDebugGraphic();
            }
        });
    }

    update() {
        this.player.update();
        
        // Prüfen, ob neue Chunks geladen werden müssen
        this.updateChunks();
    }

    // Generiert und verwaltet die Chunks um den Spieler herum
    private updateChunks() {
        // Bestimme, in welchem Chunk der Spieler ist
        const playerChunkX = Math.floor(this.player.x / (this.chunkSize * 8));
        const playerChunkY = Math.floor(this.player.y / (this.chunkSize * 8));
        
        // Entferne Chunks, die zu weit entfernt sind
        for (const [key, layer] of this.activeChunks.entries()) {
            const [chunkX, chunkY] = key.split(',').map(Number);
            const distance = Phaser.Math.Distance.Between(
                playerChunkX, playerChunkY, chunkX, chunkY
            );
            
            if (distance > 3) { // Chunks, die zu weit weg sind, entfernen
                layer.destroy();
                this.activeChunks.delete(key);
                // Behalte die Chunk-ID, damit wir wissen, dass wir diesen Chunk schon generiert haben
            }
        }
        
        // Generiere neue Chunks in der Nähe des Spielers
        const renderDistance = 2; // Chunks in jeder Richtung
        
        for (let y = playerChunkY - renderDistance; y <= playerChunkY + renderDistance; y++) {
            for (let x = playerChunkX - renderDistance; x <= playerChunkX + renderDistance; x++) {
                const key = `${x},${y}`;
                
                // Wenn dieser Chunk noch nicht existiert, erstelle ihn
                if (!this.activeChunks.has(key)) {
                    this.createChunk(x, y);
                }
            }
        }
    }
    
    // Erstellt einen einzelnen Tilemap-Chunk an der angegebenen Position
    private createChunk(chunkX: number, chunkY: number) {
        const tiles = [4, 5, 6, 7, 8, 9, 13, 14, 64]; // Deine vordefinierten Tile-Indizes
        const tileScale = 0.02; // Skalierungsfaktor für Perlin Noise (höher = größere Muster)
        
        // Erstelle Layer für den Chunk
        const layer = this.map.createBlankLayer(
            `chunk_${chunkX}_${chunkY}`,
            'tiles',
            chunkX * this.chunkSize * 8,
            chunkY * this.chunkSize * 8,
            this.chunkSize,
            this.chunkSize
        );
        
        // Fülle den Layer mit Tiles basierend auf Perlin Noise
        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                // Berechne globale Position für konsistenten Noise
                const worldX = chunkX * this.chunkSize + x;
                const worldY = chunkY * this.chunkSize + y;
                
                // Generiere Perlin Noise-Wert zwischen 0 und 1
                const noiseValue = this.generateNoiseValue(worldX, worldY, tileScale);
                
                // Wähle einen Tile-Index basierend auf dem Noise-Wert
                const tileIndex = this.getTileFromNoise(noiseValue, tiles);
                
                // Setze den Tile
                layer.putTileAt(tileIndex, x, y);
            }
        }
        
        // Setze explizit die Tiefe des Layers niedriger als die des Spielers
        layer.setDepth(0);
        
        // Speichere den Layer
        this.activeChunks.set(`${chunkX},${chunkY}`, layer);
        this.loadedChunks.add(`${chunkX},${chunkY}`);
    }
    
    // Erzeugt einen Perlin-Noise-Wert für die gegebenen Koordinaten
    private generateNoiseValue(x: number, y: number, scale: number): number {
        // Angepasst an die neue API
        //return (this.noise(x * scale, y * scale) + 1) / 2;
        return (this.noise(x , y ) + 1) / 2;
    }
    
    // Wählt einen Tile basierend auf dem Noise-Wert aus
    private getTileFromNoise(noiseValue: number, tileOptions: number[]): number {
        // Skaliere den Wert auf den Bereich des Arrays
        const index = Math.floor(noiseValue * tileOptions.length);
        return tileOptions[index];
    }

    private shoot() {
        const bullet = this.bullets.get(
            this.player.x,
            this.player.y,
            "sprites",
            "ammo-0"
        );

        let bulletSound = this.sound.add("bullet");
        bulletSound.play();

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.setVelocityX(this.player.currentDirectionX * 150);
            bullet.setVelocityY(this.player.currentDirectionY * 150);

            // Projektil nach 1 Sekunde zerstören
            this.time.delayedCall(1200, () => {
                bullet.destroy();
            });
        }
    }

    private spawnEnemy() {
        if(this.enemies.countActive(true) >= 5) return;

        // Gegner um den Spieler herum spawnen, aber außerhalb des Bildschirms
        const camera = this.cameras.main;
        
        // Zufällige Position am Rand des Sichtfelds der Kamera
        let x, y;
        const side = Phaser.Math.Between(0, 3); // 0: oben, 1: rechts, 2: unten, 3: links
        
        switch(side) {
            case 0: // Oben
                x = Phaser.Math.Between(this.player.x - camera.width/2, this.player.x + camera.width/2);
                y = this.player.y - camera.height/2 - 50; // Etwas außerhalb des Bildschirms
                break;
            case 1: // Rechts
                x = this.player.x + camera.width/2 + 50;
                y = Phaser.Math.Between(this.player.y - camera.height/2, this.player.y + camera.height/2);
                break;
            case 2: // Unten
                x = Phaser.Math.Between(this.player.x - camera.width/2, this.player.x + camera.width/2);
                y = this.player.y + camera.height/2 + 50;
                break;
            case 3: // Links
                x = this.player.x - camera.width/2 - 50;
                y = Phaser.Math.Between(this.player.y - camera.height/2, this.player.y + camera.height/2);
                break;
        }

        const enemy = new Enemy(this, x, y, this.player);
        enemy.setDepth(10); // Gleiche Tiefe wie Spieler
        this.enemies.add(enemy);
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
        bullet: Phaser.Physics.Arcade.Image,
       
    ) {
        bullet.destroy();
        player.die(); //Spieler töten
    }
    
    // Methode für Gegner, damit sie schießen können
    public enemyShoot(enemy: Enemy) {
        const bullet = this.enemyBullets.get(
            enemy.x,
            enemy.y,
            "sprites",
            "ammo-0" // Gleiche Munition wie Spieler verwenden
        );

        const bulletSound = this.sound.add("bullet");
        bulletSound.play();

        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            
            // Die Schussrichtung entspricht der Bewegungsrichtung des Gegners
            const speed = 150;
            
            // Verwende die aktuelle Bewegungsrichtung des Gegners
            bullet.setVelocityX(enemy.currentDirectionX * speed);
            bullet.setVelocityY(enemy.currentDirectionY * speed);

            // Nach 1 Sekunde zerstören
            this.time.delayedCall(1000, () => {
                bullet.destroy();
            });
        }
    }

    // Optional: Cleanup im destroy
    destroy() {
        EventBus.removeListener("toggle-debug");
        super.destroy();
    }
}
