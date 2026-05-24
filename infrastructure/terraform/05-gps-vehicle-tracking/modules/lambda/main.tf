data "archive_file" "process_gps_data" {
  type        = "zip"
  source_dir  = "${path.root}/lambda-src/process-gps-data"
  output_path = "${path.root}/lambda-src/dist/process-gps-data.zip"
}

data "archive_file" "check_command_timeout" {
  type        = "zip"
  source_dir  = "${path.root}/lambda-src/check-command-timeout"
  output_path = "${path.root}/lambda-src/dist/check-command-timeout.zip"
}

resource "aws_cloudwatch_log_group" "process_gps_data" {
  name              = "/aws/lambda/${var.project_name}-ProcessGPSData"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "check_command_timeout" {
  name              = "/aws/lambda/${var.project_name}-CheckCommandTimeout"
  retention_in_days = 14
}

resource "aws_lambda_function" "process_gps_data" {
  function_name    = "${var.project_name}-ProcessGPSData"
  filename         = data.archive_file.process_gps_data.output_path
  source_code_hash = data.archive_file.process_gps_data.output_base64sha256
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SNS_TOPIC_ARN = var.sns_topic_arn
      REGION        = var.aws_region
    }
  }

  depends_on = [aws_cloudwatch_log_group.process_gps_data]
}

resource "aws_lambda_function" "check_command_timeout" {
  function_name    = "${var.project_name}-CheckCommandTimeout"
  filename         = data.archive_file.check_command_timeout.output_path
  source_code_hash = data.archive_file.check_command_timeout.output_base64sha256
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"
  timeout          = 60
  memory_size      = 128

  depends_on = [aws_cloudwatch_log_group.check_command_timeout]
}

resource "aws_cloudwatch_event_rule" "check_command_timeout" {
  name                = "${var.project_name}-check-command-timeout"
  description         = "Fires every minute to mark stale commands as timed out"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "check_command_timeout" {
  rule      = aws_cloudwatch_event_rule.check_command_timeout.name
  target_id = "CheckCommandTimeout"
  arn       = aws_lambda_function.check_command_timeout.arn
}

resource "aws_lambda_permission" "allow_eventbridge_timeout" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_command_timeout.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.check_command_timeout.arn
}
