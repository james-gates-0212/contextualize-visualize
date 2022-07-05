# Contextualize Visualization Library

This project contains a Node.js library [Node.js](https://nodejs.org) that is used to generate common visualizations for data. The predominantly used packages are [D3](https://d3js.org/) and [Three.js](https://threejs.org/).
The contributors to this project are listed [here](./CONTRIBUTING.md). The documentation for this library is hosted [here](https://contextualize.gitlab.io/contextualize-visualize).

## System Requirements
You should have a version of [Node.js](https://nodejs.org/en/download/) that is at least 17.0. You can check what your active version of Node.js is by running
```bash
node --version
```

Once you have Node.js installed, you should install the required and development packages using
```bash
npm install
```
in the root directory of the project.

## Contribution Guidelines
The following are guidelines for how code should be contributed to this project.
- [Commitizen-friendly](https://github.com/commitizen/cz-cli) commit messages should always be used.
- Before code is submitted, [Prettier](https://prettier.io/) should be used to format code. We suggest using the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
- Code versions should be bumped before pushing changes into `main` according to [Semantic Versioning](https://semver.org/) guidelines.

## Commands
The following commands are available for running, testing, and packaging the project.

-   ```bash
    npm run rollup
    ```
    packages the project as both a CommonJS and ECMAScript modules. The packaged files are contained in `dist/cjs` and `dist/esm` respectively. The package contains type declarations embedded within so dependents do not need to install a `@types` module.

-   ```bash
    npm run test
    ```
    tests the package by automatically running any file that has a name matching `*.test.ts`. Jest is the unit testing suite and is configured to use the JSDOM environment. This allows tests to construct a virtual DOM for testing.

-   ```bash
    npm run storybook-serve
    ```
    runs a [Storybook](https://storybook.js.org/) server on port 6006 by default. The Storybook environment should be used to visually test interactions with the visualizations included in this package in addition to standard unit tests.

-   ```bash
    npm run storybook-build
    ```
    compiles a static version of [Storybook](https://storybook.js.org/) as a collection of HTML, CSS, and JS that is distributable. By default, these static files are exported to the `public` directory.

## Continuous Deployment
This project is configured to run a continuous deployment pipeline on [GitLab](https://gitlab.com/). This pipeline does the following:
1. Tests that that unit tests run with no errors.
2. Publishes the package to the [GitLab Package Registry](https://docs.gitlab.com/ee/user/packages/package_registry/) if on the `main` branch.
3. Publishes the [Storybook](https://storybook.js.org/) documentation if on the `main` branch.

**It is important that the version of the package in `project.json` is bumped whenever new features are pushed into `main`. Otherwise, the publish stage will fail to update the package registry.**