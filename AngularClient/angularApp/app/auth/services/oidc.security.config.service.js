var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
import { EventEmitter, Injectable, Output } from '@angular/core';
var OidcConfigService = (function () {
    function OidcConfigService() {
        this.onConfigurationLoaded = new EventEmitter();
    }
    OidcConfigService.prototype.load = function (configUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4, fetch(configUrl)];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        _a = this;
                        return [4, response.json()];
                    case 2:
                        _a.clientConfiguration = _b.sent();
                        return [4, this.load_using_stsServer(this.clientConfiguration.stsServer)];
                    case 3:
                        _b.sent();
                        return [3, 5];
                    case 4:
                        err_1 = _b.sent();
                        console.error("OidcConfigService 'load' threw an error on calling " + configUrl, err_1);
                        this.onConfigurationLoaded.emit(false);
                        return [3, 5];
                    case 5: return [2];
                }
            });
        });
    };
    OidcConfigService.prototype.load_using_stsServer = function (stsServer) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4, fetch(stsServer + "/.well-known/openid-configuration")];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        _a = this;
                        return [4, response.json()];
                    case 2:
                        _a.wellKnownEndpoints = _b.sent();
                        this.onConfigurationLoaded.emit(true);
                        return [3, 4];
                    case 3:
                        err_2 = _b.sent();
                        console.error("OidcConfigService 'load_using_stsServer' threw an error on calling " + stsServer, err_2);
                        this.onConfigurationLoaded.emit(false);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    OidcConfigService.prototype.load_using_custom_stsServer = function (stsServer) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4, fetch(stsServer)];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error(response.statusText);
                        }
                        _a = this;
                        return [4, response.json()];
                    case 2:
                        _a.wellKnownEndpoints = _b.sent();
                        this.onConfigurationLoaded.emit(true);
                        return [3, 4];
                    case 3:
                        err_3 = _b.sent();
                        console.error("OidcConfigService 'load_using_custom_stsServer' threw an error on calling " + stsServer, err_3);
                        this.onConfigurationLoaded.emit(false);
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], OidcConfigService.prototype, "onConfigurationLoaded", void 0);
    OidcConfigService = __decorate([
        Injectable()
    ], OidcConfigService);
    return OidcConfigService;
}());
export { OidcConfigService };
//# sourceMappingURL=oidc.security.config.service.js.map