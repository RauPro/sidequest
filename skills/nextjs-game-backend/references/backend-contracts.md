# Backend contracts and runtime behavior

## Endpoints and services

Keep HTTP parsing/response mapping in `app/api/.../route.ts` and reusable business/provider work in server-only modules. Names such as `/api/subscriptions`, `/api/events`, or `/api/checkout` are examples, not endpoints to create before their feature is needed.

For each operation, define accepted methods, input shape, identity/authorization requirements, domain validation, retry behavior, and observable response states. Return useful validation errors without exposing upstream credentials, raw personal payloads, or internal stack traces. Check content type and request size at the appropriate application/hosting layer. Handle malformed JSON as a client error rather than a generic successful response.

Restrict public event endpoints to allowed actions and properties. Apply proportionate abuse limits; an in-memory counter does not provide a shared limit across serverless instances. For cookie-authenticated mutations, use the application's supported CSRF/origin protection and verify ownership on the server. CORS or hiding a button is not authorization. Public subscription endpoints can remain anonymous while enforcing their consent and validation rules.

Server Actions are also mutation entrypoints. Reuse the same server domain validation and authorization rather than trusting their parameters because they originated in a React form.

## Configuration

Use `process.env` in server-only modules for private provider keys. The `server-only` boundary guards accidental client imports but cannot prevent an endpoint from explicitly returning a secret; review response mapping too. Store only non-secret placeholders in environment examples.

Variables prefixed `NEXT_PUBLIC_` are intended for the client and are generally inlined during the build. A public demo/live indicator must agree with server configuration; the server remains authoritative about whether it can perform a live operation. Changing runtime environment variables does not automatically change an already-built public bundle.

Validate required integration configuration when the integration initializes or is invoked. Missing live credentials should produce an explicit unavailable/error state. Demo mode should run without live credentials, and rendering unrelated pages must not send test requests or trigger integration side effects during a build.

## Persistence and external operations

For real checkout, create a server-validated order from allowed products and current prices, and use the payment provider's identity/idempotency mechanism. Confirm success only from verified provider state. For webhooks, verify the provider signature against the expected raw request body before parsing/processing; deduplicate repeated deliveries and enforce valid order-state transitions.

Keep simulation metrics and order state separate from real purchasing. Local browser persistence is sufficient for a demo cart; durable accounts/orders require a server data store. Do not use a module-global map or writable deployment directory as a database.

Await required integration work or use an actual durable queue/outbox when the product promises eventual delivery. A timeout can leave an unknown provider result; retain the original operation ID and reconcile or retry according to that provider's contract. Next.js request-lifecycle helpers do not automatically supply durable retries or exactly-once delivery.

## Hosting and checks

Choose a host that executes the required Next.js server operations. Confirm Node/Edge SDK compatibility, timeouts, connection handling, environment availability, and deployment asset paths. Avoid static export for a self-contained application that needs dynamic POST endpoints. A separately hosted API is a distinct architecture, not a feature a static export provides.

Exercise malformed input, disallowed actions, missing configuration, unauthorized protected access, provider timeout, duplicate submission, and the successful supported outcome. Check that server responses and client bundles contain no private credentials. When caching is involved, test separate visitors so a public cache cannot disclose user data.

Sources: [Next.js backend for frontend](https://nextjs.org/docs/app/guides/backend-for-frontend), [environment variables](https://nextjs.org/docs/app/guides/environment-variables), [deployment](https://nextjs.org/docs/app/getting-started/deploying). Provider signature formats and payment state machines must be verified in the selected provider's documentation at implementation time.
