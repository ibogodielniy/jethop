terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }

  # Optional: store state remotely. Uncomment and create the bucket/table first.
  # backend "s3" {
  #   bucket         = "jethop-tfstate"
  #   key            = "frontend/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "jethop-tflock"
  #   encrypt        = true
  # }
}

# CloudFront and its ACM certificate must live in us-east-1, so we keep the
# whole static-hosting stack in one region for simplicity.
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = merge(
      {
        Project   = var.project
        ManagedBy = "terraform"
      },
      var.tags,
    )
  }
}
