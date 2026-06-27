max_batch_size = 50

import os
import urllib.request
import json
from datetime import datetime, timedelta, timezone
import random

github_token = os.environ.get("GITHUB_TOKEN")

if not github_token:
    print("Error: GITHUB_TOKEN environment variable not set.")
    exit(1)

repo_owner = "tenrai0226"
repo_name = "rekt-watcher"

# Get date range for the last 30 days
now = datetime.now(timezone.utc)
last_month = now - timedelta(days=30)

since_date = last_month.isoformat()
until_date = now.isoformat()

headers = {
    "Authorization": f"token {github_token}",
    "Accept": "application/vnd.github.v3+json"
}

# Fetch commits for the specified repository within the date range
url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/commits?since={since_date}&until={until_date}&per_page=100"
req = urllib.request.Request(url, headers=headers)

commits_period = []
try:
    with urllib.request.urlopen(req) as response:
        commits_data = json.loads(response.read().decode())
        for commit in commits_data:
            commits_period.append({
                "sha": commit["sha"],
                "author": commit["commit"]["author"]["name"],
                "date": commit["commit"]["author"]["date"],
                "message": commit["commit"]["message"]
            })

except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} - {e.reason}")
    print(e.read().decode())
except Exception as e:
    print(f"An error occurred: {e}")


# --- Simulate LLM Analysis (Enhanced) ---

analysis_results = {
    "repo": f"{repo_owner}/{repo_name}",
    "date_range": f"从 {last_month.strftime('%Y-%m-%d')} 到 {now.strftime('%Y-%m-%d')}",
    "total_commits": len(commits_period),
    "features": [],
    "optimizations": [],
    "performance_improvements": [],
    "other_changes": []
}

commit_categories_map = {
    "feat": {"category": "功能开发", "type": "feature"},
    "fix": {"category": "Bug 修复", "type": "optimization"}, # Bug fixes can be seen as optimization of correctness
    "refactor": {"category": "代码重构", "type": "optimization"},
    "perf": {"category": "性能优化", "type": "performance"},
    "docs": {"category": "文档更新", "type": "other"},
    "style": {"category": "代码风格", "type": "other"},
    "test": {"category": "测试相关", "type": "other"},
    "build": {"category": "构建相关", "type": "other"},
    "ci": {"category": "CI/CD", "type": "other"},
    "chore": {"category": "日常维护", "type": "other"},
    "revert": {"category": "版本回退", "type": "other"}
}

if not commits_period:
    print("Warning: No commits found in the last month for this repository. Using entirely simulated data for demonstration.")
    # Generate some simulated commits if none were found
    for i in range(5):
        commit_type_key = random.choice(list(commit_categories_map.keys()))
        commit_info = commit_categories_map[commit_type_key]
        message_prefix = f"{commit_type_key}: "
        simulated_message = f"{message_prefix} Simulated {commit_info["category"]} {i+1}\n\nDetails for simulated commit {i+1}."
        commits_period.append({
            "sha": f"simulated_sha_{i}",
            "author": "Simulated User",
            "date": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat(),
            "message": simulated_message
        })
    analysis_results["total_commits"] = len(commits_period)


for commit in commits_period:
    first_line = commit["message"].splitlines()[0]
    category_data = {"category": "未知", "type": "other"}
    description = first_line # Default to first line of message
    performance_gain = None

    # Try to match Conventional Commits prefixes
    matched_prefix = False
    for prefix, data in commit_categories_map.items():
        if first_line.lower().startswith(f"{prefix}:") or first_line.lower().startswith(f"{prefix}("):
            category_data = data
            description = first_line.split(": ", 1)[1] if ": " in first_line else first_line # Remove prefix
            if data["type"] == "performance":
                performance_gain = f"{random.randint(5, 25)}% 性能提升 (模拟)"
            matched_prefix = True
            break

    # Fallback for more generic keyword matching if no prefix matched well
    if not matched_prefix:
        if "add" in first_line.lower() or "implement" in first_line.lower() or "feature" in first_line.lower():
            category_data = {"category": "功能开发", "type": "feature"}
        elif "optimize" in first_line.lower() or "improve" in first_line.lower() or "refactor" in first_line.lower():
            category_data = {"category": "代码优化", "type": "optimization"}
        elif "fix" in first_line.lower() or "bug" in first_line.lower():
            category_data = {"category": "Bug 修复", "type": "optimization"}
        elif "perf" in first_line.lower() or "performance" in first_line.lower():
             category_data = {"category": "性能优化", "type": "performance"}
             performance_gain = f"{random.randint(5, 25)}% 性能提升 (模拟)"


    commit_analysis = {
        "sha": commit["sha"][:7],
        "author": commit["author"],
        "message_summary": first_line,
        "category": category_data["category"],
        "description": description
    }

    if performance_gain:
        commit_analysis["performance_gain"] = performance_gain

    if category_data["type"] == "feature":
        analysis_results["features"].append(commit_analysis)
    elif category_data["type"] == "optimization":
        analysis_results["optimizations"].append(commit_analysis)
    elif category_data["type"] == "performance":
        analysis_results["performance_improvements"].append(commit_analysis)
    else:
        analysis_results["other_changes"].append(commit_analysis)


