---
description: Create conventional commit with auto-analysis
---

Automated commit workflow that analyzes changes and creates a conventional commit message.

## Workflow

### Step 1: Git Add

```bash
git add .
```

### Step 2: Analyze Changes

```bash
git diff --staged | grep -E '^\+|^\-' | head -30
```

### Step 3: Generate Message

Based on analyzed changes, determine type:

| Pattern                              | Type                | Emoji                |
| ------------------------------------ | ------------------- | -------------------- |
| `new file:` / creates component/page | feat                | `:tada:`             |
| `delete:` / removes file             | chore               | `:art:`              |
| `.tsx` / `.ts` changes               | feat, fix, refactor | context-based        |
| `package.json` / config              | chore               | `:art:`              |
| `.css` / styles                      | style               | `:lipstick:`         |
| `.md` / documentation                | docs                | `:book:`             |
| `test` / spec files                  | test                | `:white_check_mark:` |
| `ci` / github actions                | ci                  | `:green_heart:`      |

### Step 4: Create Commit

```bash
git commit -m "<generated message>"
```

## Format

`:<emoji>: <type>: <description>`

## Rules

- Max 50 characters for description
- Imperative mood ("add" not "added")
- No period at end
- First letter lowercase
- Include affected feature/module name

## Examples

- `:tada: feat: add password reset flow`
- `:bug: fix: prevent infinite reload on payment`
- `:recycle: refactor: extract granular components`
- `:lipstick: style: update button hover styles`
- `:book: docs: add commit command documentation`
