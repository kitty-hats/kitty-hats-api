import AWS = require('aws-sdk');
import { DynamoDB } from 'aws-sdk';

const tableName = process.env.DYNAMODB_TABLE || 'kittyitems';
const isOffline = process.env.IS_OFFLINE || false;
const recordTTLMs = parseInt(process.env.RECORD_TTL_MS, 10) || 3 * 60 * 60 * 1000 // 6 hours 

let dynamoDb: AWS.DynamoDB.DocumentClient;
if (isOffline === 'true') {
    dynamoDb = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
    });
} else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
}

async function invalidateCacheItem(kittyId) {
    return new Promise<AWS.DynamoDB.DeleteItemOutput>((resolve, reject) => {
        dynamoDb.delete({ TableName: tableName, Key:  { "kittyId":  kittyId  }  }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

export default async function(event, context, callback) {
    const items = [];
    let kittyId;
    if (event.queryStringParameters && event.queryStringParameters.kittyId) {
        kittyId = event.queryStringParameters.kittyId;
    } else {
        const err = { message: 'kittyId URL parameter not defined' };
        const response = {
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ error: err }),
            statusCode: 422,
        };
        callback(null, response);
        return;
    }

    try {
        const deleteResult = await invalidateCacheItem(kittyId);
        const response = {
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(true),
            statusCode: 200,
        };
        callback(null, response);
    } catch (err) {
        const response = {
            headers: {
                "Access-Control-Allow-Credentials": true,
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(err),
            statusCode: 500,
        }
        callback(null, response);
    }	
}