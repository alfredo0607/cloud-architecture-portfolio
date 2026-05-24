module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  aws_region   = var.aws_region
}

module "dynamodb" {
  source = "./modules/dynamodb"

  project_name = var.project_name
}

module "sns" {
  source = "./modules/sns"

  project_name = var.project_name
  alert_email  = var.alert_email
  alert_phone  = var.alert_phone
}

module "location_service" {
  source = "./modules/location_service"

  project_name = var.project_name
}

module "lambda" {
  source = "./modules/lambda"

  project_name    = var.project_name
  lambda_role_arn = module.iam.lambda_role_arn
  sns_topic_arn   = module.sns.topic_arn
  aws_region      = var.aws_region
}

module "iot_core" {
  source = "./modules/iot_core"

  project_name            = var.project_name
  aws_region              = var.aws_region
  process_gps_lambda_arn  = module.lambda.process_gps_data_arn
  process_gps_lambda_name = module.lambda.process_gps_data_name
  iot_device_imei         = var.iot_device_imei
}

module "cloudwatch" {
  source = "./modules/cloudwatch"

  project_name              = var.project_name
  lambda_process_gps_name   = module.lambda.process_gps_data_name
  lambda_check_timeout_name = module.lambda.check_command_timeout_name
  sns_topic_arn             = module.sns.topic_arn
}
