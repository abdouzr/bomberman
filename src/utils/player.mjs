import { Redirect } from "../../dist/hooks.mjs";
import { GameMap } from "./map.mjs";

const FPS = 60;
const FRAME_TIME = 1000 / FPS;

class Player_OBJ {
    constructor(root, conn) {
        this.VDOM = root;
        this.Conn = conn;
        this.Username = '';
        
        // Initialize frame timing
        lastFrameTime = 0;
        pendingMessages = [];
        
        this.Conn.addEventListener('message', lobbyListner)
    }

    getPlayer() {
        return {
            user: this.Username,
            conn: this.Conn
        }
    }

    sendMessage(msg) {
        this.Conn.send(JSON.stringify({ type: 'message', message: msg, ...this.getPlayer() }))
    }

    send(data) {
        this.Conn.send(JSON.stringify(data))
    }
}

// next variable shoold be exported only to game.mjs
let Player = {};

const keyPressListener = (e) => {
    e.preventDefault();
    switch (e.key) {
        case 'ArrowRight':
            Player.send({ type: 'game', event: 'move right', data: null })
            break;
        case 'ArrowLeft':
            Player.send({ type: 'game', event: 'move left', data: null })
            break;
        case 'ArrowUp':
            Player.send({ type: 'game', event: 'move up', data: null })
            break;
        case 'ArrowDown':
            Player.send({ type: 'game', event: 'move down', data: null })
            break;
        case ' ':
            Player.send({ type: 'game', event: 'bomb', data: null })
            break;
    }
}

const lobbyListner = (e) => {
    const message = JSON.parse(e.data)
    switch (message.type) {
        case 'system':
            if (message.message === 'register 200') {
                Player.Username = message.name;
                Player.VDOM.elements[0].children[1].removeClass('blur')
                Player.VDOM.elements[0].children[2].removeClass('blur')
                Player.VDOM.setState('_playerInfo', [Player.VDOM.createElement('h1', {}, [`Welcome ${Player.Username} to BOMBERMAN lobby`])])
            }
            if (message.message === 'game start') {
                Redirect('/game')
            }
            if (message.message === 'game already start') {
                Player.VDOM.setState('_playerInfo', [Player.VDOM.createElement('h1', {}, [`One game is already started please try later`])])
            }
            break
        case 'message':
            const prevMsg = Player.VDOM.getState('_messages')
            Player.VDOM.setState('_messages', [
                ...prevMsg,
                Player.VDOM.createElement('div', { class: 'chat-message' }, [
                    Player.VDOM.createElement('span', { class: 'username' }, [`${message.user}:`]),
                    Player.VDOM.createElement('span', { class: 'message' }, [`${message.message}`]),
                ])
            ])
            break
        case 'stats':
            if (message.state === 'online player') {
                Player.VDOM.setState('_onlinePlayer', message.data)
            } else if (message.state === 'lobby countdown') {
                Player.VDOM.setState('_timer', `00:${message.data >= 10 ? message.data : `0${message.data}`}`)
            }
            break;
        case 'error':
            Player.VDOM.setState('_error', message.error)
            break;
    }
}

let lastFrameTime = 0;
let pendingMessages = [];

// Modified gameListner with rAF
const gameListner = (e) => {
    // Queue the message for next frame processing
    pendingMessages.push(JSON.parse(e.data));
    
    // Start the animation frame loop if not already running
    if (pendingMessages.length === 1) {
        requestAnimationFrame(processMessages);
    }
};

const processMessages = (timestamp) => {
    // Calculate delta time since last frame
    const deltaTime = timestamp - lastFrameTime;

    // Only process messages if enough time has passed for next frame
    if (deltaTime >= FRAME_TIME) {
        lastFrameTime = timestamp - (deltaTime % FRAME_TIME);

        // Process all queued messages
        while (pendingMessages.length > 0) {
            const message = pendingMessages.shift();
            processGameMessage(message);
        }
    }

    // Continue the animation loop if there are more messages
    if (pendingMessages.length > 0) {
        requestAnimationFrame(processMessages);
    }
};

