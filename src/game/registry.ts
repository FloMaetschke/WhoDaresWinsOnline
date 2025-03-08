import { Game as PhaserGame } from 'phaser';

// Globale Spielreferenz
let game: PhaserGame | null = null;

// Initialisierungsstatus
let animationsInitialized = false;

export function setGameInstance(gameInstance: PhaserGame) {
    game = gameInstance;
}

export function getGameInstance(): PhaserGame | null {
    return game;
}

export function isAnimationsInitialized(): boolean {
    return animationsInitialized;
}

export function setAnimationsInitialized(initialized: boolean) {
    animationsInitialized = initialized;
}
