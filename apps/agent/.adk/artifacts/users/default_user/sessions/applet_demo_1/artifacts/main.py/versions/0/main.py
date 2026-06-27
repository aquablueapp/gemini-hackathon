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
repo_name = "hono-tanstack-scaffolder"

headers = {
    "Authorization": f"token {github_token}",
    "Accept": "application/vnd.github.v3+json"
}

# Fetch commits for the selected repository (up to 100 commits to avoid rate limits for demo)
url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/commits?per_page=100"
req = urllib.request.Request(url, headers=headers)

all_commits = []
try:
    with urllib.request.urlopen(req) as response:
        commits_data = json.loads(response.read().decode())
        for commit in commits_data:
            all_commits.append({
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


# --- Simulate LLM Classification and Report Generation ---

commit_categories = ["Feature", "Bugfix", "Refactor", "Documentation", "Chore"]

report = {
    "title": f"{repo_owner}/{repo_name} 周报",
    "date_range": "获取到的所有提交",
    "total_commits": len(all_commits),
    "categorized_commits": [],
    "category_distribution": {},
    "performance_comparison": {
        "labels": ["上周", "本周"],
        "data": {
            "代码行数变化": [random.randint(50, 200), random.randint(50, 200)],
            "平均响应时间优化": [random.uniform(0.5, 2.0), random.uniform(0.1, 1.0)]
        }
    }
}

if not all_commits:
    print("Warning: No commits found even with extended search. Using entirely simulated data for report.")
    # Generate some simulated commits if none were found
    for i in range(5):
        all_commits.append({
            "sha": f"simulated_sha_{i}",
            "author": "Simulated User",
            "date": (datetime.now(timezone.utc) - timedelta(days=i)).isoformat(),
            "message": f"feat: Simulated feature {i+1} implementation\n\nThis is a simulated commit message for a new feature."
        })
    report["total_commits"] = len(all_commits)


for commit in all_commits:
    category = random.choice(commit_categories) # Simulate LLM classification
    report["categorized_commits"].append({
        "message_summary": commit["message"].splitlines()[0],
        "author": commit["author"],
        "category": category
    })
    report["category_distribution"][category] = report["category_distribution"].get(category, 0) + 1


# --- Print the structured report and data for charts ---

print("\n--- GitHub 周报总结 ---")
print(f"仓库: {report["title"]}")
print(f"日期范围: {report["date_range"]}")
print(f"总提交数: {report["total_commits"]}")

print("\n--- 提交分类详情 ---")
for categorized_commit in report["categorized_commits"]:
    print(f"[{categorized_commit["category"]}] {categorized_commit["author"]}: {categorized_commit["message_summary"]}")

print("\n--- 分类占比饼图数据 ---")
print(json.dumps(report["category_distribution"], indent=2))

print("\n--- 优化性能对比柱状图数据 ---")
print(json.dumps(report["performance_comparison"], indent=2))

print("\n--- 总结与建议 (LLM 生成模拟) ---")
print("本周工作主要集中在功能开发和代码重构。Bugfix 数量较少，表明代码质量稳定。建议持续关注新功能的反馈，并定期进行文档更新以保持同步。现在是{current_time}")


# Placeholder for affected items. In a real scenario, this might be specific commit SHAs or changed files.
print("affected_items_placeholder")
