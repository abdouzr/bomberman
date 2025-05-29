import { __V_Dom } from "./virtual_dom.mjs";

const __V_Server = {
    PrevApp: new Map(),
    PrevUrl: '',
};

const loadPage = async (path) => {
    try {
        const res = await fetch(`/api${path}`);
        let data = '';
        if (res.status === 404) {
            data = '/src/404.mjs'
        } else {
            data = await res.text();
        }

        const { default: compoGenerator } = await import(`${data}`);
        const serverApp = compoGenerator(__V_Server.PrevApp.get(path));

        const container = document.getElementById('app')
        if (serverApp && serverApp !== null) {
            container.innerHTML = serverApp.renderToString();
            serverApp.render(container);
            __V_Server.PrevApp.set(path, serverApp)
        }
    } catch (error) {
        console.error(`Error from loading page ${path} :`, error)
    }
}

const navigate = async (e) => {
    e.preventDefault();
    __V_Server.PrevUrl = location.pathname;
    const path = e.target.getAttribute('href');
    history.pushState({}, '', path);
    await loadPage(path);
    document.querySelectorAll('a[data-link]').forEach(link =>
        link.addEventListener('click', navigate)
    );
}

document.addEventListener('DOMContentLoaded', async () => {
    window.addEventListener('popstate', (e) => loadPage(location.pathname));
    await loadPage(location.pathname);
    document.querySelectorAll('a[data-link]').forEach(link =>
        link.addEventListener('click', navigate)
    );
});

export { __V_Server, navigate };