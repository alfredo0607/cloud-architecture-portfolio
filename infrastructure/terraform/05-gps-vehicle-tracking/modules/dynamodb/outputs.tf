output "table_names" {
  description = "Map of logical name to DynamoDB table name"
  value = {
    usuarios    = aws_dynamodb_table.usuarios.name
    gps         = aws_dynamodb_table.gps.name
    vehiculos   = aws_dynamodb_table.vehiculos.name
    coordenadas = aws_dynamodb_table.coordenadas.name
    comandos    = aws_dynamodb_table.comandos.name
    eventos     = aws_dynamodb_table.eventos.name
  }
}

output "table_arns" {
  description = "Map of logical name to DynamoDB table ARN"
  value = {
    usuarios    = aws_dynamodb_table.usuarios.arn
    gps         = aws_dynamodb_table.gps.arn
    vehiculos   = aws_dynamodb_table.vehiculos.arn
    coordenadas = aws_dynamodb_table.coordenadas.arn
    comandos    = aws_dynamodb_table.comandos.arn
    eventos     = aws_dynamodb_table.eventos.arn
  }
}
