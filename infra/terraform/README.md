# Terraform — JetHop static hosting (S3 + CloudFront)

Provisions the AWS infrastructure to host the Angular SPA: a private S3 bucket,
a CloudFront distribution (with Origin Access Control, SPA fallback and TLS), and
an ACM certificate. DNS lives at an **external registrar**, so the certificate is
validated by records you add by hand — the records are printed as outputs.

```
Browser ──HTTPS──▶ CloudFront ──OAC──▶ private S3 bucket
                       ▲
                  ACM cert (us-east-1)
```

## Prerequisites

- Terraform >= 1.5 and AWS CLI v2, authenticated with permission for S3,
  CloudFront and ACM.
- A globally-unique S3 bucket name.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit values
terraform init
```

## Apply (two steps, because DNS is external)

A single `apply` would block: CloudFront needs an **issued** certificate, but the
certificate can't validate until you add DNS records — which you can't see until
the cert exists. So create the certificate first, add the records, then apply the rest.

**1. Create the certificate and read the validation records:**

```bash
terraform apply -target=aws_acm_certificate.site
terraform output acm_validation_records
```

Add each printed CNAME (name → value) at your registrar.

**2. Apply everything:**

```bash
terraform apply
```

`aws_acm_certificate_validation` polls until ACM reports the cert ISSUED (up to
60 min), then CloudFront is created. Once done:

```bash
terraform output
```

## Point the domain at CloudFront

From `dns_records_to_add`:

- `www.jethop.app` → **CNAME** → `<cloudfront_domain_name>`
- Apex `jethop.app` → an **ALIAS/ANAME/CNAME-flattening** record to the same
  CloudFront domain (or move DNS to Route 53 for an Alias A record).

## Deploy the site

Terraform manages infra only; upload the build with the repo's deploy script:

```bash
cd ../..                              # repo root
export BUCKET=$(terraform -chdir=infra/terraform output -raw s3_bucket)
export DIST_ID=$(terraform -chdir=infra/terraform output -raw cloudfront_distribution_id)
./scripts/deploy.sh
```

## Teardown

```bash
terraform destroy
```

Empty the bucket first if `destroy` complains it is not empty
(`aws s3 rm s3://$BUCKET --recursive`).
