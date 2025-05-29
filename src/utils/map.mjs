class GameMap {
    constructor(data) {
        this.map = data;
        this.tileSize = 50; // Size of each tile
    }

    generateMap(vdom) {
        return this.map.map((row) =>
            vdom.createElement('div', { class: 'row' },
                row.map((cell) => {
                    return vdom.createElement('div', {
                        class: cell.class,
                    });
                })
            )
        );
    }

    getMapBorns() {
        const gameContainer = document.querySelector('.game');
        if (!gameContainer) {
            console.error('Game container not found');
            return [];
        }

        // Get exact container position including all offsets
        const containerRect = gameContainer.getBoundingClientRect();

        const blockedArea = [];
        const tiles = gameContainer.querySelectorAll('.tile');
        const tileSize = this.tileSize;

        tiles.forEach((tile, index) => {
            if (!tile.classList.contains('solid') && !tile.classList.contains('breakable')) {
                return;
            }

            // Get tile's position in grid
            const row = Math.floor(index / this.map[0].length);
            const col = index % this.map[0].length;

            // Calculate exact pixel coordinates relative to game container
            const tileRect = tile.getBoundingClientRect();
            const relativeX = tileRect.left - containerRect.left;
            const relativeY = tileRect.top - containerRect.top;

            // Create precise boundary box
            const relativeRect = {
                minX: relativeX,
                minY: relativeY,
                maxX: relativeX + tileSize,
                maxY: relativeY + tileSize,
                type: tile.classList.contains('solid') ? 'solid' : 'breakable',
                gridPos: { row, col }
            };

            blockedArea.push(relativeRect);
        });

        return blockedArea;
    }

    // Helper method to convert grid position to pixel coordinates
    gridToPixel(row, col) {
        return {
            x: col * this.tileSize,
            y: row * this.tileSize
        };
    }

    // Helper method to convert pixel coordinates to grid position
    pixelToGrid(x, y) {
        return {
            row: Math.floor(y / this.tileSize),
            col: Math.floor(x / this.tileSize)
        };
    }

    getStartingPoint() {
        const gameContainer = document.querySelector('.game');
        if (!gameContainer) {
            return [];
        }

        // Get exact container position
        const containerRect = gameContainer.getBoundingClientRect();

        const startingPoints = [
            gameContainer.querySelector('.start-point.top-left'),
            gameContainer.querySelector('.start-point.top-right'),
            gameContainer.querySelector('.start-point.bottom-left'),
            gameContainer.querySelector('.start-point.bottom-right')
        ].map(point => {
            if (!point) return null;
            const pointRect = point.getBoundingClientRect();
            return {
                x: pointRect.left - containerRect.left + (pointRect.width - 15) / 2,
                y: pointRect.top - containerRect.top + (pointRect.height - 30) / 2
            };
        }).filter(point => point !== null);

        return startingPoints;
    }

    getMap() {
        return this.map
    }
}

export { GameMap };