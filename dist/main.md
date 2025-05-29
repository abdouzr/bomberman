# Mini Framework Documentation

This document provides an overview of the `main.mjs` file in the Mini Framework project.

## Purpose

The `main.mjs` file serves as the core entry point for the Mini Framework. It is responsible for initializing and managing the primary framework processes.

## Key Features

- **Initialization**: take page url and fetch it from server using /api/{page} so the server look for {page}.mjs and respond with the componant app.
- **Core Logic**: Implements the main functionality required for the framework so there is 2 type of componant return if it retuen a newcomponant it build it but if it return null it just rerender with modified virtual DOM.
- **SinglePage**: Provides essential methods and utilities for creating single page app using the `Link()` and `Redirect()` Hook from `hooks.mjs` so it keep each event fired a new navigation just load the given href page.

## Usage

To use the `main.mjs` file, import it into your project as follows:

```javascript
import { Link } from './hooks.mjs';

app.createElement(...Link('/about', {}, 'visite About page'));
```

## Notes

- The  `__V_Server` object is where we store the previous visited page and a map of call componant rendred so to apply the caching and reccaling componant, example if you want to made a page or an app render in 2 methodes first it will return the app componant and second you will check if the app is contained in `__V_Server.PrevApp` or there link is visited so you will just get it and modifiet or clean it.

