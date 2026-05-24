# **AWS IoT Core - Configuración**

## **Paso 1: Crear Policy**

1. **AWS IoT Core** → **Security** → **Policies**
2. Click **Create policy**
3. **Name**: `VehicleGPSPolicy`
4. **Policy document**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iot:Connect",
      "Resource": "arn:aws:iot:us-east-1:ACCOUNT_ID:client/${iot:Connection.Thing.ThingName}"
    },
    {
      "Effect": "Allow",
      "Action": "iot:Publish",
      "Resource": [
        "arn:aws:iot:us-east-1:ACCOUNT_ID:topic/vehicles/${iot:Connection.Thing.ThingName}/data",
        "arn:aws:iot:us-east-1:ACCOUNT_ID:topic/vehicles/${iot:Connection.Thing.ThingName}/response"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iot:Subscribe",
      "Resource": [
        "arn:aws:iot:us-east-1:ACCOUNT_ID:topicfilter/vehicles/${iot:Connection.Thing.ThingName}/commands"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iot:Receive",
      "Resource": [
        "arn:aws:iot:us-east-1:ACCOUNT_ID:topic/vehicles/${iot:Connection.Thing.ThingName}/commands"
      ]
    }
  ]
}
```

## **Paso 2: Crear Thing**

1. **Manage** → **All devices** → **Things**
2. Click **Create things**
3. **Create single thing**
4. **Thing name**: `863238073517528` (IMEI del GPS)
5. **Device Shadow**: Unnamed shadow (classic)
6. **Next**
7. **Auto-generate a new certificate**
8. **Attach policy**: `VehicleGPSPolicy`
9. **Create thing**

# Después de ejecutar `terraform apply`, crea un certificado manualmente en la consola de AWS.

# Adjunta la policy la `VehicleGPSPolicy` al certificate y descarga el certificado y la clave privada para el dispositivo GPS.

10. **Descargar certificados**:
    - Device certificate
    - Private key
    - Amazon Root CA 1

## **Paso 3: Crear IoT Rules**

### **Rule 1: ProcessGPSData**

```sql
SELECT *,
       topic(2) as deviceId,
       clientId() as clientId
FROM 'vehicles/+/data'
WHERE NOT isUndefined(latlng)
```

**Action:** Lambda `ProcessGPSData`

### **Rule 2: ProcessCommandResponse**

```sql
SELECT *,
       topic(2) as deviceId,
       clientId() as clientId
FROM 'vehicles/+/data'
WHERE NOT isUndefined(RSP)
```

**Action:** Lambda `ProcessGPSData`

---

# **GPS Teltonika - Configuración**

## **Requisitos**

- GPS Teltonika FMC920
- Firmware: 04.00.00 Rev-14 o superior
- SIM card con plan de datos
- Teltonika Configurator (software)
- Cable USB para configuración

## **Paso 1: Conexión Física**

### **Cables del GPS:**

```
PIN         COLOR               CONEXIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+12V        Rojo                → Batería (+12V permanente)
GND         Negro               → Tierra del vehículo
DIN1        Naranja/Amarillo    → Cable de ignición (12V cuando encendido)
DOUT1       Azul                → Relay del motor (bloqueo)
DOUT2       Verde               → Sirena/alarma
DOUT3       Blanco              → Luces
```

## **Paso 2: Configuración via Teltonika Configurator**

### **2.1 Conectar GPS:**

1. Conectar GPS al PC via USB
2. Abrir Teltonika Configurator
3. Click **"Leer Dispositivo"**

### **2.2 Sistema:**

- **Data Protocol**: Codec JSON

### **2.3 Seguridad:**

1. Upload certificates:
   - Certificate file (root.pem)
   - Device certificate (.pem.crt)
   - Private key (.pem.key)

### **2.4 GPRS:**

**Server Settings:**

- **Domain**: `a28bbd2b4768x7-ats.iot.us-east-1.amazonaws.com`
- **Port**: `8883`
- **Protocol**: MQTT
- **TLS Encryption**: TLS/DTLS

**MQTT Settings:**

- **MQTT Client Type**: AWS IoT Custom
- **Device ID**: `863238073517528` (IMEI)
- **Data Topic**: `vehicles/%imei%/data`
- **Command Topic**: `vehicles/%imei%/commands`

### **2.5 Adquisición de Datos:**

- **Interval**: 10 segundos (ajustar según necesidad)
- **Send on Event**: Enabled
  - Ignition ON
  - Ignition OFF
  - Movement start
  - Movement end

### **2.6 Guardar:**

1. Click **"Guardar al Dispositivo"**
2. Click **"Reiniciar Dispositivo"**
3. Esperar 1-2 minutos para conexión

---

# **Lambda Functions**

## **Lambda 1: ProcessGPSData**

### **Configuración:**

- **Runtime**: Node.js 18.x
- **Timeout**: 30 segundos
- **Memory**: 256 MB
- **Environment Variables**:
  - `SNS_TOPIC_ARN`: ARN del topic SNS

### **Permisos IAM:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:GetItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/GPS",
        "arn:aws:dynamodb:*:*:table/Coordenadas",
        "arn:aws:dynamodb:*:*:table/Vehiculos",
        "arn:aws:dynamodb:*:*:table/Comandos",
        "arn:aws:dynamodb:*:*:table/Eventos",
        "arn:aws:dynamodb:*:*:table/*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["geo:BatchUpdateDevicePosition"],
      "Resource": "arn:aws:geo:*:*:tracker/VehicleTracker"
    },
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "arn:aws:sns:*:*:VehicleIgnitionAlerts"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```
