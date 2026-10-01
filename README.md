# Layer

Agentic context persistence for any codebase. Agents record learnings as typed JSONL records; a `SessionStart` hook injects them at the start of every session.

Inspired by [Mulch](https://github.com/jayminwest/mulch) — same pattern, built from scratch.

## Install

```bash
cd myOS/tools/layer
bun install
bun link           # makes 'lr' available globally
```

## Quick Start

```bash
lr init                                          # bootstrap .layer/ in your project
lr add database                                  # add a domain
lr record database decision \
  --title "RLS on all tables" \
  --rationale "Missing policy = deny-all, fails silently" \
  --classification foundational
lr prime                                         # inject expertise into session context
lr setup claude                                  # wire SessionStart hook + CLAUDE.md ritual
```

## Commands

| Command | Purpose |
|---|---|
| `lr init` | Bootstrap `.layer/` in current project |
| `lr add <domain>` | Add a new domain |
| `lr record <domain> <type>` | Write a record |
| `lr prime [domain] [--files] [--format xml]` | Output expertise for context injection |
| `lr list [domain]` | Review all records |
| `lr edit <id>` | Update a record |
| `lr delete <id>` | Remove a record permanently |
| `lr prune [--hard]` | Soft-archive stale records |
| `lr restore <id>` | Restore an archived record |
| `lr search <query>` | Full-text search |
| `lr learn` | Show changed files → help decide what to record |
| `lr sync` | Validate + stage + commit `.layer/` |
| `lr doctor [--fix]` | Validate record integrity |
| `lr status` | Domain health overview |
| `lr setup claude` | Wire into Claude Code (hook + CLAUDE.md ritual) |

## Record Types

| Type | Required fields |
|---|---|
| `convention` | `--content` |
| `pattern` | `--name`, `--description` |
| `failure` | `--description` (`--resolution` optional) |
| `decision` | `--title`, `--rationale` |
| `reference` | `--name`, `--description` (`--url` optional) |
| `guide` | `--name`, `--description` |

## Classifications

| Classification | Shelf life |
|---|---|
| `foundational` | Permanent |
| `tactical` | 90 days |
| `observational` | 30 days |

`lr prune` soft-archives records past their shelf life. `lr restore <id>` brings them back.

## Session Workflow

```bash
# Start of session — lr prime runs automatically via SessionStart hook

# During/after work
lr learn                                         # see what changed
lr record <domain> <type> --description "..."
lr sync                                          # validate, stage, commit
```
