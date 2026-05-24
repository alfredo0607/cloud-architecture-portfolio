const AWS = require('aws-sdk');

const dynamo = new AWS.DynamoDB.DocumentClient();

const TIMEOUT_MINUTES = 5;

exports.handler = async () => {
  console.log('Checking commands for timeout');

  const cutoffTime = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000).toISOString();

  const result = await dynamo.scan({
    TableName: 'Comandos',
    FilterExpression: '#s IN (:pending, :sent) AND sentAt < :cutoff',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':pending': 'pending',
      ':sent':    'sent',
      ':cutoff':  cutoffTime,
    },
  }).promise();

  console.log(`Found ${result.Items.length} timed-out commands`);

  const updates = result.Items.map((cmd) =>
    dynamo.update({
      TableName: 'Comandos',
      Key: { commandId: cmd.commandId },
      UpdateExpression: 'SET #s = :timeout, timeoutAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':timeout': 'timeout',
        ':now':     new Date().toISOString(),
      },
    }).promise().then(() => console.log(`Command ${cmd.commandId} → timeout`))
  );

  await Promise.all(updates);

  return {
    statusCode: 200,
    body: JSON.stringify({ timeoutCommands: result.Items.length }),
  };
};
