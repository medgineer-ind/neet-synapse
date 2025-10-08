# NEET Synapse

This is a futuristic, web-based planner designed to help students organize, track, and analyze their NEET preparation. It features task planning, progress dashboards, and operates fully offline using your browser's local storage.

---

## How to Deploy to GitHub Pages (A Step-by-Step Guide)

This application is built as a static website, which means it can be hosted for free and easily using GitHub Pages. The repository is already set up for **automatic deployment**. Just follow these steps precisely, and your planner will be live.

### Automatic Deployment with GitHub Actions

This is the recommended method. A workflow file (`.github/workflows/deploy.yml`) is already included in the repository. It will automatically build and deploy your website every time you push new code to the `main` branch.

**Step 1: Push the Latest Code**

First, ensure all the latest changes (including this updated `README.md` file) are committed and pushed to your `main` branch on GitHub.

**Step 2: Configure Your Repository for GitHub Actions Deployment**

This is the most crucial step. You only need to do this once.

1.  Navigate to your repository page on GitHub.
2.  Click the **Settings** tab (located near the top of the page).
3.  On the left-hand menu, click on **Pages**.
4.  You will see a section called "Build and deployment". Under **Source**, the dropdown will likely say "Deploy from a branch". **Change this to "GitHub Actions"**.

![GitHub Pages Settings](https://user-images.githubusercontent.com/1267982/190833333-11758413-2483-4927-9252-b67329944061.png)

That's it for configuration! The repository is now ready to be deployed by the workflow.

**Step 3: Check the Deployment Action**

1.  Click on the **Actions** tab at the top of your repository page.
2.  You should see a workflow run with the name "Deploy static content to Pages". It was likely triggered by your last push in Step 1.
3.  Wait for the workflow to complete. A yellow circle means it's in progress, and a green checkmark means it was successful. This usually takes 1-2 minutes.

**Step 4: Access Your Live Website!**

1.  Once the Action has a green checkmark, go back to **Settings > Pages**.
2.  At the top of the page, you will see a message: "Your site is live at: `https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/`".
3.  Click the link to see your deployed NEET Synapse!

> **Note:** It can sometimes take a few minutes for the site to become available after the first successful deployment.

---

## Mobile & Offline Use (Progressive Web App)

NEET Synapse is built as a Progressive Web App (PWA), which means you can "install" it on your phone for a native app-like experience, including offline access.

### How to Install

**On Android (using Chrome):**
1.  Open the NEET Synapse website in your Chrome browser.
2.  Tap the three-dot menu icon in the top-right corner.
3.  Tap **"Install app"** or **"Add to Home screen"**.
4.  Follow the on-screen prompts. The app will now appear on your home screen.

**On iOS (using Safari):**
1.  Open the NEET Synapse website in your Safari browser.
2.  Tap the "Share" icon (a square with an arrow pointing up) in the bottom navigation bar.
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Confirm by tapping "Add". The app will now appear on your home screen.

### PWA Icons
For the "Add to Home Screen" feature to display a proper icon, you'll need to add two icon files to the root directory of this project:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

These are referenced in the `manifest.json` file.

### Note on APKs
While a PWA provides a fantastic, installable, offline-first experience directly from the web, it does not generate an `.apk` file for the Google Play Store. To do that, one would typically use a tool like **Capacitor** or **Cordova** to wrap this web application into a native Android project. That process is beyond the scope of this project's current setup.

### Troubleshooting Common Issues

*   **I see a blank page or a "404 Not Found" error.**
    *   This was the main problem before, caused by a missing script tag in `index.html`. This is now fixed. If it still happens, wait a few minutes and try a "hard refresh" in your browser (`Ctrl+Shift+R` on Windows/Linux, `Cmd+Shift+R` on Mac).
    *   Also, double-check that your **Pages** source is set to **GitHub Actions** as described in Step 2.

*   **I've pushed a new change, but I don't see it on the website.**
    *   Go to the **Actions** tab to ensure the deployment workflow ran and was successful.
    *   Browsers often cache files. Do a hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`) to force the browser to download the latest version of your site.

*   **The GitHub Action failed (it has a red 'X').**
    *   Go to the **Actions** tab and click on the failed workflow.
    *   Click on the `deploy` job on the left to see the logs. The error message there will tell you exactly what went wrong.