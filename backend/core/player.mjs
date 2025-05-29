import { GlobalMap } from './map.mjs';

class Player {
    constructor(game, conn, name) {
        this.game = game;
        this.Conn = conn;
        this.UserName = name;
        this.id;

        this.Lives = 3;
        this.speed = 5; // Reduced speed for more precise movement
        this.blockedArea;
        this.x = 0;
        this.y = 0;

        // Player dimensions from CSS
        this.width = 15;
        this.height = 30;
        this.COLLISION_MARGIN = 1; // Smaller margin for tighter collision detection

        // Add bomb properties
        this.bombCooldown = false;
        this.bombCooldownTime = 2000; // 2 seconds between bomb drops
        this.explosionRadius = 1; // Number of tiles in each direction

        // Base stats
        this.maxBombs = 1;
        this.activeBombs = 0;
        this.bombsAvailable = 1; // Track currently available bombs

        // Power-up properties
        this.baseSpeed = 5;
        this.maxSpeed = 10;
        this.baseBombs = 1;
        this.speedBoostDuration = 10000; // 10 seconds
        this.bombCapacityDuration = 15000; // 15 seconds

        // Add base explosion radius and max values
        this.baseExplosionRadius = 1;
        this.maxExplosionRadius = 2;
        this.explosionRadius = this.baseExplosionRadius;
        this.rangeBoostDuration = 20000; // 20 seconds
    }

    send(data) {
        this.Conn.send(JSON.stringify(data))
    }

    setUpPlayers() {
        const numberToWord = ["one", "two", "three", "four"];
        const startingPositions = this.game.mapInstance ? this.game.mapInstance.getStartingPositions() : [];

        const allPlayers = [];
        for (let [num, player] of this.game.Players.entries()) {
            if (player === this) {
                this.id = numberToWord[num];
                // Center the player in the starting tile
                const position = startingPositions[num] || { x: 0, y: 0 };
                this.x = position.x + (50 - this.width) / 2; // 50 is tile size from map object class
                this.y = position.y + (50 - this.height) / 2;
            }
            allPlayers.push({
                id: numberToWord[num],
                name: player.UserName,
                position: startingPositions[num] ? {
                    x: startingPositions[num].x + (50 - this.width) / 2,
                    y: startingPositions[num].y + (50 - this.height) / 2
                } : { x: 0, y: 0 }
            });
        }
        this.send({ type: 'system', state: 'get ready', data: allPlayers });
        this.game.updatePlayersPosition()
    }

    setUpStartingPoint(data) {
        this.startingPoint = data;
    }

    setBlockedArea(blocks) {
        this.blockedArea = blocks;
    }

    isSafeMove(newX, newY) {
        if (!Array.isArray(this.blockedArea)) {
            return false;
        }

        const playerBox = {
            minX: Math.round(newX),
            minY: Math.round(newY),
            maxX: Math.round(newX + this.width),
            maxY: Math.round(newY + this.height)
        };

        const tileSize = 50;
        const playerGridPos = {
            row: Math.floor(newY / tileSize),
            col: Math.floor(newX / tileSize)
        };

        // Check collision with any wall
        for (const block of this.blockedArea) {
            // First check grid 
            const gridDiffRow = Math.abs(block.gridPos.row - playerGridPos.row);
            const gridDiffCol = Math.abs(block.gridPos.col - playerGridPos.col);

            // If too far in grid coordinates
            if (gridDiffRow > 1 || gridDiffCol > 1) {
                continue;
            }

            // Precise collision
            const COLLISION_TOLERANCE = 1;
            if (playerBox.maxX > block.minX + COLLISION_TOLERANCE &&
                playerBox.minX < block.maxX - COLLISION_TOLERANCE &&
                playerBox.maxY > block.minY + COLLISION_TOLERANCE &&
                playerBox.minY < block.maxY - COLLISION_TOLERANCE) {

                return false;
            }
        }

        // Also check game boundaries
        const maxX = 15 * tileSize - this.width;  // 15 is map width
        const maxY = 11 * tileSize - this.height; // 11 is map height

        if (newX < 0 || newX > maxX || newY < 0 || newY > maxY) {
            return false;
        }

        return true;
    }

    moveUp() {
        const newY = Math.round(this.y - this.speed);
        if (this.isSafeMove(this.x, newY)) {
            this.y = newY;
            this.game.updatePlayersPosition();
        }
    }

    moveDown() {
        const newY = Math.round(this.y + this.speed);
        if (this.isSafeMove(this.x, newY)) {
            this.y = newY;
            this.game.updatePlayersPosition();
        }
    }

    moveLeft() {
        const newX = Math.round(this.x - this.speed);
        if (this.isSafeMove(newX, this.y)) {
            this.x = newX;
            this.game.updatePlayersPosition();
        }
    }

    moveRight() {
        const newX = Math.round(this.x + this.speed);
        if (this.isSafeMove(newX, this.y)) {
            this.x = newX;
            this.game.updatePlayersPosition();
        }
    }

    placeBomb() {
        // Check if we have any bombs available to place
        if (this.activeBombs >= this.bombsAvailable) {
            return false;
        }

        // Get current tile position
        const tileSize = 50;
        const currentTile = {
            row: Math.floor((this.y + this.height / 2) / tileSize),
            col: Math.floor((this.x + this.width / 2) / tileSize)
        };

        // Increment active bombs
        this.activeBombs++;

        // Tell game to place bomb
        this.game.placeBomb(this, currentTile.row, currentTile.col);
        return true;
    }

    applySpeedBoost() {
        this.speed = this.maxSpeed;
        setTimeout(() => {
            this.speed = this.baseSpeed;
        }, this.speedBoostDuration);
    }

    applyBombCapacityBoost() {
        this.bombsAvailable++; // Increment available bombs

        setTimeout(() => {
            this.bombsAvailable = Math.max(this.baseBombs, this.bombsAvailable - 1);
        }, this.bombCapacityDuration);
    }

    applyRangeBoost() {
        this.explosionRadius = Math.min(this.explosionRadius + 1, this.maxExplosionRadius);

        setTimeout(() => {
            this.explosionRadius = Math.max(this.baseExplosionRadius, this.explosionRadius - 1);
        }, this.rangeBoostDuration);
    }

    bombExploded() {
        this.activeBombs = Math.max(0, this.activeBombs - 1);
    }
}

export { Player };