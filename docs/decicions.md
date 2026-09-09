# Architectural Decisions Log - Frontend Tech Stack Pivot

## Decision 1: Shifting from Next.js/TypeScript to Vite/React (JavaScript)
* **Context:** The initial architectural plan assumed a Next.js App Router setup with TypeScript. To accelerate development across a 6-person team, the stack requires simplification.
* **Decision:** Re-scaffold the frontend using Vite, React, and pure JavaScript (`.jsx`).
* **Reasoning:** The project blueprint mandates "Node, React, Tailwind, Framer Motion," but does not enforce a specific meta-framework like Next.js[cite: 1, 2]. Transitioning to pure JavaScript eliminates TypeScript compilation overhead and interface definition bottlenecks, allowing collaborators to rapidly prototype UI components. Vite replaces Next.js to provide a lighter, faster local development server that is strictly optimized for Single Page Applications (SPAs).

## Decision 2: Centralized API Client Abstraction
* **Context:** Multiple frontend developers will be writing HTTP calls to the FastAPI orchestrator simultaneously.
* **Decision:** Isolate all backend communication into a single `api/client.js` utility file.
* **Reasoning:** Decentralizing `fetch` calls across various `.jsx` components introduces severe technical debt and risk of URL mismatches. Centralizing the Axios/Fetch logic ensures the FastAPI base URL, CORS headers, and error-handling interceptors are uniformly applied across the entire dashboard.

# Architectural Decisions Log - UI Architecture & Scope Management

## Decision 3: Rejecting the Top Navbar Migration
* **Context:** A proposal was made to replace the persistent side navigation bar with a top-aligned navbar containing descriptive routing buttons for MRPL compliance.
* **Decision:** Reject the top navbar. Enforce the implementation of a side navigation bar, optionally adding collapsible state logic for UI cleanliness.
* **Reasoning:** The execution blueprint explicitly mandates a sidebar to house 8 specific operational panels (Dashboard, Documents, AI Jobs, etc.)[cite: 1, 2]. A top navbar lacks the horizontal spatial capacity to cleanly display 8 distinct enterprise routing buttons without severe clutter. A collapsible sidebar satisfies both the blueprint's literal requirement and the desire for a formal, unobtrusive corporate interface.

## Decision 4: Elimination of Non-Functional Static Pages
* **Context:** A proposal was made to develop an "About Us" page to explain the project to stakeholders.
* **Decision:** Cut the feature immediately to prevent scope creep.
* **Reasoning:** The 6-day SIH execution plan is strictly gated by technical validation criteria (RAG pipelines, air-gapped network proofs, DOCX generation)[cite: 1, 2]. Static informational pages do not contribute to the core agentic workflow. All development velocity must remain focused on P0 (must-have) operational features.

# Architectural Decisions Log - Frontend Shell Initialization

## Decision 5: Cross-Origin Resource Sharing (CORS) Strategy
* **Context:** The Vite development server (`localhost:5173`) requires permission to dispatch HTTP POST requests to the FastAPI gateway (`localhost:8000`).
* **Decision:** Inject `CORSMiddleware` into the FastAPI root, explicitly whitelisting the local Vite execution ports.
* **Reasoning:** Modern browsers strictly enforce the Same-Origin Policy. Without explicit CORS headers from the FastAPI backend, the React `fetch` or `axios` preflight `OPTIONS` requests will fail, instantly severing the UI from the orchestration layer.

## Decision 6: Spatial Layout & Collapsible Sidebar
* **Context:** The UI must support 8 distinct routing tabs while maximizing horizontal viewport space for analyzing dense, high-resolution MRPL P&ID blueprints[cite: 1, 2].
* **Decision:** Implement a left-aligned, collapsible sidebar utilizing Framer Motion.
* **Reasoning:** A persistent 250px sidebar consumes critical screen real estate on standard engineering displays. Allowing the user to collapse the navigation into a 70px icon rail satisfies the rigid 8-tab architectural requirement[cite: 2] while maintaining a highly professional, enterprise-grade aesthetic.

# Architectural Decisions Log - Styling Engine Integration

## Decision 7: Adopting Tailwind CSS v4 Vite Plugin
* **Context:** The frontend required Tailwind CSS initialization within the Vite build environment.
* **Decision:** Bypass the legacy PostCSS configuration pipeline in favor of the native `@tailwindcss/vite` plugin and direct `@import "tailwindcss"` CSS injection.
* **Reasoning:** Tailwind v4 offers a first-party Vite plugin that significantly reduces boilerplate. It eliminates the dependency on `postcss.config.js` and `tailwind.config.js`, streamlining the Monorepo root and relying entirely on standard CSS variables inside `index.css` for theme customization. This accelerates development speed and aligns with modern React build practices.