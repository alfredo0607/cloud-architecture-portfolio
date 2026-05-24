output "process_gps_data_arn" {
  description = "ARN of the ProcessGPSData Lambda function"
  value       = aws_lambda_function.process_gps_data.arn
}

output "process_gps_data_name" {
  description = "Name of the ProcessGPSData Lambda function"
  value       = aws_lambda_function.process_gps_data.function_name
}

output "check_command_timeout_arn" {
  description = "ARN of the CheckCommandTimeout Lambda function"
  value       = aws_lambda_function.check_command_timeout.arn
}

output "check_command_timeout_name" {
  description = "Name of the CheckCommandTimeout Lambda function"
  value       = aws_lambda_function.check_command_timeout.function_name
}
