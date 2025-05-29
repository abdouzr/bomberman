import { GlobalMap } from "./map.mjs";
import { Player } from "./player.mjs";

class Game {
    constructor() {
        this.Players = [];
        this.isStart = false;

        this.lobbyWaitingTimeout = null;
        this.lobbyCountInterval = null;
        this.counter = 0;

        this.lobbyCoundown = 20;
        this.gameCountdown = 10;

        this.gameMap = null;
        this.mapInstance = null;
        this.activeBombs = new Map(); // Track active bombs
        this.activeRewards = []; // Track active rewards
    }

    RegisterPlayer(conn, name) {
        if (this.isStart) {
            return 'Game already start'
        }
        for (let player of this.Players) {
            if (player.UserName === name) {
                return 'User already exist'
            }
        }
        const newPlayer = new Player(this, conn, name);
        this.Players.push(newPlayer);
        if (this.Players.length === 2 && this.lobbyWaitingTimeout == null) {
            this.Players.forEach(ply => this.StartCountDown(ply, this.lobbyCoundown))
            this.lobbyWaitingTimeout = setTimeout(this.Start.bind(this), this.lobbyCoundown * 1000)
        }
        if (this.Players.length > 2) {
            this.StartCountDown(newPlayer, this.lobbyCoundown - this.counter)
        }
        if (this.Players.length == 4) {
            clearTimeout(this.lobbyWaitingTimeout)
            clearInterval(this.lobbyCountInterval);
            this.counter = 0;
            this.lobbyWaitingTimeout = null;
            this.Start()
        }
        this.Players.forEach(ply => ply.send({ type: 'stats', state: 'online player', data: this.Players.length }))
    }

    RemovePlayer(conn) {
        const logoutPlayer = this.Players.find((player) => player.Conn == conn)
        this.Players = this.Players.filter((player) => player.Conn != conn)

        if (this.isStart) {
            this.Players.forEach(p => {
                p.send({
                    type: 'game',
                    state: 'player_damaged',
                    data: {
                        name: logoutPlayer?.UserName,
                        playerId: logoutPlayer?.id,
                        livesRemaining: 0
                    }
                });
            });
            if (this.Players.length == 1) {
                this.gameIsDone(this.Players[0])
            }
        } else {
            if (this.Players.length == 1 && this.lobbyWaitingTimeout != null) {
                clearTimeout(this.lobbyWaitingTimeout)
                clearInterval(this.lobbyCountInterval);
                this.counter = 0;
                this.lobbyWaitingTimeout = null;
                this.Players.forEach(ply => ply.send({ type: 'stats', state: 'lobby countdown', data: 0 }))
            }
            this.Players.forEach(ply => ply.send({ type: 'stats', state: 'online player', data: this.Players.length }))
        }
    }

    BrodcastMessage({ user, message }) {
        for (let player of this.Players) {
            player.send({ type: 'message', user: user, message: message });
        }
    }

    Start() {
        if (this.Players.length >= 2) {
            // Create map at game start if not already created
            if (!this.gameMap) {
                this.createMap();
            }

            for (const player of this.Players) {
                player.send({ type: 'system', message: 'game start' });

                this.lobbyWaitingTimeout = null;
                clearTimeout(this.lobbyWaitingTimeout)
                this.lobbyCountInterval = null;
                clearInterval(this.lobbyCountInterval)

                let count = 0
                const id = setInterval((() => {
                    player.send({ type: 'stats', state: 'game countdown', data: this.gameCountdown - count });

                    if (count == (this.gameCountdown / 2).toFixed()) {
                        player.setUpPlayers()
                    }

                    count++;
                    if (count > this.gameCountdown) { // for 10s countdown
                        clearInterval(id)
                        player.send({ type: 'game', message: 'start' });
                        player.send({
                            type: 'game',
                            state: 'player health',
                            data: this.Players.map((pl) => {
                                return {
                                    name: pl.UserName,
                                    lives: pl.Lives,
                                    id: pl.id,
                                }
                            })
                        })
                    }
                }).bind(this), 1000)
            }
            this.isStart = true;
        }
    }

