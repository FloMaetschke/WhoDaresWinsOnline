# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Mobile touch controls with joystick and fire button
- Visual indicators for touch control areas
- Debug mode with hotkey toggle
- New audio assets for projectiles and enemies
- New tileset images
- KeyboardController for input handling
- TouchController for mobile controls
- ScreenSetup for display configuration
- DebugController for debug mode
- ShootingController for shooting mechanics
- EnemySpawner for enemy management
- GameMap with chunk-based level generation using Perlin noise
- Preload scene for resource management
- Player death mechanics and game restart functionality
- Player death sound effects

### Changed
- Optimized joystick positioning and touch areas
- Enhanced screen configuration for mobile devices
- Improved enemy wandering behavior and death animation
- Enhanced collision boxes for player and enemies
- Updated physics speed and collision detection
- Moved animation initialization to separate file
- Optimized player animation logic

### Fixed
- Mobile touch control responsiveness
- Screen scaling on different devices
- Enemy pathfinding issues
- Collision detection accuracy

## [0.1.0] - 2025-03-06

### Added
- Initial project setup with Phaser React template
- Basic game configuration and structure
- Player animations and sprite management
- Enemy class with basic animations
- Wandering logic and chase behavior for enemies
- Basic sprite assets
- GitHub Pages deployment workflow
- Build configuration and deployment scripts
- Tile-based map system
- Basic player movement and animations
- Simple enemy AI

### Infrastructure
- Set up GitHub Pages deployment
- Configured Vite build system
- Established basic project structure
- Added TypeScript configuration

## Notes
- The game is still in early development
- Playable at: https://flomaetschke.github.io/WhoDaresWinsOnline/
