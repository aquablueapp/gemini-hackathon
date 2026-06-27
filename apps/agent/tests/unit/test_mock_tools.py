import pytest
import os
import json
import datetime
from app.tools.sentry import query_sentry_issues
from app.tools.new_relic import query_new_relic_metrics
from app.tools.improvement_plots import generate_improvement_plots

@pytest.mark.asyncio
async def test_sentry_tool():
    owner = "aquablueapp"
    repo = "gemini-hackathon-demo"
    commits = [
        {
            "sha": "1234567890abcdef",
            "message": "fix: resolve TypeError in database query when data is null",
            "date": "2026-06-25T12:00:00Z"
        },
        {
            "sha": "abcdef1234567890",
            "message": "perf: optimize list rendering latency using virtual scrolling",
            "date": "2026-06-26T12:00:00Z"
        }
    ]
    res = await query_sentry_issues(owner, repo, commits=commits, days=3)
    assert res["project"] == f"{owner}/{repo}"
    assert len(res["issues"]) > 0
    # Should find 1 resolved issue from commits (since the first commit has "fix" keyword)
    resolved_issues = [x for x in res["issues"] if x["status"] == "resolved"]
    assert len(resolved_issues) == 1
    assert resolved_issues[0]["resolved_by_commit"] == "1234567890abcdef"
    assert os.path.exists("sentry_mock.json")
    
    # Cleanup
    if os.path.exists("sentry_mock.json"):
        os.remove("sentry_mock.json")

@pytest.mark.asyncio
async def test_new_relic_tool():
    owner = "aquablueapp"
    repo = "gemini-hackathon-demo"
    commits = [
        {
            "sha": "1234567890abcdef",
            "message": "fix: resolve TypeError in database query when data is null",
            "date": "2026-06-25T12:00:00Z"
        },
        {
            "sha": "abcdef1234567890",
            "message": "perf: optimize list rendering latency using virtual scrolling",
            "date": "2026-06-26T12:00:00Z"
        }
    ]
    res = await query_new_relic_metrics(owner, repo, commits=commits, days=3)
    assert res["application"] == f"{owner}/{repo}"
    assert "metrics_summary" in res
    # 3 days of hourly data should yield 24 * 3 + 1 = 73 points
    assert len(res["timeseries"]) == 73
    assert os.path.exists("new_relic_mock.json")
    
    # Cleanup
    if os.path.exists("new_relic_mock.json"):
        os.remove("new_relic_mock.json")

@pytest.mark.asyncio
async def test_improvement_plots_tool():
    owner = "aquablueapp"
    repo = "gemini-hackathon-demo"
    commits = [
        {
            "sha": "1234567890abcdef",
            "message": "fix: resolve TypeError in database query when data is null",
            "date": "2026-06-25T12:00:00Z"
        },
        {
            "sha": "abcdef1234567890",
            "message": "perf: optimize list rendering latency using virtual scrolling",
            "date": "2026-06-26T12:00:00Z"
        }
    ]
    
    # Run mock tools first to generate mock data structures
    sentry_data = await query_sentry_issues(owner, repo, commits=commits, days=3)
    new_relic_data = await query_new_relic_metrics(owner, repo, commits=commits, days=3)
    
    res = await generate_improvement_plots(
        owner, repo, commits=commits, sentry_data=sentry_data, new_relic_data=new_relic_data, days=3
    )
    assert res["status"] == "success"
    assert len(res["generated_plots"]) == 3
    for p in res["generated_plots"]:
        assert os.path.exists(p)
        # Cleanup
        os.remove(p)
        
    # Cleanup json files if any
    if os.path.exists("sentry_mock.json"):
        os.remove("sentry_mock.json")
    if os.path.exists("new_relic_mock.json"):
        os.remove("new_relic_mock.json")
