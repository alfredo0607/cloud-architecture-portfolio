variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "lambda_role_arn" {
  description = "ARN of the IAM role that Lambda functions will assume"
  type        = string
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic used for ignition alert notifications"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
