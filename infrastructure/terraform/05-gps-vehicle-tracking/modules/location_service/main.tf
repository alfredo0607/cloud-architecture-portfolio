resource "aws_location_map" "fleet_tracker" {
  map_name    = "FleetTrackerMap"
  description = "Map for real-time fleet vehicle tracking dashboard"

  configuration {
    style = "VectorEsriStreets"
  }
}

resource "aws_location_tracker" "vehicle_tracker" {
  tracker_name       = "VehicleTracker"
  description        = "Tracks real-time GPS positions of fleet vehicles"
  position_filtering = "TimeBased"
}
