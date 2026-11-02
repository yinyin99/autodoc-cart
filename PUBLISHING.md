# Publishing anonymously on GitHub

Goal: publish this repo without tying it to your real name, email, machine or browser profile.
Do these steps in order. Nothing here has been done for you: no commit exists, no git identity is set, nothing was pushed.

## 1. Pick an identity

- **Best:** create a new GitHub account with a pseudonym, using a throwaway or alias email address (not your main one).
- **Or** reuse an existing account, but only if its public profile (name, avatar, bio, location, company) is already pseudonymous. Otherwise create a new one.

## 2. Hide your email on GitHub

In GitHub → Settings → Emails:

- Enable **Keep my email addresses private**.
- Enable **Block command line pushes that expose my email**.
- Copy your no-reply address. It looks like `<id>+<pseudonym>@users.noreply.github.com`.

Also check Settings → Profile: name, public email, location, company and social links should be empty or pseudonymous.

## 3. Set a repo-local git identity (never `--global`)

From the project folder, before the first commit:

```
git init -b main            # skip if already initialised
git config user.name  "<pseudonym>"
git config user.email "<id>+<pseudonym>@users.noreply.github.com"
git config --local --list | findstr user.   # Windows; use grep on macOS/Linux
```

If you ever committed with the wrong identity, fix it **before** pushing (`git commit --amend --reset-author`, or re-create the repo). Once pushed, assume the old identity is public forever.

Also make sure your git does not sign commits with a key tied to your real name (`git config commit.gpgsign false` in this repo, or use a key created for the pseudonym).

## 4. Audit the files before the first commit

The repo should contain only: `autodoc-cart.user.js`, `test.js`, `README.md`, `LICENSE`, `PUBLISHING.md`, `.gitignore`.

Search for leaks (run from the project folder):

```
git grep -nIi -e "C:\\\\Users" -e "/home/" -e "/Users/" -e "@gmail" -e "@outlook" -e "@hotmail" -e "password" -e "token" -e "cookie"
```

(use `grep -rnIi ... --exclude-dir=.git .` if nothing is committed yet)

Expected hits: only the words "token"/"cookie" in README/script comments about Turnstile and CSRF. No real names, usernames, paths, emails, order numbers, cart contents or IP addresses. The `YOUR_GITHUB_USER` placeholder was replaced with the account name (`yinyin99`) in the script header and README.

The license holder is already generic ("autodoc-cart contributors"); keep it that way.

## 5. Screenshots (optional)

If you add screenshots to the README:

- Use a **fresh browser profile** with no extensions visible, or crop to the page content only.
- Blur/remove cart contents you do not want public, addresses, account name, vehicle registration, order numbers, and the browser tab strip/profile avatar.
- Strip metadata from the image (`exiftool -all= image.png`).

## 6. Create the repo and push

1. On GitHub, create `autodoc-cart` (public, no README/licence, they already exist locally).
2. Commit with the repo-local identity from step 3, then:

```
git remote add origin https://github.com/<pseudonym>/autodoc-cart.git
git push -u origin main
```

Authenticate with a token or SSH key created for the pseudonymous account. Avoid a credential helper already logged into your personal account.

3. Check the result in a **logged-out browser**: the commit author shows the pseudonym, the repo has no stray files, the raw URL in the script header (`@downloadURL` / `@updateURL`) opens the script.

## 7. Optional: Greasy Fork / OpenUserJS

- **Greasy Fork**: sign in (it supports a GitHub sign-in or its own account; use a pseudonymous one), "Post a script", import from the raw GitHub URL or paste the file. It can auto-sync from GitHub via a webhook. Greasy Fork requires the licence in the header (`@license MIT` is present) and rejects obfuscated code (this script is plain).
- **OpenUserJS**: sign in with the pseudonymous GitHub account and submit the script, or import from the repo.

Both sites show the author name you registered with and publish the script source; apply the same checks as step 4 first.

If you publish on a store, update `@downloadURL` / `@updateURL` only if you want updates from there instead of GitHub raw.

## 8. Ongoing habits

- Keep the git identity repo-local; do not push from a terminal configured with your real identity.
- Use the pseudonymous account only from a browser profile that is not logged into personal accounts.
- Do not paste real cart data, order numbers or screenshots of your Autodoc account into issues or pull requests.
- Bump `@version` in the script header on every release so Tampermonkey offers updates.
