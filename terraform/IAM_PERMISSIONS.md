# IAM Permissions

For this Terraform stack, the IAM user needs permissions for these AWS services:

- S3, to create the bucket, configure private access, set bucket policy, and upload website files.
- CloudFront, to create the CDN distribution and origin access control.
- ACM, to create and validate the HTTPS certificate.

## Simple Managed Policy Setup

For the first deployment, these AWS managed policies are enough:

- `AmazonS3FullAccess`
- `CloudFrontFullAccess`
- `AWSCertificateManagerFullAccess`

You do not need Route 53 permissions for this version because DNS stays in Cloudflare.

`AmazonEC2FullAccess` is not enough for S3. EC2 and S3 are separate services. EC2 access is also not required by this website stack because it does not create servers.

## Cloudflare DNS

The AWS IAM user does not need Cloudflare permissions. You will add the DNS records manually in the Cloudflare dashboard.

## Optional Tighter Access

After the first deployment works, replace full-access managed policies with a narrower custom policy that allows only the required S3 bucket, certificate, and CloudFront actions.
