# Dependency maintenance

Prefer official provider SDKs over replacing their behavior with handwritten HTTP requests. They handle provider-specific
request formatting, authentication, retries, and API changes. Retain the official Jira, Resend, Firecrawl, and Snowflake
libraries; reduce dependency overhead through supported upgrades and removal of unused packages.

`axios` and `@octokit/request-error` are declared directly because source files import them. Do not rely on another
package to install an imported dependency transitively.

## Security updates

Run `npm audit`, including development dependencies, after dependency changes. Validate updates with `npm run build`,
`npm run lint`, `npm run prettier-check`, and `npm run jest-test -- --runInBand`.

Zod must remain at version 4.6.7 or later. The schema generator adapts `json-schema-to-zod`'s Zod 3 record and union-error
syntax for Zod 4. Change the generator and regenerate schemas; never edit generated files directly.

Jest 30.5.2 still requires `deepmerge`, whose latest release, 4.3.1, is affected by
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) with no upstream patched release.
The `jest-config` override pins the independent, API-compatible replacement
[`@stackline/deepmerge` 1.1.2](https://github.com/alexandroit/stackline-deepmerge). This replacement is used only by the
development test runner. Its published implementation drops `__proto__` keys from both inputs before assigning them.
Regression tests cover config merging and the reported prototype-poisoning cases. Remove this override when Jest
removes `deepmerge` or adopts an upstream fix.

The existing `glob` and `minimatch` overrides enforce patched versions across their transitive consumers.
