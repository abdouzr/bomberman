import { createComponent } from "../dist/virtual_dom.mjs";
import { createPlayer } from "./utils/player.mjs";

export default () => {
    const lobby = createComponent();

    const ws = new WebSocket('ws://localhost:3000');
    const player = createPlayer(lobby, ws);

    const newPlayer = (e) => {
        if (e.key === 'Enter' && e.target.value.length > 0 && player.Username === '') {
            const name = e.target.value;
            player.send({ type: 'register', name: name })
            e.target.value = '';
        }
    }

    lobby.useState('_messages', [])
    const sendMessage = (e) => {
        if (e.key === 'Enter' && e.target.value.length > 0) {
            if (player.Conn && player.Username) {
                player.sendMessage(e.target.value)
                e.target.value = ''
            }
        }
    }

    lobby.useState('_onlinePlayer', [])
    lobby.useState('_timer', [])
    lobby.useState('_playerInfo', [])
    lobby.useState('_error', [])

    return lobby.setElements(
        lobby.createElement('div', { class: 'lobby-container' }, [

            // Top Right - Username
            lobby.createElement('section', { id: '_playerInfo', class: 'user-section' }, [
                lobby.createElement('div', { class: 'username-container' }, [
                    lobby.createElement('h2', {}, ['Your Username']),
                    lobby.createElement('input', {
                        type: 'text',
                        class: 'username-input',
                        id: 'username-input',
                        placeholder: 'Enter username',
                        maxlength: 16,
                        onkeydown: newPlayer,
                    }, []),
                    lobby.createElement('h3', { id: '_error', class: 'error' }, [''])
                ]),
            ]),

            // Top Left - Timer & Players
            lobby.createElement('section', { class: 'game-info blur' }, [
                lobby.createElement('div', { class: 'timer-section' }, [
                    lobby.createElement('h2', {}, ['Game Starts In']),
                    lobby.createElement('div', { class: 'timer-display', id: '_timer' }, ['00:00']),
                ]),
                lobby.createElement('div', { class: 'players-section' }, [
                    lobby.createElement('h2', {}, ['Online Players']),
                    lobby.createElement('div', { class: 'player-count', id: '_onlinePlayer' }, ['0']),
                ]),
            ]),

            // Bottom - Chat
            lobby.createElement('section', { class: 'chat-section blur' }, [
                lobby.createElement('div', { class: 'chat-header' }, ['Game Chat']),
                lobby.createElement('div', { id: '_messages', class: 'chat-messages' }, []),
                lobby.createElement('div', { class: 'chat-input-container' }, [
                    lobby.createElement('input', {
                        type: 'text',
                        class: 'chat-input',
                        id: 'chat-input',
                        placeholder: 'Type your message...',
                        onkeydown: sendMessage,
                    }, []),
                ]),
            ])
        ])
    );

}