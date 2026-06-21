variable "project" {
  description = "Project name, used for tagging and resource naming."
  type        = string
  default     = "jethop"
}

variable "bucket_name" {
  description = "Globally-unique S3 bucket name for the site origin (e.g. jethop-app-site)."
  type        = string
}

variable "domain" {
  description = "Apex domain to serve the site on."
  type        = string
  default     = "jethop.app"
}

variable "www_domain" {
  description = "www subdomain (added as a CloudFront alternate name)."
  type        = string
  default     = "www.jethop.app"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = NA + Europe (cheapest)."
  type        = string
  default     = "PriceClass_100"
}

variable "tags" {
  description = "Extra tags applied to all resources."
  type        = map(string)
  default     = {}
}
