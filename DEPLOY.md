# Deploying JetHop to AWS (S3 + CloudFront)

> **Recommended: use the Terraform module in [`infra/terraform/`](infra/terraform/README.md)**,
> which provisions everything below as code. The manual steps here are a reference / fallback for
> understanding what the module creates.

The frontend is a static Angular SPA, so hosting is: a **private S3 bucket** (origin) behind
**CloudFront** (CDN + TLS + SPA routing), with an **ACM** certificate and DNS at your registrar.

```
Browser ── HTTPS ──▶ CloudFront ──(Origin Access Control)──▶ private S3 bucket
                         ▲
                    ACM cert (us-east-1)        CNAME/ALIAS records @ registrar
```

> Do **not** enable S3 "static website hosting". That endpoint is HTTP-only and public.
> We keep the bucket private and serve it through CloudFront over HTTPS using Origin Access
> Control (OAC).

---

## 0. Prerequisites

- AWS account + **AWS CLI v2** configured (`aws configure`) with an IAM principal allowed to use
  S3, CloudFront and ACM.
- Node 18+ (to build).
- Domain `jethop.app` at your registrar with access to edit DNS records.

Set these shell variables (Git Bash / Linux / macOS) and reuse them below:

```bash
export BUCKET=jethop-app-site          # must be globally unique
export DOMAIN=jethop.app
export WWW=www.jethop.app
export REGION=us-east-1               # simplest: keep everything in us-east-1
```

---

## 1. Build the app

```bash
npm ci
npm run build
# Output: dist/jethop/browser/   <-- note the nested browser/ (Angular 19 application builder)
```

---

## 2. Create the private S3 bucket

```bash
aws s3api create-bucket --bucket "$BUCKET" --region us-east-1

aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

(For a region other than `us-east-1`, add
`--create-bucket-configuration LocationConstraint=$REGION`.)

---

## 3. Request the TLS certificate (ACM — MUST be us-east-1)

```bash
CERT_ARN=$(aws acm request-certificate --region us-east-1 \
  --domain-name "$DOMAIN" \
  --subject-alternative-names "$WWW" \
  --validation-method DNS \
  --query CertificateArn --output text)
echo "$CERT_ARN"

# Show the DNS validation records to add at your registrar:
aws acm describe-certificate --region us-east-1 --certificate-arn "$CERT_ARN" \
  --query "Certificate.DomainValidationOptions[].ResourceRecord"
```

Add the returned **CNAME** name/value pairs at your registrar, then wait until issued:

```bash
aws acm wait certificate-validated --region us-east-1 --certificate-arn "$CERT_ARN"
```

---

## 4. Create the Origin Access Control

```bash
OAC_ID=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config \
  Name=jethop-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3 \
  --query OriginAccessControl.Id --output text)
echo "$OAC_ID"
```

---

## 5. Create the CloudFront distribution

Easiest via the **console** (CloudFront → Create distribution) with these settings:

| Setting | Value |
|---|---|
| Origin domain | `jethop-app-site.s3.us-east-1.amazonaws.com` (pick the bucket, **not** the website endpoint) |
| Origin access | **Origin access control**, select `jethop-oac` |
| Viewer protocol policy | Redirect HTTP to HTTPS |
| Compress objects automatically | Yes |
| Cache policy | `CachingOptimized` (managed) |
| Default root object | `index.html` |
| Alternate domain names (CNAMEs) | `jethop.app`, `www.jethop.app` |
| Custom SSL certificate | the ACM cert from step 3 |

Then add **Custom error responses** (this is the SPA deep-link fix — without it,
`/route/YYZ-KEF-LHR-FCO` 404s on refresh):

| HTTP error code | Response page path | HTTP response code | Min TTL |
|---|---|---|---|
| 403 | `/index.html` | 200 | 0 |
| 404 | `/index.html` | 200 | 0 |

After it's created, note the **Distribution domain name** (`dXXXXXXXX.cloudfront.net`) and the
**Distribution ARN**.

---

## 6. Bucket policy — allow only this distribution to read

Save as `bucket-policy.json` (replace the two placeholders), then apply:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontRead",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::jethop-app-site/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

```bash
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file://bucket-policy.json
```

> Only `s3:GetObject` is granted (not `s3:ListBucket`), so missing keys return **403** — which is
> exactly why step 5 maps 403 → `/index.html`.

---

## 7. DNS at your registrar

1. **Cert validation CNAMEs** from step 3 (if not added yet).
2. **`www.jethop.app`** → `CNAME` → `dXXXXXXXX.cloudfront.net`
3. **Apex `jethop.app`** — a plain CNAME at the apex is not allowed by DNS. Pick one:
   - **A. Registrar supports ALIAS / ANAME / CNAME-flattening** (Cloudflare, DNSimple, etc.):
     point apex → `dXXXXXXXX.cloudfront.net`.
   - **B. Move DNS hosting to Route 53 (cleanest, ~$0.50/mo)** — keep your registrar, just change
     its nameservers to the Route 53 hosted zone, then add an **Alias A/AAAA** record at the apex
     pointing to the CloudFront distribution.
   - **C. Serve canonically on `www`** and add an apex → www redirect at the registrar (or a small
     S3 redirect bucket).

DNS + CloudFront propagation can take 15–60 min the first time.

---

## 8. Deploy / redeploy

```bash
export BUCKET=jethop-app-site
export DIST_ID=dXXXXXXXX            # CloudFront distribution id
./scripts/deploy.sh
```

The script builds, syncs to S3 with correct cache headers (immutable for hashed assets,
`no-cache` for `index.html`), and invalidates CloudFront.

---

## 9. Post-launch checklist

- [ ] **Restrict the Mapbox token** to `https://jethop.app/*` and `https://www.jethop.app/*` at
      https://account.mapbox.com/access-tokens/ (the public token ships in the JS bundle).
- [ ] Promote `dev` → **`main`** and deploy from `main`; keep `dev` for development.
- [ ] (Optional) Add a GitHub Action that runs `scripts/deploy.sh` on push to `main`.
- [ ] When the .NET/Neo4j backend lands, host it separately (App Runner or ECS Fargate) on
      `api.jethop.app`, use Neo4j AuraDB, and enable CORS for `https://jethop.app`.
```
