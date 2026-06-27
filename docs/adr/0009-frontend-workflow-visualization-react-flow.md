# ADR 0009: Frontend Workflow Visualization via React Flow

* **Status**: Accepted
* **Date**: 2026-06-07

## Context
When the Aquablue Agent decomposes the user's natural language goal into specific execution steps, showing these steps only as plain-text lines inside a chat timeline creates a high cognitive load.

Users need an intuitive, highly visual way to:
1. Understand the linear and conditional relationships between synthesized steps (e.g. branch conditions, sequential dependencies).
2. Monitor real-time progress during Applet runs (e.g. seeing which specific step is currently running, succeeded, or failed).
3. Review changes before committing edits to an existing Applet.

## Decision
We decided to adopt **React Flow** as the core workflow visualization library in the Frontend (`apps/web`):

1. **Interactive Node-based Diagrams**:
   - Represent step configurations, action modules (e.g., fetch emails, post to Slack), and conditional splits as nodes.
   - Use custom React Flow nodes styled with **Tailwind CSS v4** to display status indicators (icons, custom loading states).

2. **Real-time Execution Status Binding**:
   - Connect backend SSE (Server-Sent Events) progress updates to React Flow nodes state.
   - Nodes will dynamically transition their visual state (e.g., pending, running with spinner animation, succeeded with green checkmark, failed with red traceback error preview) to provide premium interactive feedback.

3. **Strict TypeScript Implementation**:
   - Define custom node and edge payloads in TypeScript to enforce compile-time verification and prevent structure mismatches during serialization/deserialization.

## Consequences

### Positive (Pros)
- **Reduced Cognitive Load**: Clear node-based flowcharts help users immediately verify the Agent's logic.
- **Premium User Experience (Wow Aesthetics)**: Flow transitions, active execution animations, and visually responsive nodes feel state-of-the-art.
- **High Customizability**: React Flow provides robust APIs to render completely custom React components as node contents, aligning with Tailwind v4 design tokens.

### Negative (Cons)
- **Bundle Size**: React Flow increases the JavaScript bundle size.
- **Complexity**: Requires mapping unstructured step arrays returned by the Agent into standard Graph elements (nodes and edges) in the frontend application.
