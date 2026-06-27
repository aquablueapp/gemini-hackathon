# ADR 0008: Serverless Sandbox Execution Model via Cloud Run Subprocesses

* **Status**: Accepted
* **Date**: 2026-06-07

## Context
AI Agents automatically generate and execute Python code snippets to complete workflow automation tasks. Running untrusted AI-generated scripts presents significant security risks, such as resource exhaustion or host file leakage.

We evaluated Google Cloud Gemini Code Execution Sandbox. However, it enforces severe limitations:
1. **No Outbound Network Access**: Scripts cannot connect to the internet, making it impossible to integrate third-party APIs (such as trashing Gmail messages, sending Slack notifications, or querying external databases).
2. **No Custom Dependency Installation**: The environment has a pre-determined package list, preventing dynamic resolution of custom Python libraries (via pip/uv) specified in PEP 723 metadata.

Therefore, we need a sandbox environment that provides robust isolation, supports dynamic dependency installation, allows outbound network connectivity for third-party integrations, and works seamlessly within a serverless container environment.

## Decision
We decided to implement a **Serverless Sandbox Subprocess Execution Model** on Google Cloud Run:

1. **Ephemeral Workspace Directory**:
   - For every script execution, the Hono.js backend API creates an isolated directory in `/tmp/aquablue-sandbox/default_user/<appId>`.
   - The `/tmp` directory operates as an in-memory `tmpfs` virtual file system in Cloud Run, offering high-speed I/O.
   - Node.js writes the downloaded Python script dynamically to `/tmp/aquablue-sandbox/default_user/<appId>/main.py`.

2. **Isolated Subprocess Execution via `uv`**:
   - The backend spawns a detached subprocess: `uv run main.py`.
   - `uv` parses PEP 723 inline dependency metadata at the head of the file and downloads packages on-the-fly.
   - We set the environment variable `UV_CACHE_DIR=/tmp/uv-cache` to share package cache, enabling sub-second cold starts for subsequent runs.

3. **GCP Cloud Run (gVisor) Physical Defense**:
   - The platform runs on GCP Cloud Run. Cloud Run containers are sandboxed using **gVisor**, a user-space kernel virtualization technology.
   - gVisor acts as a strong physical barrier, preventing any container breakouts or unauthorized access to physical host resources.

4. **Resource Constraints and Watchdog**:
   - **Timeout Watchdog**: Node.js initializes a 120-second timer per execution. If the script hangs or runs into infinite loops, Node.js kills the entire subprocess group via `SIGKILL`.
   - **Batch Limits**: Generated Python scripts must enforce a hardcoded maximum batch limit (e.g., 50 items) for destructive tasks to prevent accidental bulk data destruction.

## Consequences

### Positive (Pros)
- **Outbound Connectivity**: The sandbox can connect to Gmail, Slack, and other external services to perform automation tasks.
- **Dynamic Dependency Parsing**: Fully supports PEP 723 metadata headers to resolve arbitrary Python packages dynamically.
- **Microsecond Cold Starts**: Sharing the `/tmp/uv-cache` directory ensures libraries are fetched from local cache, optimizing startup times.
- **High Security Boundary**: gVisor secures the serverless host physical layer from malicious code injections.

### Negative (Cons)
- **No Local State Retention**: Since Cloud Run is stateless, all generated files and logs must be immediately uploaded to GCS or Firestore before the container recycles.
- **Resource Shared Pool**: The spawned subprocess shares CPU and RAM with the Node.js main thread, meaning a heavy Python execution can temporarily throttle API responsiveness if not throttled.
