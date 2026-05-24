resource "aws_sns_topic" "ignition_alerts" {
  name         = "VehicleIgnitionAlerts"
  display_name = "Fleet Tracker - Ignition Alerts"
}

# resource "aws_sns_topic_subscription" "email" {
#   count     = var.alert_email != "" ? 1 : 0
#   topic_arn = aws_sns_topic.ignition_alerts.arn
#   protocol  = "email"
#   endpoint  = var.alert_email
# }

resource "aws_sns_topic_subscription" "sms" {
  count     = var.alert_phone != "" ? 1 : 0
  topic_arn = aws_sns_topic.ignition_alerts.arn
  protocol  = "sms"
  endpoint  = var.alert_phone
}
