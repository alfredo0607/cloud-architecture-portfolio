output "topic_arn" {
  description = "ARN of the VehicleIgnitionAlerts SNS topic"
  value       = aws_sns_topic.ignition_alerts.arn
}

output "topic_name" {
  description = "Name of the VehicleIgnitionAlerts SNS topic"
  value       = aws_sns_topic.ignition_alerts.name
}
