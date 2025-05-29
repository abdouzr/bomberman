import { navigate } from "./main.mjs";

const Link = (url, attrs, ref) => {
    return ['a', { ...attrs, 'href': url, 'data-link': null, }, [ref]]
}

const Redirect = (url) => {
    const fakeLink = document.createElement('a');
    fakeLink.setAttribute('href', url);

    navigate({
        target: fakeLink,
        preventDefault: () => { }
    });
}

export { Link, Redirect };