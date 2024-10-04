"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError {
    constructor(axiosError) {
        this.statusCode = axiosError.response.status;
        this.body = axiosError.response.data;
        this.headers = axiosError.response.headers;
        this.request = {
            url: {
                protocol: axiosError.request.protocol,
                port: axiosError.request.agent.defaultPort,
                host: axiosError.request.host,
                path: axiosError.request.path,
            },
            headers: axiosError.request.getHeaders(),
            method: axiosError.request.method
        };
    }
    generateError() {
        return {
            response: {
                statusCode: this.statusCode,
                body: this.body,
                headers: this.headers,
                request: this.request,
            },
            body: this.body
        };
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=ApiError.js.map