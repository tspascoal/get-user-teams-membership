# Project Guidelines

This repository is a JavaScript GitHub Action that queries organization team membership and exposes action outputs.

## Code Style

- Use modern JavaScript with ESM imports and async/await, consistent with [src/index.js](src/index.js).
- Keep behavior explicit and defensive around GitHub API calls; return actionable failures with `setFailed`.
- Do not log tokens or sensitive values.

## GitHub Action Conventions

- Keep metadata and implementation in sync:
  - Input and output names in [action.yml](action.yml) must match usage in [src/index.js](src/index.js).
  - If runtime or entrypoint changes, update both [action.yml](action.yml) and bundled output.
- This action ships bundled code from [dist/index.js](dist/index.js):
  - After changing [src/index.js](src/index.js), run `npm run build` before finishing.
  - Keep the committed bundle updated for release usage.
- Preserve backward-compatible contract unless explicitly changing behavior:
  - Outputs: `teams`, `isTeamMember`.
  - Team matching remains case-insensitive and supports CSV input.
  - If inputs or outputs change, update [README.md](README.md) usage/examples in the same change.

## Build And Validation

- Install deps: `npm ci`
- Build bundle: `npm run build`
- Validate examples and docs are still accurate in [README.md](README.md).

## GitHub Actions Best Practices

- Follow JavaScript action authoring guidance:
  - https://docs.github.com/actions/creating-actions/creating-a-javascript-action
- Keep metadata valid and well documented:
  - https://docs.github.com/actions/creating-actions/metadata-syntax-for-github-actions
- Apply security hardening guidance for workflows and actions:
  - https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- Use official toolkit patterns when interacting with Actions runtime:
  - https://github.com/actions/toolkit
