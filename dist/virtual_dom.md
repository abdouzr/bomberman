# Virtual DOM Implementation `V_Dom`

The `V_Dom` class is a lightweight virtual DOM implementation designed to efficiently manage and update the DOM based on state changes. It provides a simple yet powerful way to synchronize the DOM with a virtual representation, enabling dynamic updates to components.

## Features

- **State Management**: Maintain a virtual representation of the DOM for components.
- **Efficient Updates**: Synchronize the real DOM with the virtual DOM by adding, updating, or removing elements as needed.
- **Error Handling**: Throws descriptive errors when operations fail, such as when a component is not found.

## Example Usage

```javascript

export default () => {
    const myApp = createComponent()
    myApp.useState('_myState', initial_value) // for a good practice make all states start with '_'

    // this methode will sate state and then rerender the V_dom from the key state id in you DOM so make sure if you want to relayted your state to an rerender put the id attribute with the same name of your state in the choosen componant or element
    myApp.setState(key,value) 

    // this methode will return form the V_dom you setted state
    myApp.getState(key) 

    return myApp.setElements([/* put all your __Element*/])
}
```

## Key Method: `reRender`

The `reRender` method is responsible for updating a component in the DOM based on its current state. It ensures that the DOM remains synchronized with the virtual DOM representation.

## Parameters

- **`id_compo`**: A string representing the ID of the component to re-render. This ID should match the `id` attribute of the DOM element representing the component and the stateKey.

## Throws

- **`Error`**: If the component with the specified ID is not found in the DOM.
