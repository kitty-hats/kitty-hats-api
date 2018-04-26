import * as path from 'path';
import Web3 = require('web3');
import * as fs from 'fs';
import * as _ from 'lodash';

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

const listing = JSON.parse(fs.readFileSync(path.join(__dirname, 'kitty-hats-manifest/build/listing_1.json')).toString());

const contracts = {};
const infuraAPIKey = 'uQZg57EmoUPCiuaQuz6y';
const web3ProviderAddress = `https://mainnet.infura.io/${infuraAPIKey}`
const web3Provider = new Web3.providers.HttpProvider(web3ProviderAddress);
var web3 = new Web3(web3Provider);

async function readJSONFile(path) {
    var obj;
    try {
        const data = fs.readFileSync(path, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        throw err;
    }
}

function isContractAppliedToKitty(itemContract, kitty) {
    return new Promise(async (resolve, reject) => {
        itemContract.applied.call(kitty, function (err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

export default async function(event, context, callback) {
    const items = [];
    let kitties;
    if (event.queryStringParameters) {
        kitties = event.queryStringParameters.kitties;
    } else {
        const err = { message: 'kitties URL parameter not defined' };
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
    const kittyIds = kitties.split(',');

    const promises = _.map(kittyIds, async (kittyId) => {

        try { 
            const result = await getCachedItems(kittyId);

            if (result.Item === undefined || result.Item.kittyId === undefined) {
                const itemsAppliedToKitty = [];        
                for (const categoryName in listing.categories) {
                    const category = listing.categories[categoryName];
                    for (const item of category.items) {
                        if (item.tokenAddress !== undefined) {
                            const itemContract = await getItemContract(item);
                            // const itemIsApplied = await isContractAppliedToKitty(itemContract, kittyId);
                            const itemIsApplied = await isContractAppliedToKitty(itemContract, kittyId);
                            if (itemIsApplied === true) {
                                itemsAppliedToKitty.push(item);
                            }
                        }
                    }
                }
                const contractNames = _.map(itemsAppliedToKitty, (item) => item.assetUrl);
                await updateCachedItems(kittyId, contractNames);
                return contractNames;
            } else {
                return JSON.parse((result.Item as any).items);
            }
        } catch (err) {
            console.error(err);
        }
    });

    const results = await Promise.all(promises);
    const allKittyResults = Object.assign(
        {}, ...(_.map(kittyIds, (catId: string, idx: number) => { return { [catId] : results[idx] } }))
    );


	const response = {
        headers: {
            "Access-Control-Allow-Credentials": true,
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        },
		body: JSON.stringify(allKittyResults),
		statusCode: 200,
	};
	callback(null, response);
}

async function getItemContract(item) {
    if (contracts[item.contract] !== undefined) {
        return contracts[item.contract];
    } else {
        const itemArtifact = await readJSONFile(path.join(__dirname, 'kitty-hats-contracts', `${item.contract}.json`))
        const contract = web3.eth.contract(itemArtifact.abi).at(item.tokenAddress);
        contracts[item.contract] = contract;
        return contracts[item.contract];
    }
}

async function getCachedItems(kittyId) {
    return new Promise<AWS.DynamoDB.GetItemOutput>((resolve, reject) => {
        dynamoDb.get({ TableName: tableName, Key:  { "kittyId":  kittyId  }  }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

async function updateCachedItems(kittyId, items) {
    const ttlMs = recordTTLMs;
    const currentTimeMs = (new Date()).getTime();
    const expireAt = (new Date(currentTimeMs + ttlMs)).getTime();
    return new Promise<AWS.DynamoDB.PutItemOutput>((resolve, reject) => {
        dynamoDb.put({ TableName: tableName, Item: {
            "kittyId": kittyId, 
            "items": JSON.stringify(items),
            "expireAt": expireAt
        }}, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}
