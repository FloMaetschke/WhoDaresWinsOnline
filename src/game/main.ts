import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Types } from 'phaser';

// Debug-Konfiguration als globale Variable
export const DEBUG_CONFIG = {
    showDebugBoxes: false  // Standard: ausgeschaltet
};

const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 304,
    height: 192,
    pixelArt: true,
    parent: 'game-container',
    antialias: false,
    backgroundColor: '#red',
    // scale: {
    //     mode: Phaser.Scale.FIT,
    //     autoCenter: Phaser.Scale.CENTER_BOTH
    // },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 0,
                x: 0
            },
            debug: false,  // Wird dynamisch gesetzt
            debugBodyColor: 0x9900ff  // Lila Farbe für Debug-Boxen
        }
    },
    scene: [
        MainGame
    ]
};

const StartGame = (parent: string) => {
    const gameConfig = { 
        ...config, 
        parent,
        physics: {
            ...config.physics,
            arcade: {
                ...config.physics!.arcade,
                debug: DEBUG_CONFIG.showDebugBoxes
            }
        }
    };
    return new Game(gameConfig);
}

export default StartGame;

