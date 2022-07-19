# headless-electron

> Run scripts from node in an Electron pool

[![Build Status](https://github.com/marcello3d/headless-electron/workflows/build/badge.svg)](https://github.com/marcello3d/headless-electron/actions)
[![npm](https://img.shields.io/npm/v/headless-electron.svg)](https://www.npmjs.com/package/headless-electron)
[![npm](https://img.shields.io/npm/dm/headless-electron.svg)](https://www.npmjs.com/package/headless-electron)

## Usage

```typescript
const ep = new ElectronProcess();
const result = await ep.runScript({
  pathname: path.resolve(__dirname, "typescript.ts"),
  functionName: "multiply",
  args: [2, 3],
});
await ep.kill();
```

## API

```typescript
interface ElectronProcess {
  constructor(options: {
    debugMode: boolean; // true will show the Electron BrowserWindow for debugging purposes
    concurrency: number; // maximum number of Electron BrowserWindows to create for parallel runs
  });

  runScript(options: {
    pathname: string; // full path to script to require
    functionName?: string; // function name to call, defaults to 'default'
    args?: any[]; // arguments passed to function
  }): Promise<any>; // returns what the function returns
}
```

## Acknowledgements

Based on [jest-electron](https://github.com/hustcc/jest-electron)

## License

MIT
