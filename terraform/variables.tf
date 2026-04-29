variable "aws_region" {
  description = "AWS region for the S3 bucket. The ACM certificate is always created in us-east-1 for CloudFront."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Primary domain name for the website, for example dozarc.com."
  type        = string
}

variable "alternate_domain_names" {
  description = "Additional domain names for the same website, for example www.dozarc.com."
  type        = list(string)
  default     = []
}

variable "bucket_name" {
  description = "S3 bucket name. If empty, the primary domain name is used."
  type        = string
  default     = null
}

variable "deploy_cloudfront" {
  description = "Set to true after the ACM DNS validation records are added in Cloudflare and the certificate is issued."
  type        = bool
  default     = false
}
