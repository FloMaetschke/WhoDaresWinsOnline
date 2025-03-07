import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Types } from 'phaser';

// Debug-Konfiguration als globale Variable
export const DEBUG_CONFIG = {
    showDebugBoxes: false  // Standard: ausgeschaltet
};

const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#red',
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

