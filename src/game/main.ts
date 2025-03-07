import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Types } from 'phaser';

// Debug-Konfiguration als globale Variable
export const DEBUG_CONFIG = {
    showDebugBoxes: true  // Standard: ausgeschaltet
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
            debug: DEBUG_CONFIG.showDebugBoxes,
            debugBodyColor: 0x9900ff  // Lila Farbe für Debug-Boxen
        }
    },
    scene: [
        MainGame
    ]
};

const StartGame = (parent) => {
    return new Game({ ...config, parent });
}

export default StartGame;

