# ADR 0006: Unified Three-Pane Workspace Control Center (aquablue SaaS Rebuild)

* **Status**: Accepted
* **Date**: 2026-06-07

## Context
Originally, the platform separated the Applets grid dashboard (`/dashboard`) and the interactive agent chat console (`/chat`) into two distinct routes. Additionally, the default locale was hardcoded to Chinese (`zh-CN`), and the public page layout unnecessarily wrapped all public visitor pages inside the developer sidebar workspace shell.

For the Tokyo Hackathon (June 27th) and the newly rebranded **aquablue SaaS service**, we need:
1. A highly polished, classic SaaS landing page and "About Us" page explaining our Tokyo team's mission.
2. A streamlined demo authentication flow to showcase the SaaS experience without setting up complex database user seeds.
3. An integrated, professional, IDE-like three-pane workspace to minimize route navigation friction and maximize visual polish.

## Decision
We decided to restructure the routing, layouts, and workspace pages into a consolidated design:

1. **Workspace Consolidation (合二为一)**: 
   - We merge `/chat` and `/dashboard` into a single, unified three-pane workspace at `/dashboard`.
   - **Left pane**: Navigation, historical agent sessions, and active credentials panel drawer.
   - **Center pane**: Applets grid by default (Management state). When "New Chat" is clicked, it dynamically transitions to the AI chatbot panel (Development state). When an applet runs, it slides up an embedded log terminal at the bottom of the center pane.
   - **Right pane**: Dynamic subagent activity stream and generated code artifacts/diff comparisons. The right pane supports collapse/expand toggling and defaults to showing "Recent Runs / Quick Stats" when not in active chat.
2. **SaasPublicLayout Isolation**:
   - We extract a new `SaasPublicLayout` containing a clean Header (with Theme Toggle, Language Selector, and "Sign In" button) and Footer (rebranding to *aquablue*).
   - This layout will wrap public visitor pages: Home (`/`), About Us (`/about`), and Login (`/login`).
3. **i18n Reconfiguration**:
   - Change `defaultLocale` from `'zh-CN'` to `'en'`.
   - Clean up remaining "Japan restaurant finder" texts and inject unified bilingual strings (EN, JA, ZH-CN) for the hackathon team introduction.
4. **Demo Authentication Guard**:
   - Create a simulated `/login` page prefilled with `test` / `test234` credentials.
   - Upon clicking "Sign In", write a mock cookie (`auth_session=demo_logged_in`) and protect the `/dashboard` route using a `beforeLoad` redirection guard.

## Consequences

### Positive (Pros)
- **High-Fidelity Visuals**: A VS Code-style workspace with an embedded bottom terminal looks significantly more polished and professional for live demo presentations.
- **Improved UX Flow**: Consolidating management (Applets) and development (AI Chat) reduces page reloads and maintains query state.
- **Proper Public/Private Separation**: The landing page feels like a genuine SaaS platform rather than a developer admin panel.
- **Hackathon-Ready Multilingual Support**: Prioritizes English by default while offering high-quality Japanese and Chinese localizations for Shinjuku judges.

### Negative (Cons)
- **State Complexity**: Managing the transition between "Management State" and "Development State" inside a single page component increases local state management complexity.
