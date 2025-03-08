const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 304,
    height: 192,
    pixelArt: true,    // Wichtig für scharfe Pixelgrafiken
    antialias: false,  // Deaktiviere Anti-Aliasing für Pixelkunst
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // Rest der Konfiguration bleibt wie zuvor
    // ...
};

const game = new Phaser.Game(config);
