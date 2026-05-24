resource "aws_cloudwatch_metric_alarm" "lambda_process_gps_errors" {
  alarm_name          = "${var.project_name}-ProcessGPSData-Errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "ProcessGPSData Lambda has more than 5 errors in a 5-minute window"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_process_gps_name
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_check_timeout_errors" {
  alarm_name          = "${var.project_name}-CheckCommandTimeout-Errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "CheckCommandTimeout Lambda has more than 5 errors in a 5-minute window"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = var.lambda_check_timeout_name
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_user_errors" {
  alarm_name          = "${var.project_name}-DynamoDB-UserErrors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB has more than 10 user errors in a 5-minute window (possible throttling)"
  alarm_actions       = [var.sns_topic_arn]
  treat_missing_data  = "notBreaching"
}
