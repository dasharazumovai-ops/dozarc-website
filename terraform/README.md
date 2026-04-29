# AWS Static Website Hosting

This Terraform stack deploys the static website to AWS:

- S3 stores the website files privately.
- CloudFront serves the files over HTTPS.
- ACM creates the TLS certificate in `us-east-1`, which CloudFront requires.
- Cloudflare keeps DNS management for the domain.

CloudFront is disabled at first so Terraform can output ACM DNS validation records before waiting for the certificate.

## Configure

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set your real domain:

```hcl
domain_name = "dozarc.com"

alternate_domain_names = [
  "www.dozarc.com",
]

deploy_cloudfront = false
```

## Deploy

Run Terraform from this directory:

```bash
terraform init
```

First create the S3 bucket, upload files, and request the ACM certificate:

```bash
terraform apply
terraform output acm_dns_validation_records
```

Add each output item to Cloudflare DNS.

After ACM shows the certificate as issued, set this in `terraform.tfvars`:

```hcl
deploy_cloudfront = true
```

Then create CloudFront:

```bash
terraform plan
terraform apply
```

When Terraform finishes, run:

```bash
terraform output cloudflare_website_dns_records
```

Add each output item to Cloudflare DNS.

## Cloudflare DNS Records

Terraform prints these records after the full apply:

```text
Type: CNAME
Name: @
Target: <target from Terraform output>
Proxy status: DNS only
TTL: Auto
```

```text
Type: CNAME
Name: www
Target: <target from Terraform output>
Proxy status: DNS only
TTL: Auto
```

Cloudflare supports CNAME flattening, so a CNAME for the root domain `@` is valid there.

For the ACM validation records, use the exact values from `terraform output acm_dns_validation_records`:

```text
Type: CNAME
Name: <name from Terraform output>
Target: <target from Terraform output>
Proxy status: DNS only
TTL: Auto
```

Keep ACM validation records as `DNS only`. Do not proxy them.

## Notes

This stack does not create Route 53 hosted zones or DNS records.

Terraform uploads files from the repository root and excludes Git, editor, Terraform, and README files.
