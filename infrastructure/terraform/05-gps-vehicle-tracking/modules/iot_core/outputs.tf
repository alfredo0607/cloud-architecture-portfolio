output "endpoint" {
  description = "IoT Core ATS endpoint — configure as MQTT broker in the Teltonika GPS (port 8883)"
  value       = data.aws_iot_endpoint.current.endpoint_address
}

output "policy_arn" {
  description = "ARN of VehicleGPSPolicy — attach to each device certificate"
  value       = aws_iot_policy.vehicle_gps.arn
}

output "rule_process_gps_arn" {
  description = "ARN of the ProcessGPSData IoT rule"
  value       = aws_iot_topic_rule.process_gps_data.arn
}

output "rule_process_command_arn" {
  description = "ARN of the ProcessCommandResponse IoT rule"
  value       = aws_iot_topic_rule.process_command_response.arn
}
