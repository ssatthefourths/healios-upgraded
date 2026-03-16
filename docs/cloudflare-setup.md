# Cloudflare Deployment Guide

This guide provides step-by-step instructions for deploying the Healios platform to **Cloudflare Pages**.

## Prerequisites

- A Cloudflare account.
- Access to the GitHub repository.
- Your Supabase environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).

## Step 1: Connect GitHub to Cloudflare

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** in the sidebar.
3. Click **Create application** > **Pages** > **Connect to Git**.
4. Select the `healios-upgraded` repository.

## Step 2: Configure Build Settings

Once the repository is connected, configure the following build settings:

- **Project name**: `healios` (or your preferred name)
- **Production branch**: `main`
- **Framework preset**: `Vite`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

## Step 3: Set Environment Variables

Before triggering the first build, you must add your environment variables:

1. In the Cloudflare Pages project settings, go to **Settings** > **Environment variables**.
2. Add the following variables for both **Production** and **Preview** environments:
   - `VITE_SUPABASE_URL`: Your Supabase URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

3. *Optional*: If you use any other `VITE_` variables, add them here as well.

## Step 4: Deploy

1. Click **Save and Deploy**.
2. Cloudflare will clone the repo, install dependencies, and build the project.
3. Once finished, you will receive a unique URL (e.g., `healios.pages.dev`).

## Step 5: Custom Domain (Optional)

1. In your Pages project, go to **Custom domains**.
2. Click **Set up a custom domain**.
3. Follow the instructions to point your domain to the Cloudflare Pages application.

## Troubleshooting

### Build Failures
- Ensure `node` version is set correctly. Cloudflare defaults to a specific version; you can set `NODE_VERSION` as an environment variable (e.g., `20`) if needed.
- Check the build logs in the Cloudflare Dashboard for specific errors.

### "Not Found" on Page Refresh
Vite projects are Single Page Applications (SPAs). If you refresh a subpage (e.g., `/shop`) and get a 404, you need to add a `_redirects` file to the `public` folder:

1. Create `public/_redirects`.
2. Add the following line:
   ```text
   /* /index.html 200
   ```
3. Commit and push this change. Cloudflare will automatically handle routing to `index.html`.

---

*Last Updated: 2026-03-16*
