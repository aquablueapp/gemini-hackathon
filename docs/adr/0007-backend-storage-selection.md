# ADR 0007: Backend Database and Storage Service Selection

* **Status**: Accepted (Supersedes [ADR 0003](file:///Users/yl/gemini/hackathon/gemini-hackathon/in-play/docs/adr/0003-session-artifact-persistence.md))
* **Date**: 2026-06-07

## Context
The Agent Application Platform requires reliable persistence for session chat states, event streams, compiled applets, run-time execution history, and user authorization credentials. Additionally, compiled static scripts and execution artifacts need scalable file storage.

Originally, relational database setups (like Neon Postgres or Cloud SQL) and reasoning engine-backed sessions (`DatabaseSessionService` / `VertexAiSessionService`) were considered to synchronize states. However, synchronization of Agent states across multiple Cloud Run instances and external platforms introduces:
1. Overhead latency of external SDK network synchronization.
2. Complicated dual-write synchronization that poses "split-brain" state risks if one persistence service fails.
3. Complexity in local offline development, making testing hard.

The platform requires a highly scalable, serverless, and low-maintenance option that can natively handle JSON-like dynamic session structures and chronological events, while treating the Agent service as a stateless worker.

## Decision
We decided to adopt **Google Cloud Firestore** as the primary document database, **Google Cloud Storage (GCS)** as the object storage service, and configure the Agent to run **Statelessly**:

1. **Firestore Collections**:
   - `sessions`: Stores persistent ADK Session metadata and state JSON (`FirestoreSession`).
   - `session_events`: Chronologically archives the timeline of conversation messages between the user and the Aquablue Agent (`FirestoreSessionEvent`).
   - `applets`: Stores metadata registries of compiled workflow applications, including visual metadata (Lucide icon, color theme) and the script GCS path (`FirestoreApplet`).
   - `applet_runs`: Records execution logs, timestamps, exit codes, and error tracebacks of Applet runs (`FirestoreAppletRun`).
   - `user_credentials`: Stores user-provided credentials (`FirestoreUserCredential`).

2. **Credentials Encryption**:
   - Persisted credentials must be symmetrically encrypted before storing in Firestore. Hono.js uses `AES-256-GCM` with a Master Secret key injected via environment variables (`BETTER_AUTH_SECRET`).
   - Each credential document saves the encrypted ciphertext, the initialization vector (`iv`), and the authentication tag (`tag`) to prevent tamper and leakage.

3. **GCS Artifacts**:
   - The compiled static Python scripts (`main.py`) and generated artifacts (input/output files) are durably stored on Google Cloud Storage buckets (using paths like `gs://<bucket-name>/default_user/applet_<appId>/main.py`).

4. **Stateless Agent Sessions**:
   - The Python Aquablue Agent (`apps/agent`) is configured to use **`InMemorySessionService`**.
   - The Agent operates as a **purely stateless computing unit**. For every API invocation, Node.js reads the latest session state and history from Firestore, passes them to the Python Sidecar, and writes the returned state back to Firestore.

## Consequences

### Positive (Pros)
- **Zero Schema Migrations**: Firestore's schemaless document model allows frictionless additions of new session state variables as the AI Agent evolves.
- **Serverless Integration**: Scale-to-zero capability matches Cloud Run's pricing model, leading to near-zero hosting costs under idle workloads.
- **Secure Encrypted Storage**: Prevents database administrators or database leaks from exposing cleartext tokens, meeting our P0 security criteria.
- **No Dual-Writes or Split-Brain States**: Maintaining Firestore as the single source of truth prevents synchronization discrepancies between the platform and external reasoning/agent platforms.
- **High Local Fidelity**: Running `InMemorySessionService` enables 100% offline local development and unit/integration testing without GCP infrastructure dependency.

### Negative (Cons)
- **Relational Query Limitations**: Lack of complex SQL joins requires application-level lookups (which is negligible given the low-load personal-use platform scope).
- **Payload Overhead**: Conversation history and states must be serialized and transmitted to the Python sidecar on each interaction (though negligible in a localhost proxy network).
