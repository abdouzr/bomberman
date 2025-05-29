class GlobalMap {
    constructor(data) {
        this.borns = data;
        this.width = 15;
        this.height = 11;
        this.tileSize = 50;

        this.REWARDS = {
            SPEED: 'speed',
            BOMB: 'bomb',
            RANGE: 'range'
        };

        this.REWARD_CHANCE = 0.4; // 40% chance for rewards
        this.map = this.generateMap();
        this.blockArea = [];
        this.startingPositions = [];
        this.rewards = [];
    }

    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    generateMap() {
        const map = [];
        for (let i = 0; i < this.height; i++) {
            const row = [];
            for (let j = 0; j < this.width; j++) {
                // Border walls
                if (i === 0 || i === this.height - 1 || j === 0 || j === this.width - 1) {
                    row.push({ type: 2, class: 'tile solid' });
                }
                // Checker pattern for solid walls
                else if (i % 2 === 0 && j % 2 === 0) {
                    row.push({ type: 2, class: 'tile solid' });
                }
                // Breakable walls with 80% chance of rewards
                else if (Math.random() < 0.4 && !this.isStartingArea(i, j)) {
                    // Only add reward if random check passes
                    const hasReward = Math.random() < this.REWARD_CHANCE;
                    const rewardType = hasReward ? (
                        Math.random() < 0.33 ? this.REWARDS.SPEED :
                            Math.random() < 0.5 ? this.REWARDS.BOMB :
                                this.REWARDS.RANGE
                    ) : null;

                    row.push({
                        type: 3,
                        class: 'tile breakable',
                        reward: rewardType,
                        hasReward: hasReward
                    });
                }
                // Empty space
                else {
                    row.push({ type: 1, class: 'tile empty' });
                }
            }
            map.push(row);
        }
        return map;
    }

    isStartingArea(row, col) {
        // (top-left, top-right, bottom-left, bottom-right)
        const startingAreas = [
            { row: 1, col: 1 },
            { row: 1, col: this.width - 2 },
            { row: this.height - 2, col: 1 },
            { row: this.height - 2, col: this.width - 2 }
        ];

        return startingAreas.some(area => {
            const rowDiff = Math.abs(area.row - row);
            const colDiff = Math.abs(area.col - col);
            return rowDiff <= 1 && colDiff <= 1;
        });
    }

    getMap() {
        return this.map;
    }

    setBlockArea(blocks) {
        this.blockArea = blocks;
    }

    getStartingPositions() {
        return [
            { x: this.tileSize, y: this.tileSize },
            { x: (this.width - 2) * this.tileSize, y: this.tileSize },
            { x: this.tileSize, y: (this.height - 2) * this.tileSize },
            { x: (this.width - 2) * this.tileSize, y: (this.height - 2) * this.tileSize }
        ];
    }

    setStartingPositions(positions) {
        this.startingPositions = positions;
    }

    calculateBlockedAreas() {
        const blockedArea = [];

        // Generate blocked areas from the game map
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const tile = this.map[row][col];
                if (tile.type === 2 || tile.type === 3) { // solid or breakable walls
                    const relativeRect = {
                        minX: col * this.tileSize,
                        minY: row * this.tileSize,
                        maxX: (col + 1) * this.tileSize,
                        maxY: (row + 1) * this.tileSize,
                        type: tile.type === 2 ? 'solid' : 'breakable',
                        gridPos: { row, col }
                    };
                    blockedArea.push(relativeRect);
                }
            }
        }

        return blockedArea;
    }
}

export { GlobalMap };