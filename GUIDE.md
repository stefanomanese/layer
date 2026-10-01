# Layer — How It Works

Layer gives AI agents a memory that survives between sessions. You write short notes during a session. Next time you open the project, those notes get read to Claude before anything else. It compounds over time.

---

## The idea in one sentence

Every session, Claude reads everything you've learned so far. Every session, you add to it.

---

## Setting up a new project

Run these once, in your project folder:

```bash
lr init                          # creates .layer/ folder in your project
lr add database                  # add a domain (a category)
lr add mobile
lr add api
lr setup claude                  # wires the auto-inject hook into Claude Code
```

That's it. From now on, `lr prime` runs automatically every time you open Claude Code in that project.

---

## The daily workflow

**Start of session** — nothing to do. `lr prime` fires automatically and injects your notes into Claude's context.

**During the session** — work normally.

**End of session** — spend 2 minutes capturing what you learned:

```bash
lr learn                         # shows what files changed, helps you decide what to record
lr record mobile failure --description "Expo crashes if you do X" --resolution "Do Y instead"
lr sync                          # saves everything to git
```

**The rule:** only record something if a future Claude would genuinely need it. Don't record obvious things. Don't record things just to fill space.

---

## Domains

Domains are just categories. You decide what they are per project. Common ones:

| Domain | What goes in it |
|---|---|
| `database` | Schema decisions, RLS patterns, migration quirks |
| `mobile` | Expo/React Native bugs, config patterns |
| `auth` | Auth flow, session handling |
| `api` | API design decisions, endpoint patterns |
| `product` | Scope decisions, what's in/out of the pilot |
| `infra` | CI/CD, environments, deploy patterns |

Add a domain with: `lr add <name>`

---

## Record types

Every record has a type. The type tells Claude what kind of information this is.

| Type | Use it for | Required fields |
|---|---|---|
| `convention` | How we always do X in this project | `--content` |
| `pattern` | A reusable solution we use repeatedly | `--name`, `--description` |
| `failure` | Something we tried that broke, and how we fixed it | `--description`, `--resolution` (optional) |
| `decision` | A choice we made and why | `--title`, `--rationale` |
| `reference` | A link or resource worth keeping | `--name`, `--description`, `--url` (optional) |
| `guide` | A how-to for a specific task | `--name`, `--description` |

---

## Classifications

Every record also has a classification — how long it stays relevant.

| Classification | Meaning | Shelf life |
|---|---|---|
| `foundational` | Always true, never changes | Permanent |
| `tactical` | True right now, may change | 90 days |
| `observational` | Short-term insight | 30 days |

Default is `tactical`. Add `--classification foundational` for things that will always be true.

When records get old, `lr prune` moves them to an archive. You can always bring one back with `lr restore <id>`.

---

## All commands

### Setup

```bash
lr init                          # create .layer/ in current project
lr add <domain>                  # add a new domain
lr setup claude                  # wire SessionStart hook + inject ritual into CLAUDE.md
```

### Writing records

```bash
lr record <domain> <type> [flags]
```

**Examples:**

```bash
# A convention
lr record database convention \
  --content "RLS must be enabled on every table. Missing policy = deny-all, silent failure."

# A failure with a fix
lr record mobile failure \
  --description "Hermes crashes with supabase-js default import" \
  --resolution "Pin to .cjs in metro.config.js resolveRequest" \
  --files "app/metro.config.js" \
  --classification foundational

# A decision
lr record product decision \
  --title "No in-app payments in pilot" \
  --rationale "Reduces scope and legal complexity. Revisit in V1." \
  --classification foundational

# A pattern
lr record api pattern \
  --name "Auth re-check in Edge Functions" \
  --description "Every Edge Function that writes must manually verify the calling user's auth before executing. Never trust the JWT alone." \
  --classification foundational
```

**All flags:**

| Flag | Used for |
|---|---|
| `--description` | Main text (required for most types) |
| `--content` | Text for convention type |
| `--name` | Name for pattern, reference, guide |
| `--title` | Title for decision |
| `--rationale` | Why for decision |
| `--resolution` | Fix for failure |
| `--url` | Link for reference |
| `--files "src/foo.ts"` | Attach to specific files (for scoped priming) |
| `--classification` | foundational / tactical / observational |
| `--tags "rls,auth"` | Optional labels |
| `--force` | Override duplicate check |

### Reading records

```bash
lr prime                         # print all expertise (runs automatically at session start)
lr prime mobile                  # only the mobile domain
lr prime --files "app/metro.config.js"  # only records anchored to that file
lr prime --format xml            # XML output (sometimes better for Claude)

lr list                          # show all records in a table
lr list mobile                   # only the mobile domain
lr search "hermes"               # search across all records by keyword
```

### Editing records

```bash
lr edit <id>                     # update any field on a record
lr delete <id>                   # permanently remove a record (asks for confirmation)
```

### Maintenance

```bash
lr prune                         # soft-archive records past their shelf life
lr prune --hard                  # permanently delete instead of archive
lr restore <id>                  # bring back an archived record
lr sync                          # validate all records, stage .layer/, commit to git
lr doctor                        # check for broken or invalid records
lr doctor --fix                  # auto-remove broken file anchors
lr status                        # overview of all domains: count, types, last updated
lr learn                         # show changed files + which domains have anchored records
```

---

## Where the files live

```
your-project/
  .layer/
    layer.config.yaml    ← your domain definitions
    expertise/
      database.jsonl     ← one file per domain, one record per line
      mobile.jsonl
      api.jsonl
    archive/
      database.jsonl     ← pruned records live here (not deleted, just moved)
```

Everything is plain text. Everything lives in git. You can read it directly if you want.

---

## Using Layer in a new project

```bash
cd my-new-project
lr init
lr add architecture
lr add testing
lr setup claude
```

Done. Start recording.

---

## Tips

- **File anchors are powerful.** Add `--files "src/lib/supabase.ts"` to a record and then `lr prime --files "src/lib/supabase.ts"` only shows records relevant to that file. Useful before editing a complex file.

- **foundational records are forever.** Use this classification for things that will always be true about the project — architectural decisions, hard rules, non-obvious patterns.

- **Don't over-record.** One good record is worth ten noisy ones. Ask yourself: "Would this actually help a future agent?" If not, skip it.

- **lr sync before you close.** Treat it like saving. Takes 5 seconds.
