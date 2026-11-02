# SIDEQUEST web-game skills

Original reusable skills for the proposed React, TypeScript, Vite, and Phaser stack. These repository copies are the versioned source; personal installation copies belong in `$CODEX_HOME/skills`, or `~/.codex/skills` when unset. Editing a repository copy does not automatically update its installed copy.

| Skill | Responsibility | Example invocation |
| --- | --- | --- |
| [phaser-react-game](phaser-react-game/SKILL.md) | Engine host, scene lifecycle, movement/input, responsive camera, DOM bridge | `Use $phaser-react-game to build the village interactions.` |
| [reference-to-game-art](reference-to-game-art/SKILL.md) | Reference decomposition, sprites, Aseprite exports, Tiled map authoring | `Use $reference-to-game-art to prepare this illustration for a playable world.` |
| [react-game-commerce](react-game-commerce/SKILL.md) | Shared catalog/cart, local persistence, recommendations, accessible demo checkout | `Use $react-game-commerce to connect the Market and Shop view to one cart.` |
| [web-game-testing](web-game-testing/SKILL.md) | Targeted Vitest and Playwright verification, canvas checks, visual inspection | `Use $web-game-testing to verify movement, focus, and checkout.` |
| [klaviyo-game-commerce](klaviyo-game-commerce/SKILL.md) | Profiles, events, explicit subscription, retries, and account-side evidence | `Use $klaviyo-game-commerce to implement the requested event integration.` |

Each package includes `SKILL.md`, UI metadata in `agents/openai.yaml`, and selectively loaded references. Automatic selection is left enabled. They can also be invoked by name. No particular state library, deployment provider, paid editor, or game-engine upgrade is required.

The skills are reusable outside SIDEQUEST: product names, prices, event names, and project-specific requirements remain in the application's PRD and implementation. Read only the packages relevant to the task. There is no need to load all five for an ordinary edit.

## Research and maintenance

Researched 2026-11-02 using Context7 for Phaser lifecycle, React external-store subscriptions, and Klaviyo event deduplication. Official documentation supplies engine/template, Aseprite, Tiled, accessibility, Vite, testing, and integration references linked inside each package. [Vercel's React skill on skills.sh](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) was reviewed as a reference for performance concerns; no third-party skill package was copied or installed.

Keep source URLs and consultation dates when updating guidance. Resolve current installed versions before using API examples; these skills intentionally do not pin a reusable instruction to a transient release number. Context7 is useful but optional; official documentation and installed types remain available fallbacks.

## Validation

Validate each package with the skill-creator `scripts/quick_validate.py` tool. Also parse its UI metadata, check the default prompt mentions the correct skill name, and resolve local Markdown reference links. Review scope and instructions against a realistic request: schema validation alone does not establish behavioral quality.

The initial validation covered all five package schemas, UI metadata, internal links, and a manual review of lifecycle, input, state, asset, and integration scenarios. It did not run a generated game, edit a live account, or send messages. Runtime effectiveness should be assessed during actual implementation.

When installing or updating, compare the destination first, preserve unrelated skills, and copy only the reviewed package directories. Verify installed files match their versioned sources.
