variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "process_gps_lambda_arn" {
  description = "ARN of the ProcessGPSData Lambda function invoked by IoT rules"
  type        = string
}

variable "process_gps_lambda_name" {
  description = "Name of the ProcessGPSData Lambda function (used for permissions)"
  type        = string
}

variable "iot_device_imei" {
  description = "IMEI of the Teltonika GPS — used as IoT Thing name. Empty string skips Thing creation."
  type        = string
  default     = ""
}
