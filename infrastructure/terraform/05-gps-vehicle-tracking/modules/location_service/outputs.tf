output "map_name" {
  description = "Name of the Location Service map — use as VITE_MAP_NAME in frontend .env"
  value       = aws_location_map.fleet_tracker.map_name
}

output "map_arn" {
  description = "ARN of the Location Service map"
  value       = aws_location_map.fleet_tracker.map_arn
}

output "tracker_name" {
  description = "Name of the Location Service tracker"
  value       = aws_location_tracker.vehicle_tracker.tracker_name
}

output "tracker_arn" {
  description = "ARN of the Location Service tracker"
  value       = aws_location_tracker.vehicle_tracker.tracker_arn
}
