# ADR 0002: Sandbox Dependency Pre-installation and Caching Strategy

* **Status**: Accepted
* **Date**: 2026-06-06

## Context
When a user runs a compiled static Applet (e.g., Gmail Polymarket Trashing), the backend spawns a child process using `uv run` with PEP 723 inline dependency metadata. If the sandboxed execution installs large libraries like `google-api-python-client` or `playwright` from PyPI on every execution, runtimes will suffer from severe cold-start latencies (10–30 seconds), causing a poor user experience.

We evaluated two caching and package management strategies:
1. **Isolated Pure-play Fetch**: Run `uv run` on a clean, empty virtual directory. Every execution fetches all declared dependencies from the web.
2. **Pre-installed Environments with Shared Cache**: Pre-install popular automation dependencies (such as `google-api-python-client`, `playwright`, `beautifulsoup4`) in the base application image. Set the `UV_CACHE_DIR` environment variable to a shared local directory (e.g., `/tmp/uv-cache`) to cache dynamic runtime resolves.

## Decision
We decided to implement **Pre-installed Environments with Shared Cache**.

The Python project root (`apps/agent`) will include core automation libraries as standard dependencies in its `pyproject.toml`. When launching subprocess scripts, `uv run` will be configured to resolve dependencies utilizing the shared cache directory `/tmp/uv-cache` and the pre-installed system path to maximize reuse and reduce latency.

## Consequences

### Positive (Pros)
- **Sub-second Start Times**: Commonly used automation scripts (especially those relying on standard Google APIs or BeautifulSoup) resolve instantly without fetching anything over the network.
- **Resiliency**: If PyPI is down or network speeds are limited, execution remains functional for pre-cached/pre-installed libraries.
- **Bandwidth Savings**: Drastically reduces network traffic for the server host by preventing redundant package downloads.

### Negative (Cons)
- **Tighter Sandbox Coupling**: The sandbox shares packages with the base environment, meaning a dependency collision in rare scenarios could occur if the script requests a conflicting package version.
- **Increased Image size**: The base container image footprint is larger due to pre-installed automation dependencies.
