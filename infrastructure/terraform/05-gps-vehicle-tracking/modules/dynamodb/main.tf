resource "aws_dynamodb_table" "usuarios" {
  name         = "Usuarios"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "gps" {
  name         = "GPS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gpsId"

  attribute {
    name = "gpsId"
    type = "S"
  }

  attribute {
    name = "deviceId"
    type = "S"
  }

  global_secondary_index {
    name            = "deviceId-index"
    hash_key        = "deviceId"
    projection_type = "ALL"
  }


  global_secondary_index {
    name            = "vehicleId-index"
    hash_key        = "vehicleId"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "vehiculos" {
  name         = "Vehiculos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "vehicleId"

  attribute {
    name = "vehicleId"
    type = "S"
  }

  global_secondary_index {
    name            = "plate-index"
    hash_key        = "plate"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "coordenadas" {
  name         = "Coordenadas"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "coordenadaId"

  attribute {
    name = "coordenadaId"
    type = "S"
  }

  attribute {
    name = "gpsId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "gpsId-timestamp-index"
    hash_key        = "gpsId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_dynamodb_table" "comandos" {
  name         = "Comandos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "commandId"

  attribute {
    name = "commandId"
    type = "S"
  }

  attribute {
    name = "gpsId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "gpsId-createdAt-index"
    hash_key        = "gpsId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "eventos" {
  name         = "Eventos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventoId"

  attribute {
    name = "eventoId"
    type = "S"
  }

  attribute {
    name = "vehicleId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "vehicleId-timestamp-index"
    hash_key        = "vehicleId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
