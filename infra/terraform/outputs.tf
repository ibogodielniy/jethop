output "s3_bucket" {
  description = "Name of the S3 bucket holding the site (use as BUCKET for deploy.sh)."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution id (use as DIST_ID for deploy.sh)."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain to point your DNS records at."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "acm_validation_records" {
  description = "CNAME records to add at your registrar to validate the certificate."
  value = [
    for o in aws_acm_certificate.site.domain_validation_options : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }
  ]
}

output "dns_records_to_add" {
  description = "DNS records to add at your registrar so the domain serves the site."
  value = {
    www_cname = {
      name  = var.www_domain
      type  = "CNAME"
      value = aws_cloudfront_distribution.site.domain_name
    }
    apex = "Point ${var.domain} to ${aws_cloudfront_distribution.site.domain_name} via an ALIAS/ANAME/CNAME-flattening record, or move DNS to Route 53 and use an Alias A record."
  }
}
