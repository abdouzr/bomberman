# `__Element` Class Documentation

- The __Element class represents a virtual DOM element, serving as a lightweight abstraction for creating and managing DOM structures. It handles element attributes, children, and event listeners while providing methods for DOM manipulation and serialization.

## Constructor

- The class is instantiated with:

``` javascript
tag (string|Function): The HTML tag name (e.g., 'div') or a functional component.

attrs (Object, optional): Key-value pairs of element attributes (e.g., { id: 'app', class: 'container' }). Defaults to {}.

children (Array, optional): Child elements, which can be strings (text nodes) or nested __Element instances. Defaults to [].

vdom (Object): The parent virtual DOM instance managing this element.
```

## Key Methods

```javascript

toggleClass(className): Toggles a CSS class (adds if absent, removes if present).
````
addClass(newClass) : Appends a CSS class to the element.
````
removeClass(toRemove): Removes a specified CSS class.

//Attribute Management

addAttrs(key, value): Sets an attribute (value defaults to null for boolean attributes like disabled).
removeAttrs(key): Deletes an attribute from the element.
updateAttrs(): Synchronizes virtual attributes with the actual DOM element (used internally during rendering).

//Event Handling

registerEvent(name, func): Attaches an event listener (e.g., 'click', func) to the element.

//Serialization & Rendering

toJSON(): Returns a JSON representation of the element and its hierarchy.
render(): Generates a live DOM element from the virtual structure.
renderToString(): Outputs the element as an HTML string (useful for SSR or static rendering).
```

## Use Case

- This class is designed for virtual DOM implementations, enabling efficient DOM updates by comparing virtual and real states before applying changes. It supports dynamic UI components, event delegation, and declarative rendering.