    StartCountDown(player, time) {
        let count = 0;
        const id = setInterval(() => {
            const remaining = time - count;
            player.send({ type: 'stats', state: 'lobby countdown', data: remaining });

            count++;
            this.counter = count
            if (count > time) {
                clearInterval(id);
            }
        }, 1000);
    }

    createMap() {
        this.mapInstance = new GlobalMap();
        this.gameMap = this.mapInstance.getMap();

        const blockedAreas = this.mapInstance.calculateBlockedAreas();
        this.Players.forEach(player => {
            player.setBlockedArea(blockedAreas);
        });
    }

    gameIsDone(winner) {
        winner.send({ type: 'system', message: 'game end', status: 'winner' })
        this.Players = [];
        this.isStart = false;

        this.lobbyWaitingTimeout = null;
        this.lobbyCountInterval = null;
        this.counter = 0;

        this.lobbyCoundown = 20;
        this.gameCountdown = 10;

        this.gameMap = null;
        this.mapInstance = null;
    }

    movePlayer({ event }, ws) {
        const player = this.Players.find(player => player.Conn == ws)
        if (event.endsWith('up')) {
            player.moveUp();
        } else if (event.endsWith('down')) {
            player.moveDown();
        } else if (event.endsWith('left')) {
            player.moveLeft();
        } else if (event.endsWith('right')) {
            player.moveRight();
        } else if (event === 'bomb') {
            player.placeBomb();
        }
    }

    updatePlayersPosition() {
        const playersPosition = this.Players.map(ply => {
            this.checkRewardCollision(ply);
            return { player: ply.id, x: ply.x, y: ply.y };
        });

        for (let player of this.Players) {
            player.send({ type: 'game', state: 'position', data: playersPosition });
        }
    }

    placeBomb(player, row, col) {
        const bombId = `bomb-${Date.now()}`;
        const bomb = {
            id: bombId,
            row: row,
            col: col,
            player: player,
            timer: setTimeout(() => this.explodeBomb(bombId), 3000) // 3 second fuse
        };

        this.activeBombs.set(bombId, bomb);

        this.Players.forEach(p => {
            p.send({
                type: 'game',
                state: 'bomb_placed',
                data: {
                    id: bombId,
                    row: row,
                    col: col
                }
            });
        });
    }

