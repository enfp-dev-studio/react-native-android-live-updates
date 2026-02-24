# Contributing

Contributions are welcome. Please read the [code of conduct](./CODE_OF_CONDUCT.md) before contributing.

## Development workflow

This project is a monorepo managed with [Yarn workspaces](https://yarnpkg.com/features/workspaces):

- Library source in the root directory
- Example app in `example/`

Install dependencies:

```sh
yarn
```

The example app uses the local version of the library. JavaScript changes are reflected immediately; native code changes require a rebuild.

To edit Kotlin files, open `example/android` in Android Studio. The library sources are listed under `react-native-android-live-updates` in the Android project view.

### Common commands

```sh
yarn example start       # start Metro
yarn example android     # run example on Android
yarn typecheck           # TypeScript check
yarn lint                # lint
yarn lint --fix          # fix lint errors
yarn test                # unit tests
```

### Commit message convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/en):

- `fix` — bug fix
- `feat` — new feature
- `refactor` — refactor
- `docs` — documentation
- `test` — tests
- `chore` — tooling / CI

### Sending a pull request

- Keep pull requests focused on a single change.
- Verify that linting and tests pass before opening a PR.
- For API or implementation changes, open an issue to discuss first.

### Publishing

```sh
yarn release
```
