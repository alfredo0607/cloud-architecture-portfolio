output "iot_endpoint" {
  description = "AWS IoT Core ATS endpoint — configure this as the MQTT broker in the Teltonika GPS"
  value       = module.iot_core.endpoint
}

output "sns_topic_arn" {
  description = "ARN of the VehicleIgnitionAlerts SNS topic — set as SNS_TOPIC_ARN in Lambda env vars"
  value       = module.sns.topic_arn
}

output "dynamodb_table_names" {
  description = "Names of all DynamoDB tables created"
  value       = module.dynamodb.table_names
}

output "lambda_process_gps_arn" {
  description = "ARN of the ProcessGPSData Lambda function"
  value       = module.lambda.process_gps_data_arn
}

output "lambda_check_timeout_arn" {
  description = "ARN of the CheckCommandTimeout Lambda function"
  value       = module.lambda.check_command_timeout_arn
}

output "location_map_name" {
  description = "AWS Location Service map name — set as VITE_MAP_NAME in frontend .env"
  value       = module.location_service.map_name
}

output "location_tracker_name" {
  description = "AWS Location Service tracker name"
  value       = module.location_service.tracker_name
}

output "iot_policy_arn" {
  description = "ARN of the VehicleGPSPolicy — attach to IoT certificates manually"
  value       = module.iot_core.policy_arn
}
