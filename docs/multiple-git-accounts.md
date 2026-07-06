# Multiple Git Accounts (HSL82 + andrewbuildsai)

Guide for using two GitHub accounts on one Mac with 1Password SSH agent.

## Two separate layers

| Layer | Controls | Config location |
|-------|----------|-----------------|
| **SSH** | Authentication (push/pull) | `~/.ssh/config` |
| **Git identity** | Commit author on GitHub | `~/.gitconfig` or per-repo |

SSH and commit identity are independent. Both must match the intended account per repo.

---

## Accounts

| Account | SSH host alias | Public key file | Email |
|---------|----------------|-----------------|-------|
| **andrewbuildsai** | `github.com-andrewbuildsai` | `~/.ssh/id_ed25519_aba.pub` | `andrew.builds.ai@gmail.com` |
| **HSL82** | `github.com-hsl82` | `~/.ssh/id_ed25519_hsl82.pub` | `hosl808@gmail.com` |

GitHub links commits to an account by **verified email**, not by SSH key or repo owner.

---

## SSH setup (`~/.ssh/config`)

### Host aliases

SSH config uses aliases. The name in the git URL is the `Host` — not necessarily the real server.

```ssh-config
Host github.com-andrewbuildsai
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_aba.pub
    IdentitiesOnly yes

Host github.com-hsl82
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_hsl82.pub
    IdentitiesOnly yes

Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_hsl82.pub
    IdentitiesOnly yes

Host *
    IdentityAgent "~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"
```

### What each setting does

| Setting | Purpose |
|---------|---------|
| `Host` | Alias matched by the git remote URL |
| `HostName github.com` | Real server to connect to |
| `User git` | SSH user GitHub expects (not your GitHub username) |
| `IdentityFile` | Points to the **public key** (`.pub`) — tells 1Password which key to use |
| `IdentitiesOnly yes` | Only offer that one key; don't try all keys in the agent |
| `IdentityAgent` | Use 1Password as the SSH agent for all connections |

### What `ForwardAgent` is NOT

`ForwardAgent yes` forwards your SSH agent to a **remote server** when you SSH into it (e.g. EC2). It is:

- **Not** related to 1Password
- **Not** needed for direct GitHub push/pull from your Mac

---

## 1Password workflow

Private keys live in 1Password. Only `.pub` files sit on disk.

### Create a new key

1. 1Password → **New Item** → **SSH Key** → **Generate**
2. Download the public key → save to `~/.ssh/` (e.g. `id_ed25519_hsl82.pub`)
3. Add the public key to the matching GitHub account → Settings → SSH keys
4. Optional: in 1Password, restrict the key to specific hosts (e.g. `git@github.com-hsl82`)

### How signing works

1. SSH reads `IdentityFile` → knows which key (via `.pub` path)
2. SSH talks to 1Password agent (`IdentityAgent`)
3. 1Password signs the request (you may get an approval prompt)
4. Private key never leaves the vault

---

## Git remotes

Use the SSH host alias in every remote URL:

```bash
# andrewbuildsai
git@github.com-andrewbuildsai:andrewbuildsai/repo-name.git

# HSL82
git@github.com-hsl82:HSL82/repo-name.git
```

### Clone

```bash
git clone git@github.com-andrewbuildsai:andrewbuildsai/some-repo.git
git clone git@github.com-hsl82:HSL82/some-repo.git
```

### Fix an existing remote

```bash
git remote set-url origin git@github.com-andrewbuildsai:andrewbuildsai/repo.git
```

Avoid plain `git@github.com:...` for andrewbuildsai repos — it defaults to the HSL82 key.

---

## Commit identity (name / email)

### Per-repo (simple)

```bash
# andrewbuildsai repo
git config user.name "andrewbuildsai"
git config user.email "andrew.builds.ai@gmail.com"

# HSL82 repo
git config user.name "Andrew Ho"
git config user.email "hosl808@gmail.com"
```

### Folder-based auto-switch (recommended)

In `~/.gitconfig`, set a global default (e.g. HSL82) and use `includeIf`:

```gitconfig
[user]
    name = Andrew Ho
    email = hosl808@gmail.com

[includeIf "gitdir:~/AIS/"]
    path = ~/.gitconfig-andrewbuildsai
```

`~/.gitconfig-andrewbuildsai`:

```gitconfig
[user]
    name = andrewbuildsai
    email = andrew.builds.ai@gmail.com
```

Repos under `~/AIS/` automatically use the andrewbuildsai identity.

---

## Checklist for every new repo

1. **Clone** with the correct SSH alias
2. **Set identity** (per-repo or via `includeIf`)
3. **Verify** before the first commit:

```bash
git config user.email
git remote -v
ssh -T git@github.com-andrewbuildsai   # or github.com-hsl82
```

4. **Commit** → confirm the author on GitHub matches the intended account

---

## Test SSH

```bash
ssh -T git@github.com-andrewbuildsai   # expect: Hi andrewbuildsai!
ssh -T git@github.com-hsl82            # expect: Hi HSL82!
```

You should get one 1Password prompt with the correct key.

---

## Common mistakes

| Mistake | Result |
|---------|--------|
| Right SSH key, wrong `user.email` | Push works; commits show as the other account |
| Plain `git@github.com:...` on andrewbuildsai repo | Uses HSL82 SSH key |
| Global email only, no per-repo / `includeIf` | New repos commit under the wrong account |
| `IdentityFile` points to private key with 1Password | Use `.pub` path instead |
| Missing `IdentitiesOnly yes` | 1Password offers all keys; deny-and-wait prompts |

---

## Fix wrong author on an existing commit

If the commit is not yet correct on GitHub:

```bash
git config user.email "andrew.builds.ai@gmail.com"   # email verified on target account
git config user.name "andrewbuildsai"
git commit --amend --reset-author --no-edit
git push --force-with-lease origin main
```

Only rewrite history if you are comfortable force-pushing.