// Move the message processing logic to a separate function
const processGameMessage = (message) => {
    switch (message.type) {
        case 'system':
            if (message.state === 'map') {
                const gameMap = new GameMap(message.data);
                Player.VDOM.setState('_map', gameMap.generateMap(Player.VDOM));
                Player.send({ type: 'game', state: 'map', data: gameMap.getMapBorns() });
                Player.send({ type: 'game', state: 'starting_point', data: gameMap.getStartingPoint() });
            }
            if (message.state === 'get ready') {
                Player.VDOM.setState('_players', message.data.map(pl => {
                    return Player.VDOM.createElement('div', { id: `_${pl.id}`, class: `player ${pl.id}`, }, [
                        Player.VDOM.createElement('div', { class: `foot-right` })
                    ]);
                }));
            }
            // player.send({ type: 'system', message: 'game end', status: 'winner' })

            if (message.message === 'game end') {
                Player.VDOM.setState('_timer', 'winner !!!');
                document.removeEventListener('keydown', keyPressListener);
                Player.Conn.removeEventListener('message', gameListner);
                Player.Conn.close();
                setTimeout(() => {
                    location.pathname = '/';
                }, 3000);
            }

            break
        case 'stats':
            if (message.state === 'game countdown') {
                if (message.data === 0) {
                    document.addEventListener('keydown', keyPressListener);
                }
                Player.VDOM.setState('_timer', `00:${message.data >= 10 ? message.data : `0${message.data}`}`);
            }
            break;
        case 'game':
            if (message.state === 'player health') {
                Player.VDOM.setState('_playersInfo', message.data.map(pl => {
                    return Player.VDOM.createElement('div', {
                        class: `player-info ${pl.id}`,
                    }, [
                        Player.VDOM.createElement('span', { class: 'player-name' }, [pl.name || `Player ${pl.id}`]),
                        Player.VDOM.createElement('span', { class: 'player-hearts', id: `hearts_${pl.id}` }, ['❤️❤️❤️']) // Default 3 hearts
                    ])
                }))
            }
            if (message.state === 'position') {
                const playersDom = Player.VDOM.getState('_players')
                for (let plElem of playersDom) {
                    const newposition = message.data.find(pl => plElem.attrs.id === `_${pl.player}`)
                    if (newposition) {
                        plElem.addAttrs('style', `position: absolute; top: ${newposition.y}px; left: ${newposition.x}px;`)
                    }
                }
            }
            if (message.state === 'bomb_placed') {
                // Add bomb to the game
                const bombElement = Player.VDOM.createElement('div', {
                    id: message.data.id,
                    class: 'bomb',
                    style: `position: absolute; top: ${message.data.row * 50}px; left: ${message.data.col * 50}px;`
                }, []);

                const bombs = Player.VDOM.getState('_bombs') || [];
                Player.VDOM.setState('_bombs', [...bombs, bombElement]);
            }
            if (message.state === 'explosion') {
                // Remove the bomb element
                const bombs = Player.VDOM.getState('_bombs') || [];
                Player.VDOM.setState('_bombs', bombs.filter(bomb => bomb.attrs.id !== message.data.id));

                // Create explosion animation
                message.data.tiles.forEach(tile => {
                    const explosionElement = Player.VDOM.createElement('div', {
                        class: 'explosion',
                        style: `position: absolute; top: ${tile.row * 50}px; left: ${tile.col * 50}px;`
                    }, []);

                    const explosions = Player.VDOM.getState('_explosions') || [];
                    Player.VDOM.setState('_explosions', [...explosions, explosionElement]);

                    setTimeout(() => {
                        const currentExplosions = Player.VDOM.getState('_explosions') || [];
                        Player.VDOM.setState('_explosions', currentExplosions.filter(exp => exp !== explosionElement));

                        // Add rewards AFTER explosion animation finishes
                        if (message.data.rewards && message.data.rewards.length > 0) {
                            const rewards = Player.VDOM.getState('_rewards') || [];
                            const newRewards = message.data.rewards
                                .filter(reward => reward.row === tile.row && reward.col === tile.col)
                                .map(reward => {
                                    // Calculate center position for reward
                                    const centerX = (reward.col * 50) + (50 - 20) / 2; // 20 is reward width
                                    const centerY = (reward.row * 50) + (50 - 20) / 2; // 20 is reward height

                                    return Player.VDOM.createElement('div', {
                                        id: `reward-${reward.row}-${reward.col}`,
                                        class: `reward ${reward.type}`,
                                        style: `position: absolute; top: ${centerY}px; left: ${centerX}px;`
                                    }, []);
                                });
                            if (newRewards.length > 0) {
                                Player.VDOM.setState('_rewards', [...rewards, ...newRewards]);
                            }
                        }
                    }, 600); // Wait for explosion animation to finish
                });

                // Update map with destroyed walls
                Player.VDOM.setState('_map', new GameMap(message.data.map).generateMap(Player.VDOM));
            }
            if (message.state === 'reward_collected') {
                // Remove collected reward with fade out animation
                const rewards = Player.VDOM.getState('_rewards') || [];
                const rewardId = `reward-${message.data.row}-${message.data.col}`;
                const rewardToRemove = rewards.find(reward => reward.attrs.id === rewardId);

                if (rewardToRemove) {
                    // First mark the reward as being collected to prevent duplicate collection
                    rewardToRemove.addAttrs('data-collected', 'true');
                    // Add collection animation class
                    rewardToRemove.addAttrs('class', `reward ${message.data.type} collected`);

                    // Remove after animation
                    setTimeout(() => {
                        const currentRewards = Player.VDOM.getState('_rewards') || [];
                        Player.VDOM.setState('_rewards', currentRewards.filter(reward =>
                            reward.attrs.id !== rewardId || !reward.attrs['data-collected']
                        ));
                    }, 300);
                }
            }
            if (message.state === 'player_damaged') {
                const playersInfo = Player.VDOM.getState('_playersInfo')
                const newstates = playersInfo.map(st => {
                    if (st.attrs.class == `player-info ${message.data.playerId}`) {
                        return Player.VDOM.createElement('div', {
                            class: `player-info ${message.data.playerId}`,
                        }, [
                            Player.VDOM.createElement('span', { class: 'player-name' }, [message.data.name || `Player ${message.data.playerId}`]),
                            Player.VDOM.createElement('span', { class: 'player-hearts', id: `hearts_${message.data.playerId}` }, [message.data.livesRemaining == 0 ? '💀' : '❤️'.repeat(message.data.livesRemaining)]) // Default 3 hearts
                        ])
                    } else {
                        return st
                    }
                })
                Player.VDOM.setState('_playersInfo', newstates)

                // remove player from map
                if (message.data.livesRemaining == 0) {
                    const playersDom = Player.VDOM.getState('_players');
                    Player.VDOM.setState('_players',
                        playersDom.filter(player => player.attrs.id !== `_${message.data.playerId}`)
                    );
                }

                if (message.data.name == Player.Username && message.data.livesRemaining == 0) {
                    Player.VDOM.setState('_timer', 'loser !!!')
                    document.removeEventListener('keydown', keyPressListener)
                    Player.Conn.removeEventListener('message', gameListner)
                    Player.Conn.close()
                    setTimeout(() => {
                        location.pathname = '/'
                    }, 3000)
                }

                const playerElement = Player.VDOM.selectElement(`#_${message.data.playerId}`);
                if (playerElement && playerElement.style) {
                    playerElement.style.animation = 'damage-flash 0.5s';
                    setTimeout(() => {
                        playerElement.style.animation = '';
                    }, 500);
                }
            }
            if (message.state === 'player_eliminated') {
                // Remove the player element
                const playersDom = Player.VDOM.getState('_players');
                Player.VDOM.setState('_players',
                    playersDom.filter(player => player.attrs.id !== `_${message.data.playerId}`)
                );
            }
            break;
    }
}


const createPlayer = (root, conn) => {
    Player = new Player_OBJ(root, conn)
    return Player
}

export { createPlayer, Player, lobbyListner, gameListner };