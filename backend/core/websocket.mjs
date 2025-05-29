const init_WS = (ws, game) => {
    if (game.Players.length >= 4 || game.isStart) {
        ws.send(JSON.stringify({ type: 'system', message: 'game already start' }));
    }

    ws.on('message', (message) => messageListner(ws, message, game));
    ws.on('close', () => game.RemovePlayer(ws))
}

const messageListner = (ws, message, game) => {
    try {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'register':
                if (game.Players.length < 4 && data.name) {
                    const err = game.RegisterPlayer(ws, data.name);
                    if (err) {
                        ws.send(JSON.stringify({ type: 'error', message: 'register 409', error: err }));
                    } else {
                        ws.send(JSON.stringify({ type: 'system', message: 'register 200', name: data.name }));
                    }
                }
                break;

            case 'message':
                game.BrodcastMessage(data)
                break;

            case 'game':
                const player = game.Players.find(player => player.Conn == ws)

                if (data.state === 'getMap') {
                    if (!game.gameMap) {
                        console.log('creation');

                        game.createMap();
                    }
                    player.send({ type: 'system', state: 'map', data: game.gameMap });

                    // Set blocked areas for the player right after sending map
                    if (game.mapInstance) {
                        player.setBlockedArea(game.mapInstance.calculateBlockedAreas());
                    }
                } else if (data.state === 'map') {
                    game.mapInstance.setBlockArea(data.data)
                } else if (data.state === 'starting_point') {
                    game.mapInstance.setStartingPositions(data.data)
                } else if (data.event === 'move right' || data.event === 'move left' ||
                    data.event === 'move up' || data.event === 'move down' ||
                    data.event === 'bomb') {
                    game.movePlayer(data, ws)
                }
                break;
        }
    } catch (e) {
        console.log('error: ', e);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
    }
}

export { init_WS };