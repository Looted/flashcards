# Coding workflow

## Running unit tests
Run the unit tests by running `npm run test -- --no-watch --no-progress` command. After code changes, make sure no failures are present. Refer to @https://angular.dev/guide/testing for guidelines on how to test with vitest.
If you wish to run a single suite, use the `--include` flag. Due to a bug, it must be a glob pattern, so replace `.ts` with `.*`, e.g. `npm run test -- --no-watch --no-progress --include=src/app/app.spec.*`.

## Coverage
Make sure the coverage is 100% after adding any new code. Run the coverage using `npm run test -- --coverage --no-watch --no-progress` command.

