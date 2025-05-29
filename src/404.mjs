import { Link } from "../dist/hooks.mjs"
import { createComponent } from "../dist/virtual_dom.mjs"

export default () => {
    const not_found = createComponent()

    return not_found.setElements(
        not_found.createElement('div',{style:'text-align: center; padding: 100px;'},[
            not_found.createElement('h1', { style: 'font-size: 4em; margin-bottom: 0.5em;' }, ['404']),
            not_found.createElement('p', { style: 'font-size: 1.5em; margin-bottom: 2em;' }, ['Page not found']),
            not_found.createElement(...Link('/', { style: 'padding: 0.75em 1.5em; color: #fff; background-color:rgb(255, 0, 0); text-decoration: none; border-radius: 5px;' }, 'Go to Homepage'))
        ]),
    )
}