    explodeBomb(bombId) {
        const bomb = this.activeBombs.get(bombId);
        if (!bomb) return;

        const explosionRadius = bomb.player.explosionRadius;
        const affectedTiles = [];
        const newRewards = [];
        const damagedPlayers = new Set();
        const directions = [
            { dr: -1, dc: 0 }, // up
            { dr: 1, dc: 0 },  // down
            { dr: 0, dc: -1 }, // left
            { dr: 0, dc: 1 }   // right
        ];

        const checkPlayerInTile = (row, col) => {
            const tileSize = 50;
            return this.Players.filter(player => {
                const playerCenter = {
                    row: Math.floor((player.y + player.height / 2) / tileSize),
                    col: Math.floor((player.x + player.width / 2) / tileSize)
                };
                return playerCenter.row === row && playerCenter.col === col;
            });
        };

        // Check center tile for players
        const playersInCenter = checkPlayerInTile(bomb.row, bomb.col);
        playersInCenter.forEach(player => damagedPlayers.add(player));

        // Check each direction
        directions.forEach(({ dr, dc }) => {
            for (let i = 1; i <= explosionRadius; i++) {
                const checkRow = bomb.row + (dr * i);
                const checkCol = bomb.col + (dc * i);

                // Skip if out of bounds
                if (checkRow < 0 || checkRow >= this.mapInstance?.height ||
                    checkCol < 0 || checkCol >= this.mapInstance?.width) {
                    break;
                }

                const tile = this.gameMap[checkRow][checkCol];

                // Stop this direction if we hit a solid wall
                if (tile.type === 2) {
                    break;
                }

                // Check for players in this tile
                const playersInTile = checkPlayerInTile(checkRow, checkCol);
                playersInTile.forEach(player => damagedPlayers.add(player));

                // Add to affected tiles and stop this direction if we hit a breakable wall
                if (tile.type === 3) {
                    affectedTiles.push({ row: checkRow, col: checkCol });

                    if (tile.reward) {
                        const reward = {
                            type: tile.reward,
                            row: checkRow,
                            col: checkCol
                        };
                        newRewards.push(reward);
                        this.activeRewards.push(reward);
                    }
                    break;
                }

                // Add empty tile to explosion area
                affectedTiles.push({ row: checkRow, col: checkCol });
            }
        });

        damagedPlayers.forEach(player => {
            player.Lives--;
            this.Players.forEach(p => {
                p.send({
                    type: 'game',
                    state: 'player_damaged',
                    data: {
                        name: player.UserName,
                        playerId: player.id,
                        livesRemaining: player.Lives
                    }
                });
            });

            // Check if player is eliminated
            if (player.Lives <= 0) {
                this.Players.forEach(p => {
                    p.send({
                        type: 'game',
                        state: 'player_eliminated',
                        data: {
                            playerId: player.id,
                            playerName: player.UserName
                        }
                    });
                });

                if (this.Players.length === 1) {
                    const winner = this.Players[0];
                    this.gameIsDone(winner);
                }
            }
        });

        affectedTiles.push({ row: bomb.row, col: bomb.col });

        // Remove bomb
        this.activeBombs.delete(bombId);
        bomb.player.bombExploded();

        // Update and clean map on bomb explosion
        affectedTiles.forEach(({ row, col }) => {
            if (this.gameMap[row][col].type === 3) {
                this.gameMap[row][col] = {
                    type: 1,
                    class: 'tile empty'
                };
            }
        });

        // Recalculate blocked areas after destroying walls
        const newBlockedAreas = this.mapInstance.calculateBlockedAreas();
        this.Players.forEach(player => {
            player.setBlockedArea(newBlockedAreas);
        });

        this.Players.forEach(p => {
            p.send({
                type: 'game',
                state: 'explosion',
                data: {
                    id: bombId,
                    tiles: affectedTiles,
                    rewards: newRewards,
                    map: this.gameMap
                }
            });
        });
    }

    checkRewardCollision(player) {
        const tileSize = 50;
        const playerBounds = {
            minRow: Math.floor(player.y / tileSize),
            maxRow: Math.floor((player.y + player.height) / tileSize),
            minCol: Math.floor(player.x / tileSize),
            maxCol: Math.floor((player.x + player.width) / tileSize)
        };

        const rewardIndex = this.activeRewards.findIndex(r => {
            return r.row >= playerBounds.minRow && r.row <= playerBounds.maxRow &&
                r.col >= playerBounds.minCol && r.col <= playerBounds.maxCol;
        });

        if (rewardIndex !== -1) {
            const reward = this.activeRewards[rewardIndex];
            this.applyReward(player, reward.type);

            // Remove collected reward
            this.activeRewards.splice(rewardIndex, 1);

            this.Players.forEach(p => {
                p.send({
                    type: 'game',
                    state: 'reward_collected',
                    data: {
                        row: reward.row,
                        col: reward.col,
                        type: reward.type,
                        playerId: player.id
                    }
                });
            });
        }
    }

    applyReward(player, rewardType) {
        switch (rewardType) {
            case 'speed':
                player.applySpeedBoost();
                break;
            case 'bomb':
                player.applyBombCapacityBoost();
                break;
            case 'range':
                player.applyRangeBoost();
                break;
        }
    }
}

export { Game };