---
name: nextjs-game-backend
description: Build or debug a Next.js App Router backend and application shell for browser games with React and TypeScript, including client-only Phaser loading, Route Handlers, server-held credentials, integration validation, persistence boundaries, and deployment. Use for full-stack game storefronts; game simulation and asset production belong to their own workflows.
---

# Next.js game application and backend

Use Next.js App Router as the application framework for the game storefront. Keep game simulation in the browser, presentation and navigation in React, and trusted integrations on the server. This skill supplies the application boundary; it does not require a database, authentication system, or payment provider until the product needs one.

## Establish the project shape

Inspect the installed Next.js, React, TypeScript, and Phaser versions, package scripts, router, deployment target, and existing backend. For a new application, start from a compatible Next.js App Router setup and add the browser game host. Adapt examples to existing conventions rather than replacing a functioning project.

Resolve Next.js in Context7 when available and query the specific feature against the installed version. Check official documentation and installed types when results target canary or another major. Do not enable experimental caching or testing APIs merely because a retrieved example uses them.

## Divide responsibility

| Boundary | Responsibility |
| --- | --- |
| Server Components | Server-readable catalog/content and page composition; pass only intended serializable data to clients |
| Client Components | Cart interaction, forms, dialogue, client store subscriptions, and the game host |
| Browser-only game module | Phaser imports, canvas creation, movement, sprites, and scene lifecycle |
| Route Handlers | Explicit HTTP contracts for browser requests, external callbacks, and integration endpoints |
| Server-only services | Credentials, provider clients, trusted validation, and optional durable persistence |

Read [client-boundary.md](references/client-boundary.md) when mounting Phaser, hydrating persisted state, or preserving state across routes. A `'use client'` directive alone does not prevent prerendering. Load browser-dependent engine code through a client-only boundary and keep it out of server-evaluated imports.

Use Route Handlers when the game or an external service needs an HTTP endpoint. Server Actions may suit existing React form workflows, but also require validation and authorization. Server Components should call server data/service functions directly rather than fetching their own application's HTTP endpoints.

## Trusted backend operations

Read [backend-contracts.md](references/backend-contracts.md) before adding integration endpoints, secret configuration, persistent orders, or webhooks.

- Treat each endpoint as public. Validate request size, shape, supported action, and domain constraints. Enforce authentication and ownership for protected operations without making anonymous exploration require an account.
- Keep provider adapters in modules marked `server-only`. Read private configuration through server environment variables; never use `NEXT_PUBLIC_` for credentials or serialize secrets into client props/errors.
- Derive authoritative prices and allowed product IDs on the server for real commerce. A locally persisted cart is a request, not a trusted order record.
- Preserve logical operation identity across retries. Report only the strongest outcome supported by the provider response and any subsequent verification.
- Cache public catalog data deliberately. Keep personal/cart/subscription responses and mutations out of shared caches; verify version-specific defaults instead of assuming an old Next.js caching model.

## Deployment and verification

Dynamic subscription, event, checkout, and webhook endpoints require a server-capable Next.js deployment. Static export alone cannot run these operations. Choose a runtime supported by the provider SDKs; use Node.js for Node-dependent libraries rather than assuming Edge compatibility.

Serverless memory and local files are not durable application storage. Add a database or durable job mechanism only when persistence or delivery requirements justify it. Do not use an unawaited promise as a reliable integration queue; platform lifecycle hooks are also subject to runtime limits.

Verify a production build and start, direct route entry, client-side navigation, engine loading, secret isolation, and the changed endpoint's success/failure behavior. Exercise private-data isolation if caching or account access changed. Unit-test domain functions separately from async Server Component rendering, which should receive browser-level coverage with the supported tooling.

## Sources

Consulted 2026-11-02, including Context7 resolution `/vercel/next.js`. Recheck APIs against installed versions.

- [Backend for frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Client-only loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Environment variables](https://nextjs.org/docs/app/guides/environment-variables)
- [Deployment](https://nextjs.org/docs/app/getting-started/deploying)
- [Vitest with Next.js](https://nextjs.org/docs/app/guides/testing/vitest)
