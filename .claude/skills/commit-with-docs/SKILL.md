---
name: commit-with-docs
description: 单命令完成：总结 session → 校验 staged diff → 对齐/新增 docs → git add + commit
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff --cached:*)
  - Bash(cat:*)
  - Bash(find:*)
  - Bash(mkdir:*)
  - Bash(touch:*)
  - Bash(git add:*)
  - Bash(git commit:*)
  - Edit
---

# 全局安全约束（必须遵守）
- 仅分析 staged（已 git add）的变更
- 仅允许修改以下文件：
  - docs/**
  - CLAUDE.md（仅文档链接区）
  - SESSION.md
- 严禁修改任何业务代码
- 若 session 与 diff 不一致，必须明确指出，不得悄悄继续

# Context（事实来源）
- Staged status：!`git status --porcelain`
- Staged name-status：!`git diff --cached --name-status`
- Staged patch：!`git diff --cached`
- SESSION.md：!`cat SESSION.md 2>/dev/null || echo "NO_SESSION_FILE"`
- CLAUDE.md：!`cat CLAUDE.md 2>/dev/null || echo "NO_CLAUDE_FILE"`
- docs 概览：!`find docs/ -name "*.md" 2>/dev/null || echo "No docs found"`

# Phase 1 · Session + Diff → Plan（只分析，不改文件）
## 如果 SESSION.md 不存在：创建模板并停止后续流程
### SESSION.md 模板
```md
# Session Intent (commit-level)
## Why
*

## What changed (user/dev visible)
*

## New concepts / modules / configs
*

## Scope (paths/modules)
*

## Breaking / Migration
*
```
## Phase 1 输出
- Session Summary（≤6 行）：Why / What / Scope / New concepts / Migration / Test status
- Doc Change Plan（Checklist）：每项含 文档路径 + 原因（对应 SESSION）+ diff 证据（文件路径）+ 置信度
- Conventional Commit 候选（2 条）

# Phase 2 · Apply → Docs + Commit
## 前置条件
- SESSION.md 非空且不是纯模板

## 判定规则（Heuristics）
- 模块路径：src/modules/<name>/ 或 modules/<name>/ 或 packages/<name>/
- API 触发：**/api/**, **/routes/**, **/controller/**, openapi*.{yml,yaml,json}, proto/**, sdk/**
- 目录重构：name-status 出现 R*（rename/move）

## 执行
1) 按 Doc Plan 更新 docs（只改 docs/**、CLAUDE.md 链接区、SESSION.md）
2) git add docs/ CLAUDE.md SESSION.md
3) git commit -m "..."
