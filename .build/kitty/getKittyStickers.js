"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var Web3 = require("web3");
var fs = require("fs");
var _ = require("lodash");
var AWS = require("aws-sdk");
var tableName = process.env.DYNAMODB_TABLE || 'kittyitems';
var isOffline = process.env.IS_OFFLINE || false;
var recordTTLMs = parseInt(process.env.RECORD_TTL_MS, 10) || 3 * 60 * 60 * 1000; // 6 hours 
var dynamoDb;
if (isOffline === 'true') {
    dynamoDb = new AWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
    });
}
else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
}
var listing = JSON.parse(fs.readFileSync(path.join(__dirname, 'kitty-hats-manifest/build/listing_1.json')).toString());
var contracts = {};
var infuraAPIKey = 'uQZg57EmoUPCiuaQuz6y';
var web3ProviderAddress = "https://mainnet.infura.io/" + infuraAPIKey;
var web3Provider = new Web3.providers.HttpProvider(web3ProviderAddress);
var web3 = new Web3(web3Provider);
function readJSONFile(path) {
    return __awaiter(this, void 0, void 0, function () {
        var obj, data;
        return __generator(this, function (_a) {
            try {
                data = fs.readFileSync(path, 'utf8');
                return [2 /*return*/, JSON.parse(data)];
            }
            catch (err) {
                throw err;
            }
            return [2 /*return*/];
        });
    });
}
function isContractAppliedToKitty(itemContract, kitty) {
    var _this = this;
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            itemContract.applied.call(kitty, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
            return [2 /*return*/];
        });
    }); });
}
function default_1(event, context, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var items, kitties, err, response_1, kittyIds, promises, results, allKittyResults, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    items = [];
                    if (event.queryStringParameters) {
                        kitties = event.queryStringParameters.kitties;
                    }
                    else {
                        err = { message: 'kitties URL parameter not defined' };
                        response_1 = {
                            headers: {
                                "Access-Control-Allow-Credentials": true,
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ error: err }),
                            statusCode: 422,
                        };
                        callback(null, response_1);
                        return [2 /*return*/];
                    }
                    kittyIds = kitties.split(',');
                    promises = _.map(kittyIds, function (kittyId) { return __awaiter(_this, void 0, void 0, function () {
                        var result, itemsAppliedToKitty, _a, _b, _i, categoryName, category, _c, _d, item, itemContract, itemIsApplied, contractNames, err_1;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    _e.trys.push([0, 12, , 13]);
                                    return [4 /*yield*/, getCachedItems(kittyId)];
                                case 1:
                                    result = _e.sent();
                                    if (!(result.Item === undefined || result.Item.kittyId === undefined)) return [3 /*break*/, 10];
                                    itemsAppliedToKitty = [];
                                    _a = [];
                                    for (_b in listing.categories)
                                        _a.push(_b);
                                    _i = 0;
                                    _e.label = 2;
                                case 2:
                                    if (!(_i < _a.length)) return [3 /*break*/, 8];
                                    categoryName = _a[_i];
                                    category = listing.categories[categoryName];
                                    _c = 0, _d = category.items;
                                    _e.label = 3;
                                case 3:
                                    if (!(_c < _d.length)) return [3 /*break*/, 7];
                                    item = _d[_c];
                                    if (!(item.tokenAddress !== undefined)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, getItemContract(item)];
                                case 4:
                                    itemContract = _e.sent();
                                    return [4 /*yield*/, isContractAppliedToKitty(itemContract, kittyId)];
                                case 5:
                                    itemIsApplied = _e.sent();
                                    if (itemIsApplied === true) {
                                        itemsAppliedToKitty.push(item);
                                    }
                                    _e.label = 6;
                                case 6:
                                    _c++;
                                    return [3 /*break*/, 3];
                                case 7:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 8:
                                    contractNames = _.map(itemsAppliedToKitty, function (item) { return item.assetUrl; });
                                    return [4 /*yield*/, updateCachedItems(kittyId, contractNames)];
                                case 9:
                                    _e.sent();
                                    return [2 /*return*/, contractNames];
                                case 10: return [2 /*return*/, JSON.parse(result.Item.items)];
                                case 11: return [3 /*break*/, 13];
                                case 12:
                                    err_1 = _e.sent();
                                    console.error(err_1);
                                    return [3 /*break*/, 13];
                                case 13: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(promises)];
                case 1:
                    results = _a.sent();
                    allKittyResults = Object.assign.apply(Object, [{}].concat((_.map(kittyIds, function (catId, idx) {
                        return _a = {}, _a[catId] = results[idx], _a;
                        var _a;
                    }))));
                    response = {
                        headers: {
                            "Access-Control-Allow-Credentials": true,
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(allKittyResults),
                        statusCode: 200,
                    };
                    callback(null, response);
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = default_1;
function getItemContract(item) {
    return __awaiter(this, void 0, void 0, function () {
        var itemArtifact, contract;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(contracts[item.contract] !== undefined)) return [3 /*break*/, 1];
                    return [2 /*return*/, contracts[item.contract]];
                case 1: return [4 /*yield*/, readJSONFile(path.join(__dirname, 'kitty-hats-contracts', item.contract + ".json"))];
                case 2:
                    itemArtifact = _a.sent();
                    contract = web3.eth.contract(itemArtifact.abi).at(item.tokenAddress);
                    contracts[item.contract] = contract;
                    return [2 /*return*/, contracts[item.contract]];
            }
        });
    });
}
function getCachedItems(kittyId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    dynamoDb.get({ TableName: tableName, Key: { "kittyId": kittyId } }, function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(data);
                        }
                    });
                })];
        });
    });
}
function updateCachedItems(kittyId, items) {
    return __awaiter(this, void 0, void 0, function () {
        var ttlMs, currentTimeMs, expireAt;
        return __generator(this, function (_a) {
            ttlMs = recordTTLMs;
            currentTimeMs = (new Date()).getTime();
            expireAt = (new Date(currentTimeMs + ttlMs)).getTime();
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    dynamoDb.put({ TableName: tableName, Item: {
                            "kittyId": kittyId,
                            "items": JSON.stringify(items),
                            "expireAt": expireAt
                        } }, function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        resolve(data);
                    });
                })];
        });
    });
}
//# sourceMappingURL=getKittyStickers.js.map