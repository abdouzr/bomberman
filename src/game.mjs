import { Redirect } from "../dist/hooks.mjs";
import { __V_Server } from "../dist/main.mjs";
import { createComponent } from "../dist/virtual_dom.mjs";
import { gameListner, lobbyListner, Player } from "./utils/player.mjs";

export default () => {
    const lobbyData = __V_Server.PrevApp.get('/')
    if (typeof lobbyData === 'undefined') {
        Redirect('/')
        return
    }

    window.addEventListener('resize', (e) => {
        e.preventDefault();
        window.location.pathname = '/';
    });

    let indexColor = 0
    const colors = [
        "#101010", "#111111", "#121212", "#131313", "#141414", "#151515",
        "#161616", "#171717", "#181818", "#191919", "#1a1a1a", "#1b1b1b",
        "#1c1c1c", "#1d1d1d", "#1e1e1e", "#1f1f1f", "#202020",
        "#1f1f1f", "#1e1e1e", "#1d1d1d", "#1c1c1c", "#1b1b1b", "#1a1a1a",
        "#191919", "#181818", "#171717", "#161616", "#151515", "#141414",
        "#131313", "#121212", "#111111", "#101010"
    ];

    const startAnimation = (game) => {
        const element = game.selectElement('.game-background-glow');
        if (element) {
            if (indexColor === colors.length) indexColor = 0;
            element.addAttrs('style', `background-color: ${colors[indexColor]}; `)
            indexColor++;
        }
        requestAnimationFrame(() => startAnimation(game));
    };

    lobbyData.state = new Map()

    Player.Conn.removeEventListener('message', lobbyListner);
    Player.Conn.addEventListener('message', gameListner)

    Player.send({ type: 'game', state: 'getMap' })

    const game = createComponent();
    Player.VDOM = game;

    game.useState('_map', [])
    game.useState('_time', [])
    game.useState('_playersInfo', [])

    game.useState('_players', [])
    game.useState('_bombs', [])
    game.useState('_explosions', [])
    game.useState('_rewards', [])

    setTimeout(() => startAnimation(game), 0);

    return game.setElements(
        game.createElement('div', { class: 'game-background-glow', style: `background: white;` }, []),
        game.createElement('div', { class: 'game-timer' }, [
            game.createElement('h1', { id: '_timer', class: 'game-countdown' }, [''])
        ]),
        game.createElement('div', { id: '_playersInfo', class: 'players-info-panel' }, []),
        game.createElement('div', { class: 'game-wrapper' }, [
            game.createElement('div', { class: 'game-area', style: 'position: relative;' }, [
                game.createElement('div', {
                    id: '_map',
                    class: 'game',
                    style: 'min-width: min-content; min-height: min-content; position: relative;'
                }, []),
                game.createElement('div', {
                    id: '_rewards',
                    class: 'absolut-elements',
                    style: 'position: absolute; top: 0; left: 0;'
                }, []),
                game.createElement('div', {
                    id: '_bombs',
                    class: 'absolut-elements',
                    style: 'position: absolute; top: 0; left: 0;'
                }, []),
                game.createElement('div', {
                    id: '_explosions',
                    class: 'absolut-elements',
                    style: 'position: absolute; top: 0; left: 0;'
                }, []),
                game.createElement('div', {
                    id: '_players',
                    class: 'absolut-elements',
                    style: 'position: absolute; top: 0; left: 0;'
                }, [])
            ])
        ])
    )
}