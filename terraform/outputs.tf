output "s3_bucket_name" {
  description = "S3 bucket that stores the static website files."
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name."
  value       = var.deploy_cloudfront ? aws_cloudfront_distribution.site[0].domain_name : null
}

output "acm_dns_validation_records" {
  description = "Create these CNAME records in Cloudflare DNS before the full Terraform apply."
  value = [
    for option in aws_acm_certificate.site.domain_validation_options : {
      domain       = option.domain_name
      type         = option.resource_record_type
      name         = option.resource_record_name
      target       = option.resource_record_value
      proxy_status = "DNS only"
      ttl          = "Auto"
    }
  ]
}

output "cloudflare_website_dns_records" {
  description = "Create these CNAME records in Cloudflare DNS after the full Terraform apply."
  value = var.deploy_cloudfront ? [
    for domain in local.site_domains : {
      domain       = domain
      type         = "CNAME"
      name         = domain == var.domain_name ? "@" : trimsuffix(domain, ".${var.domain_name}")
      target       = aws_cloudfront_distribution.site[0].domain_name
      proxy_status = "DNS only"
      ttl          = "Auto"
    }
  ] : []
}
