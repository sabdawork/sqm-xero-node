"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XeroClient = exports.TokenSet = void 0;
const openid_client_1 = require("openid-client");
const xero = __importStar(require("./gen/api"));
const axios_1 = require('axios');
const axios = axios_1.create();
var openid_client_2 = require("openid-client");
Object.defineProperty(exports, "TokenSet", { enumerable: true, get: function () { return openid_client_2.TokenSet; } });
;
;
;
class XeroClient {
    constructor(config) {
        this.config = config;
        this._tokenSet = new openid_client_1.TokenSet;
        this._tenants = [];
        this.accountingApi = new xero.AccountingApi();
        this.assetApi = new xero.AssetApi();
        this.filesApi = new xero.FilesApi();
        this.projectApi = new xero.ProjectApi();
        this.payrollAUApi = new xero.PayrollAuApi();
        this.bankFeedsApi = new xero.BankFeedsApi();
        this.payrollUKApi = new xero.PayrollUkApi();
        this.payrollNZApi = new xero.PayrollNzApi();
        this.appStoreApi = new xero.AppStoreApi();
        this.financeApi = new xero.FinanceApi();
    }
    ;
    get tenants() {
        return this._tenants;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config) {
                openid_client_1.custom.setHttpOptionsDefaults({
                    retry: {
                        maxRetryAfter: this.config.httpTimeout || 3500
                    },
                    timeout: this.config.httpTimeout || 3500
                });
                const issuer = yield openid_client_1.Issuer.discover('https://identity.xero.com');
                this.openIdClient = new issuer.Client({
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret,
                    redirect_uris: this.config.redirectUris,
                });
                this.openIdClient[openid_client_1.custom.clock_tolerance] = this.config.clockTolerance || 5;
            }
            return this;
        });
    }
    buildConsentUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.openIdClient) {
                yield this.initialize();
            }
            let url;
            if (this.config) {
                url = this.openIdClient.authorizationUrl({
                    redirect_uri: this.config.redirectUris[0],
                    scope: this.config.scopes.join(' ') || 'openid email profile',
                    state: this.config.state
                });
            }
            return url;
        });
    }
    apiCallback(callbackUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.openIdClient) {
                yield this.initialize();
            }
            const params = this.openIdClient.callbackParams(callbackUrl);
            const check = { state: this.config.state };
            if (this.config.scopes.includes('openid')) {
                this._tokenSet = yield this.openIdClient.callback(this.config.redirectUris[0], params, check);
            }
            else {
                this._tokenSet = yield this.openIdClient.oauthCallback(this.config.redirectUris[0], params, check);
            }
            this.setAccessToken();
            return this._tokenSet;
        });
    }
    disconnect(connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.queryApi('DELETE', `https://api.xero.com/connections/${connectionId}`);
            this.setAccessToken();
            return this._tokenSet;
        });
    }
    readTokenSet() {
        return this._tokenSet;
    }
    setTokenSet(tokenSet) {
        this._tokenSet = new openid_client_1.TokenSet(tokenSet);
        this.setAccessToken();
    }
    refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._tokenSet) {
                throw new Error('tokenSet is not defined');
            }
            const refreshedTokenSet = yield this.openIdClient.refresh(this._tokenSet.refresh_token);
            this._tokenSet = new openid_client_1.TokenSet(refreshedTokenSet);
            this.setAccessToken();
            return this._tokenSet;
        });
    }
    revokeToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._tokenSet) {
                throw new Error('tokenSet is not defined');
            }
            yield this.openIdClient.revoke(this._tokenSet.refresh_token);
            this._tokenSet = new openid_client_1.TokenSet;
            this._tenants = [];
            return;
        });
    }
    encodeBody(params) {
        var formBody = [];
        for (var property in params) {
            var encodedKey = encodeURIComponent(property);
            var encodedValue = encodeURIComponent(params[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        return formBody.join("&");
    }
    formatMsDate(dateString) {
        const epoch = Date.parse(dateString);
        return "/Date(" + epoch + "+0000)/";
    }
    refreshWithRefreshToken(clientId, clientSecret, refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.tokenRequest(clientId, clientSecret, { grant_type: 'refresh_token', refresh_token: refreshToken });
            const tokenSet = result.body;
            this._tokenSet = new openid_client_1.TokenSet(tokenSet);
            this.setAccessToken();
            return this._tokenSet;
        });
    }
    getClientCredentialsToken() {
        return __awaiter(this, void 0, void 0, function* () {
            const { clientId, clientSecret, grantType, scopes } = this.config;
            const result = yield this.tokenRequest(clientId, clientSecret, { grant_type: grantType, scopes });
            const tokenSet = result.body;
            this._tokenSet = new openid_client_1.TokenSet(tokenSet);
            this.setAccessToken();
            return this._tokenSet;
        });
    }
    tokenRequest(clientId, clientSecret, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield axios({
                        method: 'POST',
                        url: 'https://identity.xero.com/connect/token',
                        headers: {
                            "Authorization": `Basic ${Buffer.from(clientId + ":" + clientSecret).toString('base64')}`,
                            "Content-Type": "application/x-www-form-urlencoded"
                        },
                        data: this.encodeBody(body)
                    });
                    if (response.status && response.status >= 200 && response.status <= 299) {
                        resolve({ response: response, body: response.data });
                    }
                    else {
                        reject({ response: response, body: response.data });
                    }
                }
                catch (error) {
                    reject(error);
                }
            }));
        });
    }
    updateTenants(fullOrgDetails = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.queryApi('GET', 'https://api.xero.com/connections');
            let tenants = result.body.map(connection => connection);
            if (fullOrgDetails) {
                const getOrgsForAll = tenants.map((tenant) => __awaiter(this, void 0, void 0, function* () {
                    const result = yield this.accountingApi.getOrganisations(tenant.tenantId);
                    return result.body.organisations[0];
                }));
                const orgData = yield Promise.all(getOrgsForAll);
                tenants.map((tenant) => {
                    tenant.orgData = orgData.filter((el) => el.organisationID == tenant.tenantId)[0];
                });
            }
            // sorting tenants so the most connection / active tenant is at index 0
            tenants.sort((a, b) => new Date(b.updatedDateUtc) - new Date(a.updatedDateUtc));
            this._tenants = tenants;
            return tenants;
        });
    }
    queryApi(method, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield axios({
                        method,
                        url: uri,
                        headers: { "Authorization": `Bearer ${this._tokenSet.access_token}` },
                        responseType: 'json'
                    });
                    if (response.status && response.status >= 200 && response.status <= 299) {
                        resolve({ response: response, body: response.data });
                    }
                    else {
                        reject({ response: response, body: response.data });
                    }
                }
                catch (error) {
                    reject(error);
                }
            }));
        });
    }
    setAccessToken() {
        const accessToken = this._tokenSet.access_token;
        if (typeof accessToken === 'undefined') {
            throw new Error('Access token is undefined!');
        }
        this.accountingApi.accessToken = accessToken;
        this.assetApi.accessToken = accessToken;
        this.filesApi.accessToken = accessToken;
        this.projectApi.accessToken = accessToken;
        this.payrollAUApi.accessToken = accessToken;
        this.bankFeedsApi.accessToken = accessToken;
        this.payrollUKApi.accessToken = accessToken;
        this.payrollNZApi.accessToken = accessToken;
        this.appStoreApi.accessToken = accessToken;
        this.financeApi.accessToken = accessToken;
    }
}
exports.XeroClient = XeroClient;
//# sourceMappingURL=XeroClient.js.map