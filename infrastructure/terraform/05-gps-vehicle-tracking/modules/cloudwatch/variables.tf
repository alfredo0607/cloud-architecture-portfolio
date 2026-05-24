variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "lambda_process_gps_name" {
  description = "Name of the ProcessGPSData Lambda function"
  type        = string
}

variable "lambda_check_timeout_name" {
  description = "Name of the CheckCommandTimeout Lambda function"
  type        = string
}

variable "sns_topic_arn" {
  description = "SNS topic ARN that receives CloudWatch alarm notifications"
  type        = string
}
