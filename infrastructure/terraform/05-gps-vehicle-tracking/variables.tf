variable "aws_region" {
  description = "AWS region where all resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name used as prefix for resource naming"
  type        = string
  default     = "fleet-tracker"
}

variable "alert_email" {
  description = "Email address that will receive ignition alerts and CloudWatch alarm notifications"
  type        = string
}

variable "alert_phone" {
  description = "Phone number for SMS alerts in E.164 format (e.g. +573001234567). Leave empty to skip SMS subscription."
  type        = string
  default     = ""
}

variable "iot_device_imei" {
  description = "IMEI of the Teltonika GPS device. Used as IoT Thing name. Leave empty to skip Thing creation."
  type        = string
  default     = ""
}
