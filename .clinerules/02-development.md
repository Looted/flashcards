# Coding workflow

## Operating system
The code is being developed on Windows 11 using git-bash and git for windows. Please use appropriate commands.

## Running unit tests
Run the unit tests by running `npm run test -- --no-watch --no-progress` command. After code changes, make sure no failures are present. Refer to @https://angular.dev/guide/testing for guidelines on how to test with vitest.
If you wish to run a single suite, use the `--include` flag, e.g. `npm run test -- --no-watch --no-progress --include=src/app/app.spec.ts`, or use a glob pattern.
Important: do not run npx vitests - you need to use Angular CLI's command for tests to work reliably.

## Coverage
Make sure the coverage is 100% after adding any new code. Run the coverage using `npm run test -- --coverage --no-watch --no-progress` command.

