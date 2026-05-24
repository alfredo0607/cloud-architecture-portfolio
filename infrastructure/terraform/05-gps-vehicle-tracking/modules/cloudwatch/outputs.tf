output "alarm_process_gps_errors_arn" {
  description = "ARN of the ProcessGPSData errors CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_process_gps_errors.arn
}

output "alarm_check_timeout_errors_arn" {
  description = "ARN of the CheckCommandTimeout errors CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_check_timeout_errors.arn
}

output "alarm_dynamodb_errors_arn" {
  description = "ARN of the DynamoDB user errors CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.dynamodb_user_errors.arn
}
