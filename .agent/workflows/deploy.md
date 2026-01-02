---
description: Deploy Zenith Point v2 to free production hosting
---

Since Zenith Point v2 is a static application (HTML, CSS, JS), you can host it for free using several world-class providers.

### Option 1: GitHub Pages (Easiest if using GitHub)
1. Push your code to a GitHub repository.
2. Go to **Settings** > **Pages** in your repository.
3. Under **Build and deployment**, set the source to **Deploy from a branch**.
4. Select `main` (or your primary branch) and the `/ (root)` folder.
5. Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/` in a few minutes.

### Option 2: Vercel (Fastest Setup)
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New** > **Project**.
3. Import your repository.
4. Click **Deploy**. Vercel will automatically detect the static files and provide a production URL.

### Option 3: Netlify (Drag and Drop)
1. Go to [netlify.com](https://netlify.com).
2. You can either link your GitHub repo OR simply **Drag and Drop** your project folder (`Asymptote`) into the Netlify dashboard.
3. It will instantly deploy and give you a `netlify.app` URL.

### Important: Production Note
The game uses the **Web Audio API**. Ensure you are accessing the site via `https://` for the browser to allow audio features after the first user interaction.
