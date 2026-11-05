# Great Lakes JUCO Stats

2025-26 freshman batting and pitching stats for every junior college baseball program in Michigan, Ohio and Indiana.

## Put it online with GitHub Pages
1. Create a new public repository on GitHub (for example `juco-stats`).
2. Upload all five files in this folder (`index.html`, `style.css`, `app.js`, `stats.js`, `logos.js`) to the repository's main branch.
3. In the repository go to **Settings > Pages**, set **Source** to "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Updating stats
All numbers live in `stats.js`; team logos are in `logos.js`. Replace those files and push to update the site.
Pages use links like `#p-player-name-team`, `#t-team`, `#lg-michigan`, `#d-michigan-mccaa-eastern`, `#leaders`, `#rankings`.

After changing any file, raise the `?v=` number on its link in `index.html` so browsers load the new version right away.
