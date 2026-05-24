# Backend - GPS Vehicle Tracking System

API REST construida con Node.js + Express que gestiona autenticación, vehículos, GPS, comandos remotos e integración con servicios AWS.

---

## Tecnologías

| Tecnología   | Versión  | Propósito         |
| ------------ | -------- | ----------------- |
| Node.js      | 18.x     | Runtime           |
| Express      | 4.19.2   | Web framework     |
| AWS SDK      | 2.1691.0 | AWS services      |
| bcryptjs     | 2.4.3    | Hashing passwords |
| jsonwebtoken | 9.0.2    | JWT auth          |
| uuid         | 10.0.0   | ID generation     |
| dotenv       | 16.4.5   | Environment vars  |
| cors         | 2.8.5    | CORS middleware   |

---

## Instalación

```bash
npm install
```

Para desarrollo con auto-reload:

```bash
npm install --save-dev nodemon
```

---

## Variables de Entorno

Crear archivo `.env` en la raíz del backend:

```env
# Server
PORT=3000
NODE_ENV=development

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
IOT_ENDPOINT=a28bbd2b4768x7-ats.iot.us-east-1.amazonaws.com

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## Estructura del Código

```
backend/
├── src/
│   ├── config/
│   │   └── index.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── gps.controller.js
│   │   ├── vehicles.controller.js
│   │   └── commands.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── gps.routes.js
│   │   ├── vehicles.routes.js
│   │   └── commands.routes.js
│   ├── services/
│   │   ├── aws/
│   │   │   ├── dynamodb.service.js
│   │   │   └── iot-commands.service.js
│   │   └── database/
│   │       ├── gps.service.js
│   │       ├── vehicles.service.js
│   │       └── commands.service.js
│   └── utils/
│       ├── response.js
│       └── logger.js
├── .env
├── package.json
└── server.js
```

---

## Tablas DynamoDB

Crear las siguientes tablas en AWS DynamoDB antes de iniciar el servidor.

### Usuarios

```javascript
{
  TableName: 'Usuarios',
  KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' },
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [{
    IndexName: 'email-index',
    KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
    Projection: { ProjectionType: 'ALL' }
  }],
  BillingMode: 'PAY_PER_REQUEST'
}
```

### GPS

```javascript
{
  TableName: 'GPS',
  KeySchema: [{ AttributeName: 'gpsId', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'gpsId', AttributeType: 'S' },
    { AttributeName: 'deviceId', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [{
    IndexName: 'deviceId-index',
    KeySchema: [{ AttributeName: 'deviceId', KeyType: 'HASH' }],
    Projection: { ProjectionType: 'ALL' }
  }],
  BillingMode: 'PAY_PER_REQUEST'
}
```

### Vehiculos

```javascript
{
  TableName: 'Vehiculos',
  KeySchema: [{ AttributeName: 'vehicleId', KeyType: 'HASH' }],
  AttributeDefinitions: [{ AttributeName: 'vehicleId', AttributeType: 'S' }],
  BillingMode: 'PAY_PER_REQUEST'
}
```

### Coordenadas

```javascript
{
  TableName: 'Coordenadas',
  KeySchema: [{ AttributeName: 'coordenadaId', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'coordenadaId', AttributeType: 'S' },
    { AttributeName: 'gpsId', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'N' }
  ],
  GlobalSecondaryIndexes: [{
    IndexName: 'gpsId-timestamp-index',
    KeySchema: [
      { AttributeName: 'gpsId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'ALL' }
  }],
  TimeToLiveSpecification: { Enabled: true, AttributeName: 'ttl' },
  BillingMode: 'PAY_PER_REQUEST'
}
```

### Comandos

```javascript
{
  TableName: 'Comandos',
  KeySchema: [{ AttributeName: 'commandId', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'commandId', AttributeType: 'S' },
    { AttributeName: 'gpsId', AttributeType: 'S' },
    { AttributeName: 'createdAt', AttributeType: 'S' },
    { AttributeName: 'status', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'gpsId-createdAt-index',
      KeySchema: [
        { AttributeName: 'gpsId', KeyType: 'HASH' },
        { AttributeName: 'createdAt', KeyType: 'RANGE' }
      ],
      Projection: { ProjectionType: 'ALL' }
    },
    {
      IndexName: 'status-index',
      KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
      Projection: { ProjectionType: 'ALL' }
    }
  ],
  BillingMode: 'PAY_PER_REQUEST'
}
```

### Eventos

```javascript
{
  TableName: 'Eventos',
  KeySchema: [{ AttributeName: 'eventoId', KeyType: 'HASH' }],
  AttributeDefinitions: [
    { AttributeName: 'eventoId', AttributeType: 'S' },
    { AttributeName: 'vehicleId', AttributeType: 'S' },
    { AttributeName: 'timestamp', AttributeType: 'N' }
  ],
  GlobalSecondaryIndexes: [{
    IndexName: 'vehicleId-timestamp-index',
    KeySchema: [
      { AttributeName: 'vehicleId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'ALL' }
  }],
  TimeToLiveSpecification: { Enabled: true, AttributeName: 'ttl' },
  BillingMode: 'PAY_PER_REQUEST'
}
```

---

## API Endpoints

### Autenticación

| Método | Ruta                 | Descripción       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/login`    | Iniciar sesión    |
| POST   | `/api/auth/register` | Registrar usuario |

### GPS

| Método | Ruta           | Descripción         |
| ------ | -------------- | ------------------- |
| GET    | `/api/gps`     | Listar dispositivos |
| GET    | `/api/gps/:id` | Obtener GPS por ID  |
| POST   | `/api/gps`     | Registrar nuevo GPS |
| PUT    | `/api/gps/:id` | Actualizar GPS      |

### Vehículos

| Método | Ruta                | Descripción             |
| ------ | ------------------- | ----------------------- |
| GET    | `/api/vehicles`     | Listar vehículos        |
| GET    | `/api/vehicles/:id` | Obtener vehículo por ID |
| POST   | `/api/vehicles`     | Registrar vehículo      |
| PUT    | `/api/vehicles/:id` | Actualizar vehículo     |

### Comandos

| Método | Ruta                           | Descripción           |
| ------ | ------------------------------ | --------------------- |
| POST   | `/api/commands/:gpsId/send`    | Enviar comando al GPS |
| GET    | `/api/commands/:gpsId/history` | Historial de comandos |

### Health

| Método | Ruta      | Descripción         |
| ------ | --------- | ------------------- |
| GET    | `/health` | Estado del servidor |

---

## Comandos Disponibles

| Comando                  | Descripción         | Payload MQTT                   |
| ------------------------ | ------------------- | ------------------------------ |
| `block_engine`           | Bloquear motor      | `{"CMD": "setdigout 100"}`     |
| `unblock_engine`         | Desbloquear motor   | `{"CMD": "setdigout 000"}`     |
| `activate_alarm`         | Activar alarma      | `{"CMD": "setdigout 010"}`     |
| `deactivate_alarm`       | Desactivar alarma   | `{"CMD": "setdigout 000"}`     |
| `flash_lights`           | Parpadear luces     | `{"CMD": "setdigout 001"}`     |
| `request_status`         | Solicitar estado    | `{"CMD": "getinfo"}`           |
| `change_report_interval` | Cambiar intervalo   | `{"CMD": "setparam 2001:30"}`  |
| `set_speed_limit`        | Límite de velocidad | `{"CMD": "setparam 11001:80"}` |

**Estados de un comando:**

```
pending → sent → executed ✅
              → failed ❌
              → timeout ⏱️
```

---

## Ejecutar

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## Testing

### Health Check

```bash
curl http://localhost:3000/health
```

Respuesta esperada:

```json
{ "status": "OK", "timestamp": "2026-03-05T10:30:00.000Z" }
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@example.com", "password": "password123" }'
```

### Enviar Comando

```bash
curl -X POST http://localhost:3000/api/commands/gps-001/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{ "command": "request_status", "parameters": {} }'
```

---

## Despliegue en EC2

```bash
# Conectar a la instancia
ssh -i key.pem ec2-user@ec2-ip-address

# Instalar Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18 && nvm use 18

# Clonar y configurar
git clone https://github.com/tu-repo/fleet-tracker-backend.git
cd fleet-tracker-backend
npm install
nano .env  # configurar variables de entorno

# Ejecutar con PM2
npm install -g pm2
pm2 start server.js --name "fleet-tracker"
pm2 save
pm2 startup
```

Asegurarse de que el Security Group de EC2 tenga abierto el puerto `3000`.
