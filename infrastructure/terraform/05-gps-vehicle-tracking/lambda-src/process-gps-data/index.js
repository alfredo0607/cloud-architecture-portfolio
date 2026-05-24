const AWS = require('aws-sdk');
const { randomUUID } = require('crypto');

const dynamo = new AWS.DynamoDB.DocumentClient();
const location = new AWS.Location();
const sns = new AWS.SNS();

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const TRACKER_NAME = 'VehicleTracker';
const TTL_COORDS_DAYS = 90;
const TTL_EVENTS_DAYS = 365;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.RSP !== undefined) {
    await processCommandResponse(event);
  } else if (event.latlng !== undefined) {
    await processLocationData(event);
  } else {
    console.log('Unknown event type — skipping');
  }

  return { statusCode: 200 };
};

async function processLocationData(event) {
  const deviceId = event.deviceId || event.clientId;
  const [lat, lng] = event.latlng.split(',').map(Number);
  const now = Date.now();

  // Update AWS Location Service tracker
  try {
    await location.batchUpdateDevicePosition({
      TrackerName: TRACKER_NAME,
      Updates: [{
        DeviceId: deviceId,
        SampleTime: new Date().toISOString(),
        Position: [lng, lat],
      }],
    }).promise();
    console.log('Location Service updated');
  } catch (err) {
    console.error('Location Service error:', err.message);
  }

  // Save coordinate record
  const coordTtl = Math.floor(now / 1000) + TTL_COORDS_DAYS * 86400;
  await dynamo.put({
    TableName: 'Coordenadas',
    Item: {
      coordenadaId:    randomUUID(),
      gpsId:           deviceId,
      lat,
      lng,
      speed:           event.sp  || 0,
      altitude:        event.alt || 0,
      angle:           event.ang || 0,
      satellites:      event.sat || 0,
      ignition:        event['239'] !== undefined ? event['239'] : null,
      batteryVoltage:  event['67']  || 0,
      externalVoltage: event['66']  || 0,
      timestamp:       now,
      ttl:             coordTtl,
    },
  }).promise();
  console.log('Coordinate saved');

  // Fetch current GPS record to detect ignition change
  const gpsResult = await dynamo.query({
    TableName: 'GPS',
    IndexName: 'deviceId-index',
    KeyConditionExpression: 'deviceId = :d',
    ExpressionAttributeValues: { ':d': deviceId },
    Limit: 1,
  }).promise();

  const gps = gpsResult.Items && gpsResult.Items[0];
  if (!gps) {
    console.log(`No GPS record found for deviceId ${deviceId} — skipping state update`);
    return;
  }

  const previousIgnition = gps.lastIgnitionState;
  const currentIgnition  = event['239'];

  await dynamo.update({
    TableName: 'GPS',
    Key: { gpsId: gps.gpsId },
    UpdateExpression: 'SET lastLat = :lat, lastLng = :lng, lastSpeed = :spd, lastIgnitionState = :ign, lastSeen = :ts, isOnline = :online',
    ExpressionAttributeValues: {
      ':lat':    lat,
      ':lng':    lng,
      ':spd':    event.sp || 0,
      ':ign':    currentIgnition,
      ':ts':     new Date().toISOString(),
      ':online': true,
    },
  }).promise();

  if (previousIgnition !== undefined && previousIgnition !== currentIgnition) {
    await handleIgnitionChange(gps, currentIgnition, event, lat, lng, now);
  }
}

async function handleIgnitionChange(gps, currentIgnition, event, lat, lng, now) {
  const eventType = currentIgnition === 1 ? 'ignition_on' : 'ignition_off';
  const eventTtl  = Math.floor(now / 1000) + TTL_EVENTS_DAYS * 86400;

  await dynamo.put({
    TableName: 'Eventos',
    Item: {
      eventoId:        randomUUID(),
      vehicleId:       gps.vehicleId || gps.gpsId,
      type:            eventType,
      lat,
      lng,
      speed:           event.sp   || 0,
      batteryVoltage:  event['67'] || 0,
      externalVoltage: event['66'] || 0,
      gsmSignal:       event['21'] || 0,
      satellites:      event.sat  || 0,
      timestamp:       now,
      ttl:             eventTtl,
    },
  }).promise();

  await sendIgnitionNotification(gps, eventType, event, lat, lng);
}

async function sendIgnitionNotification(gps, eventType, event, lat, lng) {
  const isOn       = eventType === 'ignition_on';
  const name       = gps.vehicleName || gps.gpsId;
  const dateStr    = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const stateLabel = isOn ? 'ENCENDIDO' : 'APAGADO';

  const subject = `Vehículo ${stateLabel} - ${name}`;
  const message = [
    `${stateLabel}`,
    '',
    `Vehículo: ${name}`,
    `Estado: Vehículo ${isOn ? 'encendido' : 'apagado'}`,
    `Fecha y Hora: ${dateStr}`,
    '',
    'Detalles:',
    `- Velocidad: ${event.sp  || 0} km/h`,
    `- Batería: ${event['67'] || 0} mV`,
    `- Voltaje Externo: ${event['66'] || 0} mV`,
    `- Señal GSM: ${event['21'] || 0}`,
    `- Satélites: ${event.sat || 0}`,
    '',
    'Ubicación:',
    `- Latitud: ${lat}`,
    `- Longitud: ${lng}`,
    `- Google Maps: https://www.google.com/maps?q=${lat},${lng}`,
    '',
    '---',
    'Sistema de Rastreo Vehicular',
  ].join('\n');

  await sns.publish({
    TopicArn: SNS_TOPIC_ARN,
    Subject:  subject,
    Message:  message,
  }).promise();
  console.log(`Ignition notification sent: ${stateLabel}`);
}

async function processCommandResponse(event) {
  const deviceId = event.deviceId || event.clientId;
  const response = event.RSP;
  console.log(`Command response from ${deviceId}: ${response}`);

  const result = await dynamo.query({
    TableName: 'Comandos',
    IndexName: 'gpsId-createdAt-index',
    KeyConditionExpression: 'gpsId = :g',
    FilterExpression: '#s IN (:sent, :pending)',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':g':       deviceId,
      ':sent':    'sent',
      ':pending': 'pending',
    },
    ScanIndexForward: false,
    Limit: 1,
  }).promise();

  if (!result.Items || result.Items.length === 0) {
    console.log('No pending/sent command found for this device');
    return;
  }

  const cmd = result.Items[0];
  await dynamo.update({
    TableName: 'Comandos',
    Key: { commandId: cmd.commandId },
    UpdateExpression: 'SET #s = :executed, response = :rsp, executedAt = :now',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':executed': 'executed',
      ':rsp':      response,
      ':now':      new Date().toISOString(),
    },
  }).promise();
  console.log(`Command ${cmd.commandId} marked as executed`);
}
