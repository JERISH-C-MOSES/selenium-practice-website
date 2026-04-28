# Selenium Practice Portal

This is the standalone Selenium practice website.

It includes focused labs for alerts, checkboxes, frames, dropdowns, tables, pagination, date pickers, mouse actions, keyboard actions, uploads, browser capabilities, Shadow DOM, SVG, broken links, and data-driven testing.

## Run Locally

```powershell
npm start
```

Open:

- http://localhost:3000

Default local portal credentials:

- `JERISH` / `Jerish@123`

## Check Before Push

```powershell
npm run check
```

## Push To GitHub

From this folder:

```powershell
cd "C:\Users\hello\OneDrive\Documents\New project\selenium-practice-website"
git init
git add .
git commit -m "Initial Selenium practice portal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_SELENIUM_REPOSITORY.git
git push -u origin main
```

This project needs the Node backend for login/session behavior. GitHub Pages alone will not run the backend APIs.
