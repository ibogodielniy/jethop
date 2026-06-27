# SEO & Analytics setup — jethop.app

All three tools below are **free**. The code side (sitemap, robots, meta,
structured data, analytics beacon) is already in the repo; what's left are the
dashboard/DNS steps that only you can do with your accounts.

The `og-image.png` referenced by the social tags doesn't exist yet — add a
1200×630 PNG at `public/og-image.png` for rich link previews (optional; the
rest works without it).

---

## 1. Cloudflare Web Analytics (traffic — free, cookieless, no consent banner)

Works even though DNS is "DNS only" / the site is on AWS CloudFront, because we
use the JS-beacon mode.

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics → Add a site**.
2. Enter `jethop.app`. Choose **"Add a site manually"** (JS snippet), *not* the
   proxied option.
3. Copy the **token** from the generated snippet (the `token` value).
4. Paste it into `src/index.html`, replacing `REPLACE_WITH_CLOUDFLARE_TOKEN`.
5. Redeploy (`scripts/deploy.sh`). Data appears within a few minutes of real
   visits. (`"spa":true` is already set so Angular route changes count as views.)

---

## 2. Google Search Console (the actual SEO dashboard — queries, impressions, indexing)

Use a **Domain property** (covers http/https + all subdomains) verified by DNS.

1. https://search.google.com/search-console → **Add property → Domain** → `jethop.app`.
2. Google shows a **TXT record** like `google-site-verification=XXXXXXXX`.
3. Cloudflare → **DNS → Records → Add record**: Type `TXT`, Name `@`,
   Content = the full `google-site-verification=...` string. Save.
4. Back in Search Console click **Verify** (DNS can take a few minutes).
5. **Sitemaps** → submit `https://jethop.app/sitemap.xml`.

What you'll see (after Google crawls, days–weeks): search queries you rank for,
impressions, clicks, average position, and Index Coverage (what's indexed / why
not).

---

## 3. Bing Webmaster Tools (Bing + DuckDuckGo + Copilot — free, ~2 min)

1. https://www.bing.com/webmasters → **Import from Google Search Console**
   (one-click; reuses the verification above), or add `jethop.app` and verify
   via the same DNS TXT method.
2. Submit the sitemap: `https://jethop.app/sitemap.xml`.

---

## What's already in the codebase

| File | Purpose |
|------|---------|
| `public/robots.txt` | Allows all crawlers; points to the sitemap. |
| `public/sitemap.xml` | Lists `/` (update `lastmod` / add URLs as the app grows). |
| `src/index.html` | Canonical, Open Graph, Twitter cards, `theme-color`, JSON-LD `WebApplication`, Cloudflare beacon (host-guarded). |

## SPA caveat (do this for real ranking, not just tracking)

Angular is client-rendered, so crawlers initially see an empty `<app-root>`.
Google executes JS and will still index it, but slower and less reliably; Bing
and social scrapers often won't. To fix, **prerender the landing route** to
static HTML:

```bash
ng add @angular/ssr        # adds SSR/prerender support
ng build                   # prerenders routes to real HTML at build time
```

Then the deployed `/index.html` ships with actual content + meta already in the
markup. This is the single biggest lever for indexing an Angular SPA — worth
doing once the analytics confirm there's search traffic to capture.
