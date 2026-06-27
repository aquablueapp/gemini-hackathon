import os
import json
import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from google.adk.tools import ToolContext
from google.genai import types

async def generate_improvement_plots(
    owner: str,
    repo: str,
    commits: list[dict] = None,
    sentry_data: dict = None,
    new_relic_data: dict = None,
    days: int = 7,
    tool_context: ToolContext = None
) -> dict:
    """
    Generate beautiful matplotlib plots showing how commits improved the system's performance and error rate.
    
    Args:
        owner: The owner of the repository.
        repo: The repository name.
        commits: Optional list of commits.
        sentry_data: Optional Sentry data dictionary. If not provided, it will read sentry_mock.json or generate it.
        new_relic_data: Optional New Relic data dictionary. If not provided, it will read new_relic_mock.json or generate it.
        days: The time range in days to plot.
    """
    # 1. Fetch/load data if not provided
    if not sentry_data:
        try:
            with open("sentry_mock.json", "r", encoding="utf-8") as f:
                sentry_data = json.load(f)
        except Exception:
            from app.tools.sentry import query_sentry_issues
            sentry_data = await query_sentry_issues(owner, repo, commits, days, tool_context)
            
    if not new_relic_data:
        try:
            with open("new_relic_mock.json", "r", encoding="utf-8") as f:
                new_relic_data = json.load(f)
        except Exception:
            from app.tools.new_relic import query_new_relic_metrics
            new_relic_data = await query_new_relic_metrics(owner, repo, commits, days, tool_context)

    timeseries = new_relic_data.get("timeseries", [])
    if not timeseries:
        return {"status": "error", "message": "No timeseries data found to plot"}

    # Parse timeseries dates and metrics
    dates = [datetime.datetime.fromisoformat(pt["timestamp"].replace("Z", "+00:00")) for pt in timeseries]
    latencies = [pt["avg_latency_ms"] for pt in timeseries]
    error_rates = [pt["error_rate_pct"] for pt in timeseries]
    throughputs = [pt["throughput_rpm"] for pt in timeseries]
    
    # 2. Extract commit markers
    commit_markers = []
    if not commits:
        # Pull default commits from the mock data's resolved markers if commits not passed
        for issue in sentry_data.get("issues", []):
            if issue.get("status") == "resolved" and issue.get("resolved_by_commit"):
                commit_markers.append({
                    "date": datetime.datetime.fromisoformat(issue.get("resolved_at").replace("Z", "+00:00")),
                    "msg": issue.get("title"),
                    "sha": issue.get("resolved_by_commit")[:7]
                })
    else:
        for c in commits:
            try:
                c_date = datetime.datetime.fromisoformat(c["date"].replace("Z", "+00:00"))
                commit_markers.append({
                    "date": c_date,
                    "msg": c["message"],
                    "sha": c["sha"][:7]
                })
            except Exception:
                pass

    # Ensure style is clean
    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    
    generated_files = []

    # --- Plot 1: Latency Improvement ---
    fig, ax1 = plt.subplots(figsize=(10, 5))
    ax1.plot(dates, latencies, color='#3b82f6', linewidth=2, label='Avg Latency (ms)')
    ax1.set_xlabel(f'Time (Last {days} Days)', fontsize=11, fontweight='bold', labelpad=10)
    ax1.set_ylabel('Latency (ms)', color='#3b82f6', fontsize=11, fontweight='bold')
    ax1.tick_params(axis='y', labelcolor='#3b82f6')
    
    # Highlight performance commits
    for cm in commit_markers:
        is_perf = any(kw in cm["msg"].lower() for kw in ["perf", "optimize", "latency", "throughput", "speed", "cache"])
        if is_perf or not commits: # Draw for all default resolved if not specified
            ax1.axvline(x=cm["date"], color='#10b981', linestyle='--', linewidth=1.5, alpha=0.8)
            ax1.text(cm["date"], max(latencies) * 0.9, f" {cm['sha']}: Optimize", color='#047857', fontsize=9, fontweight='bold')
            
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d %H:00'))
    plt.gcf().autofmt_xdate()
    plt.title(f'Latency Optimization Trend - {owner}/{repo}', fontsize=14, fontweight='bold', pad=15)
    
    latency_path = "latency_improvement.png"
    plt.savefig(latency_path, dpi=150, bbox_inches='tight')
    plt.close()
    generated_files.append(latency_path)

    # --- Plot 2: Error Rate & Events Drop ---
    fig, ax2 = plt.subplots(figsize=(10, 5))
    ax2.plot(dates, error_rates, color='#ef4444', linewidth=2, label='Error Rate (%)')
    ax2.set_xlabel(f'Time (Last {days} Days)', fontsize=11, fontweight='bold', labelpad=10)
    ax2.set_ylabel('Error Rate (%)', color='#ef4444', fontsize=11, fontweight='bold')
    ax2.tick_params(axis='y', labelcolor='#ef4444')
    
    # Highlight error fix commits
    for cm in commit_markers:
        is_bug = any(kw in cm["msg"].lower() for kw in ["fix", "bug", "error", "crash", "exception", "null"])
        if is_bug or not commits:
            ax2.axvline(x=cm["date"], color='#10b981', linestyle='--', linewidth=1.5, alpha=0.8)
            ax2.text(cm["date"], max(error_rates) * 0.9, f" {cm['sha']}: Fix Bug", color='#047857', fontsize=9, fontweight='bold')

    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d %H:00'))
    plt.gcf().autofmt_xdate()
    plt.title(f'Error Rate Mitigation Trend - {owner}/{repo}', fontsize=14, fontweight='bold', pad=15)
    
    error_path = "error_rate_drop.png"
    plt.savefig(error_path, dpi=150, bbox_inches='tight')
    plt.close()
    generated_files.append(error_path)

    # --- Plot 3: System Health Dashboard (Composite) ---
    fig, (ax_lat, ax_err) = plt.subplots(2, 1, figsize=(11, 8), sharex=True)
    
    # Latency panel
    ax_lat.plot(dates, latencies, color='#3b82f6', linewidth=2)
    ax_lat.set_ylabel('Latency (ms)', color='#3b82f6', fontsize=10, fontweight='bold')
    ax_lat.tick_params(axis='y', labelcolor='#3b82f6')
    ax_lat.set_title('System Latency (ms)', fontsize=11, fontweight='bold', loc='left')
    for cm in commit_markers:
        ax_lat.axvline(x=cm["date"], color='#10b981', linestyle=':', linewidth=1.2)
            
    # Error rate panel
    ax_err.plot(dates, error_rates, color='#ef4444', linewidth=2)
    ax_err.set_ylabel('Error Rate (%)', color='#ef4444', fontsize=10, fontweight='bold')
    ax_err.tick_params(axis='y', labelcolor='#ef4444')
    ax_err.set_title('Application Error Rate (%)', fontsize=11, fontweight='bold', loc='left')
    for cm in commit_markers:
        ax_err.axvline(x=cm["date"], color='#10b981', linestyle=':', linewidth=1.2)
            
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m-%d %H:00'))
    plt.gcf().autofmt_xdate()
    plt.suptitle(f'Application Health Improvement Dashboard - {owner}/{repo}', fontsize=14, fontweight='bold', y=0.96)
    plt.tight_layout(rect=[0, 0, 1, 0.95])
    
    dashboard_path = "system_health_dashboard.png"
    plt.savefig(dashboard_path, dpi=150, bbox_inches='tight')
    plt.close()
    generated_files.append(dashboard_path)

    # 3. Save as session artifacts
    saved_artifacts = []
    if tool_context:
        for filename in generated_files:
            try:
                with open(filename, "rb") as img_file:
                    img_data = img_file.read()
                part = types.Part.from_bytes(data=img_data, mime_type="image/png")
                await tool_context.save_artifact(filename, part)
                saved_artifacts.append(filename)
                print(f"Saved plot as session artifact: {filename}")
            except Exception as art_err:
                print(f"Failed to save {filename} as session artifact: {art_err}")

    return {
        "status": "success",
        "generated_plots": [os.path.abspath(f) for f in generated_files],
        "saved_artifacts": saved_artifacts,
        "message": f"Successfully generated {len(generated_files)} improvement plots."
    }
