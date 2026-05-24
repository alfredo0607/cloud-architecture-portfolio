data "aws_iot_endpoint" "current" {
  endpoint_type = "iot:Data-ATS"
}

resource "aws_iot_policy" "vehicle_gps" {
  name = "VehicleGPSPolicy"

  # $${} escapes Terraform interpolation so the IoT substitution template is preserved in the JSON
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "iot:Connect"
        Resource = "arn:aws:iot:${var.aws_region}:*:client/$${iot:Connection.Thing.ThingName}"
      },
      {
        Effect = "Allow"
        Action = "iot:Publish"
        Resource = [
          "arn:aws:iot:${var.aws_region}:*:topic/vehicles/$${iot:Connection.Thing.ThingName}/data",
          "arn:aws:iot:${var.aws_region}:*:topic/vehicles/$${iot:Connection.Thing.ThingName}/response"
        ]
      },
      {
        Effect = "Allow"
        Action = "iot:Subscribe"
        Resource = [
          "arn:aws:iot:${var.aws_region}:*:topicfilter/vehicles/$${iot:Connection.Thing.ThingName}/commands"
        ]
      },
      {
        Effect = "Allow"
        Action = "iot:Receive"
        Resource = [
          "arn:aws:iot:${var.aws_region}:*:topic/vehicles/$${iot:Connection.Thing.ThingName}/commands"
        ]
      }
    ]
  })
}

resource "aws_iot_thing" "vehicle_gps" {
  count = var.iot_device_imei != "" ? 1 : 0
  name  = var.iot_device_imei

  # After terraform apply, create a certificate manually in the AWS console,
  # attach VehicleGPSPolicy, and download the cert + private key for the GPS device.
}

resource "aws_iam_role" "iot_rule" {
  name = "${var.project_name}-iot-rule-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "iot.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "iot_lambda_invoke" {
  name = "${var.project_name}-iot-lambda-invoke"
  role = aws_iam_role.iot_rule.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = var.process_gps_lambda_arn
    }]
  })
}

resource "aws_iot_topic_rule" "process_gps_data" {
  name        = "ProcessGPSData"
  description = "Routes GPS location messages to ProcessGPSData Lambda"
  enabled     = true
  sql         = "SELECT *, topic(2) as deviceId, clientId() as clientId FROM 'vehicles/+/data' WHERE NOT isUndefined(latlng)"
  sql_version = "2016-03-23"

  lambda {
    function_arn = var.process_gps_lambda_arn
  }

  error_action {
    cloudwatch_logs {
      log_group_name = "/aws/iot/rule-errors"
      role_arn       = aws_iam_role.iot_rule.arn
    }
  }
}

resource "aws_iot_topic_rule" "process_command_response" {
  name        = "ProcessCommandResponse"
  description = "Routes command response messages (RSP field) to ProcessGPSData Lambda"
  enabled     = true
  sql         = "SELECT *, topic(2) as deviceId, clientId() as clientId FROM 'vehicles/+/data' WHERE NOT isUndefined(RSP)"
  sql_version = "2016-03-23"

  lambda {
    function_arn = var.process_gps_lambda_arn
  }

  error_action {
    cloudwatch_logs {
      log_group_name = "/aws/iot/rule-errors"
      role_arn       = aws_iam_role.iot_rule.arn
    }
  }
}

resource "aws_lambda_permission" "iot_process_gps" {
  statement_id  = "AllowIoTInvokeProcessGPS"
  action        = "lambda:InvokeFunction"
  function_name = var.process_gps_lambda_name
  principal     = "iot.amazonaws.com"
  source_arn    = aws_iot_topic_rule.process_gps_data.arn
}

resource "aws_lambda_permission" "iot_process_command" {
  statement_id  = "AllowIoTInvokeProcessCommand"
  action        = "lambda:InvokeFunction"
  function_name = var.process_gps_lambda_name
  principal     = "iot.amazonaws.com"
  source_arn    = aws_iot_topic_rule.process_command_response.arn
}