# --- Print the structured report ---

print(f"\n--- GitHub 提交分析报告 ({analysis_results["date_range"]}) ---")
print(f"仓库: {analysis_results["repo"]}")
print(f"总提交数: {analysis_results["total_commits"]}")

print("\n### 功能点 (Features) ###")
if analysis_results["features"]:
    for item in analysis_results["features"]:
        print(f"- **{item["description"]}** (提交: {item["sha"]}) - 作者: {item["author"]}")
else:
    print("过去一个月没有检测到明确的功能开发提交。")

print("\n### 优化措施 (Optimizations) ###")
if analysis_results["optimizations"]:
    for item in analysis_results["optimizations"]:
        print(f"- **{item["description"]}** (类别: {item["category"]}, 提交: {item["sha"]}) - 作者: {item["author"]}")
else:
    print("过去一个月没有检测到明确的代码优化或 Bug 修复提交。")

print("\n### 性能提升 (Performance Improvements) ###")
if analysis_results["performance_improvements"]:
    for item in analysis_results["performance_improvements"]:
        print(f"- **{item["description"]}** (提升度: {item["performance_gain"]}, 提交: {item["sha"]}) - 作者: {item["author"]}")
else:
    print("过去一个月没有检测到明确的性能优化提交。")

print("\n### 其他变更 (Other Changes) ###")
if analysis_results["other_changes"]:
    for item in analysis_results["other_changes"]:
        print(f"- **{item["message_summary"]}** (类别: {item["category"]}, 提交: {item["sha"]}) - 作者: {item["author"]}")
else:
    print("过去一个月没有其他类型的变更。")

print("\n--- 总结与建议 (LLM 生成模拟) ---")
summary_text = """
在过去一个月中，该仓库的开发活动非常活跃，共有 {total_commits} 次提交。

**主要功能进展**：
开发团队致力于引入多项新功能，包括 {feat_count} 项。这些功能涵盖了用户界面增强、API 端点扩展以及数据处理能力的提升，例如 {example_feat_desc} 等，这显著提升了用户体验和系统能力。

**代码质量与优化**：
共进行了 {opt_count} 次优化，主要集中在 {opt_types} 等方面。这些优化措施有助于提高代码的可读性、可维护性和稳定性。

**性能表现**：
检测到 {perf_count} 次性能优化相关提交，其中 {perf_example_desc} 等提交可能带来了显著的性能提升。

**综合评估**：
整体来看，项目在功能迭代和系统稳定性方面表现良好。建议继续保持高效的开发节奏，并进一步细化提交信息，以便于未来更精准地进行自动化分析和项目管理。
""".format(
    total_commits=analysis_results["total_commits"],
    feat_count=len(analysis_results["features"]),
    opt_count=len(analysis_results["optimizations"]),
    perf_count=len(analysis_results["performance_improvements"]),
    example_feat_desc=analysis_results["features"][0]["description"] if analysis_results["features"] else "多个新特性",
    opt_types=", ".join(list(set([item["category"] for item in analysis_results["optimizations"]]))) if analysis_results["optimizations"] else "代码结构优化",
    perf_example_desc=analysis_results["performance_improvements"][0]["description"] if analysis_results["performance_improvements"] else "多项改进"
)
print(summary_text)

print("affected_items_placeholder")
