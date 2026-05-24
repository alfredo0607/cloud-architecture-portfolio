variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
}

variable "alert_email" {
  description = "Email address for ignition alert subscriptions"
  type        = string
}

variable "alert_phone" {
  description = "Phone number for SMS alerts (E.164). Empty string disables SMS."
  type        = string
  default     = ""
}
