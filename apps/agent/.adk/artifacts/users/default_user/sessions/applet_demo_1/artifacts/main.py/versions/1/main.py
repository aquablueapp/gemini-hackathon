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

# Get today's date range
now = datetime.now(timezone.utc)
today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

since_date = today_start.isoformat()
until_date = now.isoformat()

headers = {
    "Authorization": f"token {github_token}",
    "Accept": "application/vnd.github.v3+json"
}

# Fetch commits for today for the specified repository
url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/commits?since={since_date}&until={until_date}&per_page=100"
req = urllib.request.Request(url, headers=headers)

commits_today = []
try:
    with urllib.request.urlopen(req) as response:
        commits_data = json.loads(response.read().decode())
        for commit in commits_data:
            commits_today.append({
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


# --- Simulate LLM Analysis ---

analysis_results = {
    "repo": f"{repo_owner}/{repo_name}",
    "date": today_start.strftime("%Y-%m-%d"),
    "total_commits": len(commits_today),
    "detailed_analysis": []
}

commit_categories = {
    "feat": "功能开发",
    "fix": "Bug 修复",
    "docs": "文档更新",
    "style": "代码风格",
    "refactor": "代码重构",
    "perf": "性能优化",
    "test": "测试相关",
    "build": "构建相关",
    "ci": "CI/CD",
    "chore": "日常维护",
    "revert": "版本回退"
}

if not commits_today:
    print("Warning: No commits found for today in this repository. Generating simulated commits for demonstration.")
    # Generate some simulated commits if none were found
    for i in range(2):
        commit_type = random.choice(list(commit_categories.keys()))
        message_prefix = f"{commit_type}: "
        simulated_message = f"{message_prefix} Simulated {commit_categories[commit_type]} {i+1}\n\nDetails for simulated commit {i+1}."
        commits_today.append({
            "sha": f"simulated_sha_{i}",
            "author": "Simulated User",
            "date": now.isoformat(),
            "message": simulated_message
        })
    analysis_results["total_commits"] = len(commits_today)


for commit in commits_today:
    first_line = commit["message"].splitlines()[0]
    category = "未知"
    effect = "根据提交信息难以判断具体效果，建议人工复查。"

    # Simple LLM simulation based on commit message prefixes (Conventional Commits style)
    for prefix, cat_name in commit_categories.items():
        if first_line.lower().startswith(f"{prefix}:") or first_line.lower().startswith(f"{prefix}("):
            category = cat_name
            if prefix == "feat":
                effect = "新增了新功能，可能提升用户体验或增加系统能力。"
            elif prefix == "fix":
                effect = "修复了现有 Bug，提高了系统稳定性或准确性。"
            elif prefix == "refactor":
                effect = "优化了代码结构，可能提高了可读性或未来可维护性，对功能无直接影响。"
            elif prefix == "perf":
                effect = "提升了系统性能，优化了资源利用率或响应速度。"
            elif prefix == "docs":
                effect = "更新了文档，有助于团队理解或用户使用。"
            elif prefix == "chore":
                effect = "进行了日常维护或构建调整，间接提升开发效率。"
            break
    
    # More generic analysis if no specific prefix matches
    if "add" in first_line.lower() or "implement" in first_line.lower():
        category = category if category != "未知" else "功能或新增"
        effect = effect if effect != "根据提交信息难以判断具体效果，建议人工复查。" else "引入了新功能或组件。"
    elif "fix" in first_line.lower() or "bug" in first_line.lower():
        category = category if category != "未知" else "Bug 修复"
        effect = effect if effect != "根据提交信息难以判断具体效果，建议人工复查。" else "解决了代码中的缺陷。"
    elif "update" in first_line.lower() or "change" in first_line.lower():
        category = category if category != "未知" else "更新或修改"
        effect = effect if effect != "根据提交信息难以判断具体效果，建议人工复查。" else "对现有逻辑进行了修改或更新。"


    analysis_results["detailed_analysis"].append({
        "sha": commit["sha"][:7],
        "author": commit["author"],
        "message_summary": first_line,
        "category_llm_simulated": category,
        "impact_llm_simulated": effect
    })


# --- Print the analysis report ---

print(f"\n--- GitHub 今日提交分析报告 ({analysis_results["date"]}) ---")
print(f"仓库: {analysis_results["repo"]}")
print(f"总提交数: {analysis_results["total_commits"]}")

if analysis_results["detailed_analysis"]:
    print("\n--- 详细分析 (LLM 模拟) ---")
    for item in analysis_results["detailed_analysis"]:
        print(f"\n提交 SHA: {item["sha"]}")
        print(f"作者: {item["author"]}")
        print(f"提交信息: {item["message_summary"]}")
        print(f"涉及修改类别: {item["category_llm_simulated"]}")
        print(f"模拟效果评估: {item["impact_llm_simulated"]}")
else:
    print("\n今天没有在'rekt-watcher'仓库中找到任何提交。")

print("affected_items_placeholder")
