# Apex HTTPS correction

Audit date: 28 October 2026.

The www domain works. Vercel already has a verified redirect from `edmundspencerkatso.com` to `www.edmundspencerkatso.com`, but its domain API reports the apex DNS as misconfigured. Public DNS currently returns **both**:

- `195.34.83.112` — the old, non-Vercel address.
- `216.198.79.1` — an address recommended by Vercel.

This mixed destination prevents reliable apex HTTPS. The authoritative nameservers are Cloudpit (`cns1.cloudpit.de`, `cns2.cloudpit.com`, `cns3.cloudpit.io`), so changing application code or Vercel's redirect cannot remove the old DNS record.

## Required DNS change

In the domain's Cloudpit DNS settings, remove the apex (`@`) **A record pointing to `195.34.83.112`**. Keep the existing Vercel apex A record `216.198.79.1`. Vercel also currently recommends `64.29.17.1` in its first-ranked address set; use the project domain settings as the authority if recommendations change.

Keep the working www CNAME `1286254f316a064e.vercel-dns-017.com`. Leave MX, TXT and other email-verification records intact.

After DNS propagation, recheck the domain in Vercel and verify that `https://edmundspencerkatso.com` completes TLS and redirects to `https://www.edmundspencerkatso.com`.

No DNS records were modified during this audit: this workspace has Vercel access, but no authenticated Cloudpit DNS connection.
