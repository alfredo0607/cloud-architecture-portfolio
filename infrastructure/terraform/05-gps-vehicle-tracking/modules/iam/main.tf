resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_dynamodb" {
  name        = "${var.project_name}-lambda-dynamodb-policy"
  description = "Allows Lambda to read/write all fleet tracker DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ]
      Resource = [
        "arn:aws:dynamodb:${var.aws_region}:*:table/GPS",
        "arn:aws:dynamodb:${var.aws_region}:*:table/Coordenadas",
        "arn:aws:dynamodb:${var.aws_region}:*:table/Vehiculos",
        "arn:aws:dynamodb:${var.aws_region}:*:table/Comandos",
        "arn:aws:dynamodb:${var.aws_region}:*:table/Eventos",
        "arn:aws:dynamodb:${var.aws_region}:*:table/Usuarios",
        "arn:aws:dynamodb:${var.aws_region}:*:table/*/index/*"
      ]
    }]
  })
}

resource "aws_iam_policy" "lambda_location" {
  name        = "${var.project_name}-lambda-location-policy"
  description = "Allows Lambda to update device positions in Location Service"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["geo:BatchUpdateDevicePosition"]
      Resource = "arn:aws:geo:${var.aws_region}:*:tracker/VehicleTracker"
    }]
  })
}

resource "aws_iam_policy" "lambda_sns" {
  name        = "${var.project_name}-lambda-sns-policy"
  description = "Allows Lambda to publish ignition alerts to SNS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sns:Publish"]
      Resource = "arn:aws:sns:${var.aws_region}:*:VehicleIgnitionAlerts"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_dynamodb.arn
}

resource "aws_iam_role_policy_attachment" "lambda_location" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_location.arn
}

resource "aws_iam_role_policy_attachment" "lambda_sns" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_sns.arn
}
