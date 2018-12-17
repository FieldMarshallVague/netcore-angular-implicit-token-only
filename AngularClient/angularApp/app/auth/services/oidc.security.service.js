var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { isPlatformBrowser } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { EventEmitter, Inject, Injectable, NgZone, Output, PLATFORM_ID, } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError as observableThrowError, } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthorizationResult } from '../models/authorization-result.enum';
import { ValidateStateResult } from '../models/validate-state-result.model';
import { AuthConfiguration, } from '../modules/auth.configuration';
import { OidcDataService } from './oidc-data.service';
import { StateValidationService } from './oidc-security-state-validation.service';
import { TokenHelperService } from './oidc-token-helper.service';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCheckSession } from './oidc.security.check-session';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcSecuritySilentRenew } from './oidc.security.silent-renew';
import { OidcSecurityUserService } from './oidc.security.user-service';
import { OidcSecurityValidation } from './oidc.security.validation';
import { UriEncoder } from './uri-encoder';
var OidcSecurityService = (function () {
    function OidcSecurityService(platformId, oidcDataService, stateValidationService, authConfiguration, router, oidcSecurityCheckSession, oidcSecuritySilentRenew, oidcSecurityUserService, oidcSecurityCommon, oidcSecurityValidation, tokenHelperService, loggerService, zone) {
        this.platformId = platformId;
        this.oidcDataService = oidcDataService;
        this.stateValidationService = stateValidationService;
        this.authConfiguration = authConfiguration;
        this.router = router;
        this.oidcSecurityCheckSession = oidcSecurityCheckSession;
        this.oidcSecuritySilentRenew = oidcSecuritySilentRenew;
        this.oidcSecurityUserService = oidcSecurityUserService;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.oidcSecurityValidation = oidcSecurityValidation;
        this.tokenHelperService = tokenHelperService;
        this.loggerService = loggerService;
        this.zone = zone;
        this.onModuleSetup = new EventEmitter();
        this.onAuthorizationResult = new EventEmitter();
        this.onCheckSessionChanged = new EventEmitter();
        this.checkSessionChanged = false;
        this.moduleSetup = false;
        this._isAuthorized = new BehaviorSubject(false);
        this._isAuthorizedValue = false;
        this._userData = new BehaviorSubject('');
        this.authWellKnownEndpointsLoaded = false;
        this.runTokenValidationRunning = false;
    }
    OidcSecurityService.prototype.setupModule = function (openIDImplicitFlowConfiguration, authWellKnownEndpoints) {
        var _this = this;
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
        this.authConfiguration.init(openIDImplicitFlowConfiguration);
        this.stateValidationService.setupModule(authWellKnownEndpoints);
        this.oidcSecurityCheckSession.setupModule(authWellKnownEndpoints);
        this.oidcSecurityUserService.setupModule(authWellKnownEndpoints);
        this.oidcSecurityCheckSession.onCheckSessionChanged.subscribe(function () {
            _this.loggerService.logDebug('onCheckSessionChanged');
            _this.checkSessionChanged = true;
            _this.onCheckSessionChanged.emit(_this.checkSessionChanged);
        });
        this._userData.subscribe(function () {
            _this.onUserDataChanged();
        });
        var userData = this.oidcSecurityCommon.userData;
        if (userData) {
            this.setUserData(userData);
        }
        var isAuthorized = this.oidcSecurityCommon.isAuthorized;
        if (isAuthorized) {
            this.loggerService.logDebug('IsAuthorized setup module');
            this.loggerService.logDebug(this.oidcSecurityCommon.idToken);
            if (this.oidcSecurityValidation.isTokenExpired(this.oidcSecurityCommon.idToken, this.authConfiguration.silent_renew_offset_in_seconds)) {
                this.loggerService.logDebug('IsAuthorized setup module; id_token isTokenExpired');
            }
            else {
                this.loggerService.logDebug('IsAuthorized setup module; id_token is valid');
                this.setIsAuthorized(isAuthorized);
                this.runTokenValidation();
            }
        }
        this.loggerService.logDebug('STS server: ' + this.authConfiguration.stsServer);
        if (isPlatformBrowser(this.platformId)) {
            this.moduleSetup = true;
            this.onModuleSetup.emit();
            if (this.authConfiguration.silent_renew) {
                this.oidcSecuritySilentRenew.initRenew();
                this.boundSilentRenewEvent = this.silentRenewEventHandler.bind(this);
                var instanceId_1 = Math.random();
                var boundSilentRenewInitEvent_1 = (function (e) {
                    if (e.detail !== instanceId_1) {
                        window.removeEventListener('oidc-silent-renew-message', _this.boundSilentRenewEvent);
                        window.removeEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent_1);
                    }
                }).bind(this);
                window.addEventListener('oidc-silent-renew-init', boundSilentRenewInitEvent_1, false);
                window.addEventListener('oidc-silent-renew-message', this.boundSilentRenewEvent, false);
                window.dispatchEvent(new CustomEvent('oidc-silent-renew-init', {
                    detail: instanceId_1,
                }));
            }
            if (this.authConfiguration.start_checksession &&
                !this.oidcSecurityCheckSession.doesSessionExist()) {
                this.oidcSecurityCheckSession.init().subscribe(function () {
                    _this.oidcSecurityCheckSession.pollServerSession(_this.authConfiguration.client_id);
                });
            }
        }
        else {
            this.moduleSetup = true;
            this.onModuleSetup.emit();
        }
    };
    OidcSecurityService.prototype.getUserData = function () {
        return this._userData.asObservable();
    };
    OidcSecurityService.prototype.getIsAuthorized = function () {
        return this._isAuthorized.asObservable();
    };
    OidcSecurityService.prototype.getToken = function () {
        if (!this._isAuthorizedValue) {
            return '';
        }
        var token = this.oidcSecurityCommon.getAccessToken();
        return decodeURIComponent(token);
    };
    OidcSecurityService.prototype.getIdToken = function () {
        if (!this._isAuthorizedValue) {
            return '';
        }
        var token = this.oidcSecurityCommon.getIdToken();
        return decodeURIComponent(token);
    };
    OidcSecurityService.prototype.getPayloadFromIdToken = function (encode) {
        if (encode === void 0) { encode = false; }
        var token = this.getIdToken();
        return this.tokenHelperService.getPayloadFromToken(token, encode);
    };
    OidcSecurityService.prototype.setState = function (state) {
        this.oidcSecurityCommon.authStateControl = state;
    };
    OidcSecurityService.prototype.getState = function () {
        return this.oidcSecurityCommon.authStateControl;
    };
    OidcSecurityService.prototype.setCustomRequestParameters = function (params) {
        this.oidcSecurityCommon.customRequestParams = params;
    };
    OidcSecurityService.prototype.authorize = function (urlHandler) {
        if (this.authWellKnownEndpoints) {
            this.authWellKnownEndpointsLoaded = true;
        }
        if (!this.authWellKnownEndpointsLoaded) {
            this.loggerService.logError('Well known endpoints must be loaded before user can login!');
            return;
        }
        if (!this.oidcSecurityValidation.config_validate_response_type(this.authConfiguration.response_type)) {
            return;
        }
        this.resetAuthorizationData(false);
        this.loggerService.logDebug('BEGIN Authorize, no auth data');
        var state = this.oidcSecurityCommon.authStateControl;
        if (!state) {
            state = Date.now() + '' + Math.random();
            this.oidcSecurityCommon.authStateControl = state;
        }
        var nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.authNonce = nonce;
        this.loggerService.logDebug('AuthorizedController created. local state: ' +
            this.oidcSecurityCommon.authStateControl);
        if (this.authWellKnownEndpoints) {
            var url = this.createAuthorizeUrl(this.authConfiguration.redirect_url, nonce, state, this.authWellKnownEndpoints.authorization_endpoint);
            if (urlHandler) {
                urlHandler(url);
            }
            else {
                window.location.href = url;
            }
        }
        else {
            this.loggerService.logError('authWellKnownEndpoints is undefined');
        }
    };
    OidcSecurityService.prototype.authorizedCallback = function (hash) {
        var _this = this;
        var silentRenew = this.oidcSecurityCommon.silentRenewRunning;
        var isRenewProcess = silentRenew === 'running';
        this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
        this.resetAuthorizationData(isRenewProcess);
        hash = hash || window.location.hash.substr(1);
        var result = hash
            .split('&')
            .reduce(function (resultData, item) {
            var parts = item.split('=');
            resultData[parts[0]] = parts[1];
            return resultData;
        }, {});
        this.oidcSecurityCommon.authResult = result;
        this.loggerService.logDebug(result);
        this.loggerService.logDebug('authorizedCallback created, begin token validation');
        this.getSigningKeys().subscribe(function (jwtKeys) {
            var validationResult = _this.getValidatedStateResult(result, jwtKeys);
            if (validationResult.authResponseIsValid) {
                _this.setAuthorizationData(validationResult.access_token, validationResult.id_token);
                _this.oidcSecurityCommon.silentRenewRunning = '';
                if (_this.authConfiguration.auto_userinfo) {
                    _this.getUserinfo(isRenewProcess, result, validationResult.id_token, validationResult.decoded_id_token).subscribe(function (response) {
                        if (response) {
                            _this.onAuthorizationResult.emit(AuthorizationResult.authorized);
                            if (!_this.authConfiguration
                                .trigger_authorization_result_event &&
                                !isRenewProcess) {
                                _this.router.navigate([
                                    _this.authConfiguration
                                        .post_login_route,
                                ]);
                            }
                        }
                        else {
                            _this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
                            if (!_this.authConfiguration
                                .trigger_authorization_result_event &&
                                !isRenewProcess) {
                                _this.router.navigate([
                                    _this.authConfiguration
                                        .unauthorized_route,
                                ]);
                            }
                        }
                    }, function (err) {
                        _this.loggerService.logWarning('Failed to retreive user info with error: ' +
                            JSON.stringify(err));
                    });
                }
                else {
                    if (!isRenewProcess) {
                        _this.oidcSecurityUserService.setUserData(validationResult.decoded_id_token);
                        _this.setUserData(_this.oidcSecurityUserService.getUserData());
                        _this.runTokenValidation();
                    }
                    _this.onAuthorizationResult.emit(AuthorizationResult.authorized);
                    if (!_this.authConfiguration
                        .trigger_authorization_result_event &&
                        !isRenewProcess) {
                        _this.router.navigate([
                            _this.authConfiguration.post_login_route,
                        ]);
                    }
                }
            }
            else {
                _this.loggerService.logWarning('authorizedCallback, token(s) validation failed, resetting');
                _this.loggerService.logWarning(window.location.hash);
                _this.resetAuthorizationData(false);
                _this.oidcSecurityCommon.silentRenewRunning = '';
                _this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
                if (!_this.authConfiguration
                    .trigger_authorization_result_event &&
                    !isRenewProcess) {
                    _this.router.navigate([
                        _this.authConfiguration.unauthorized_route,
                    ]);
                }
            }
        }, function (err) {
            _this.loggerService.logWarning('Failed to retreive siging key with error: ' +
                JSON.stringify(err));
            _this.oidcSecurityCommon.silentRenewRunning = '';
        });
    };
    OidcSecurityService.prototype.getUserinfo = function (isRenewProcess, result, id_token, decoded_id_token) {
        var _this = this;
        if (isRenewProcess === void 0) { isRenewProcess = false; }
        result = result ? result : this.oidcSecurityCommon.authResult;
        id_token = id_token ? id_token : this.oidcSecurityCommon.idToken;
        decoded_id_token = decoded_id_token
            ? decoded_id_token
            : this.tokenHelperService.getPayloadFromToken(id_token, false);
        return new Observable(function (observer) {
            if (_this.authConfiguration.response_type === 'id_token token') {
                if (isRenewProcess) {
                    _this.oidcSecurityCommon.sessionState = result.session_state;
                    observer.next(true);
                    observer.complete();
                }
                else {
                    _this.oidcSecurityUserService
                        .initUserData()
                        .subscribe(function () {
                        _this.loggerService.logDebug('authorizedCallback id_token token flow');
                        var userData = _this.oidcSecurityUserService.getUserData();
                        if (_this.oidcSecurityValidation.validate_userdata_sub_id_token(decoded_id_token.sub, userData.sub)) {
                            _this.setUserData(userData);
                            _this.loggerService.logDebug(_this.oidcSecurityCommon.accessToken);
                            _this.loggerService.logDebug(_this.oidcSecurityUserService.getUserData());
                            _this.oidcSecurityCommon.sessionState =
                                result.session_state;
                            _this.runTokenValidation();
                            observer.next(true);
                        }
                        else {
                            _this.loggerService.logWarning('authorizedCallback, User data sub does not match sub in id_token');
                            _this.loggerService.logDebug('authorizedCallback, token(s) validation failed, resetting');
                            _this.resetAuthorizationData(false);
                            observer.next(false);
                        }
                        observer.complete();
                    });
                }
            }
            else {
                _this.loggerService.logDebug('authorizedCallback id_token flow');
                _this.loggerService.logDebug(_this.oidcSecurityCommon.accessToken);
                _this.oidcSecurityUserService.setUserData(decoded_id_token);
                _this.setUserData(_this.oidcSecurityUserService.getUserData());
                _this.oidcSecurityCommon.sessionState = result.session_state;
                if (!isRenewProcess) {
                    _this.runTokenValidation();
                }
                observer.next(true);
                observer.complete();
            }
        });
    };
    OidcSecurityService.prototype.logoff = function () {
        this.loggerService.logDebug('BEGIN Authorize, no auth data');
        if (this.authWellKnownEndpoints) {
            if (this.authWellKnownEndpoints.end_session_endpoint) {
                var end_session_endpoint = this.authWellKnownEndpoints
                    .end_session_endpoint;
                var id_token_hint = this.oidcSecurityCommon.idToken;
                var url = this.createEndSessionUrl(end_session_endpoint, id_token_hint);
                this.resetAuthorizationData(false);
                if (this.authConfiguration.start_checksession &&
                    this.checkSessionChanged) {
                    this.loggerService.logDebug('only local login cleaned up, server session has changed');
                }
                else {
                    window.location.href = url;
                }
            }
            else {
                this.resetAuthorizationData(false);
                this.loggerService.logDebug('only local login cleaned up, no end_session_endpoint');
            }
        }
        else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
    };
    OidcSecurityService.prototype.refreshSession = function () {
        this.loggerService.logDebug('BEGIN refresh session Authorize');
        var state = this.oidcSecurityCommon.authStateControl;
        if (state === '' || state === null) {
            state = Date.now() + '' + Math.random();
            this.oidcSecurityCommon.authStateControl = state;
        }
        var nonce = 'N' + Math.random() + '' + Date.now();
        this.oidcSecurityCommon.authNonce = nonce;
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' +
            this.oidcSecurityCommon.authStateControl);
        var url = '';
        if (this.authWellKnownEndpoints) {
            url = this.createAuthorizeUrl(this.authConfiguration.silent_redirect_url, nonce, state, this.authWellKnownEndpoints.authorization_endpoint, 'none');
        }
        else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
        }
        this.oidcSecurityCommon.silentRenewRunning = 'running';
        return this.oidcSecuritySilentRenew.startRenew(url);
    };
    OidcSecurityService.prototype.handleError = function (error) {
        this.loggerService.logError(error);
        if (error.status === 403 || error.status === '403') {
            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
            }
            else {
                this.router.navigate([this.authConfiguration.forbidden_route]);
            }
        }
        else if (error.status === 401 || error.status === '401') {
            var silentRenew = this.oidcSecurityCommon.silentRenewRunning;
            this.resetAuthorizationData(!!silentRenew);
            if (this.authConfiguration.trigger_authorization_result_event) {
                this.onAuthorizationResult.emit(AuthorizationResult.unauthorized);
            }
            else {
                this.router.navigate([
                    this.authConfiguration.unauthorized_route,
                ]);
            }
        }
    };
    OidcSecurityService.prototype.startCheckingSilentRenew = function () {
        this.runTokenValidation();
    };
    OidcSecurityService.prototype.stopCheckingSilentRenew = function () {
        if (this._scheduledHeartBeat) {
            clearTimeout(this._scheduledHeartBeat);
            this._scheduledHeartBeat = null;
            this.runTokenValidationRunning = false;
        }
    };
    OidcSecurityService.prototype.resetAuthorizationData = function (isRenewProcess) {
        if (!isRenewProcess) {
            if (this.authConfiguration.auto_userinfo) {
                this.setUserData('');
            }
            this.setIsAuthorized(false);
            this.oidcSecurityCommon.resetStorageData(isRenewProcess);
            this.checkSessionChanged = false;
        }
    };
    OidcSecurityService.prototype.getEndSessionUrl = function () {
        if (this.authWellKnownEndpoints) {
            if (this.authWellKnownEndpoints.end_session_endpoint) {
                var end_session_endpoint = this.authWellKnownEndpoints
                    .end_session_endpoint;
                var id_token_hint = this.oidcSecurityCommon.idToken;
                return this.createEndSessionUrl(end_session_endpoint, id_token_hint);
            }
        }
    };
    OidcSecurityService.prototype.getValidatedStateResult = function (result, jwtKeys) {
        if (result.error) {
            return new ValidateStateResult('', '', false, {});
        }
        return this.stateValidationService.validateState(result, jwtKeys);
    };
    OidcSecurityService.prototype.setUserData = function (userData) {
        this.oidcSecurityCommon.userData = userData;
        this._userData.next(userData);
    };
    OidcSecurityService.prototype.setIsAuthorized = function (isAuthorized) {
        this._isAuthorizedValue = isAuthorized;
        this._isAuthorized.next(isAuthorized);
    };
    OidcSecurityService.prototype.setAuthorizationData = function (access_token, id_token) {
        if (this.oidcSecurityCommon.accessToken !== '') {
            this.oidcSecurityCommon.accessToken = '';
        }
        this.loggerService.logDebug(access_token);
        this.loggerService.logDebug(id_token);
        this.loggerService.logDebug('storing to storage, getting the roles');
        this.oidcSecurityCommon.accessToken = access_token;
        this.oidcSecurityCommon.idToken = id_token;
        this.setIsAuthorized(true);
        this.oidcSecurityCommon.isAuthorized = true;
    };
    OidcSecurityService.prototype.createAuthorizeUrl = function (redirect_url, nonce, state, authorization_endpoint, prompt) {
        var urlParts = authorization_endpoint.split('?');
        var authorizationUrl = urlParts[0];
        var params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('client_id', this.authConfiguration.client_id);
        params = params.append('redirect_uri', redirect_url);
        params = params.append('response_type', this.authConfiguration.response_type);
        params = params.append('scope', this.authConfiguration.scope);
        params = params.append('nonce', nonce);
        params = params.append('state', state);
        if (prompt) {
            params = params.append('prompt', prompt);
        }
        if (this.authConfiguration.hd_param) {
            params = params.append('hd', this.authConfiguration.hd_param);
        }
        var customParams = Object.assign({}, this.oidcSecurityCommon.customRequestParams);
        Object.keys(customParams).forEach(function (key) {
            params = params.append(key, customParams[key].toString());
        });
        return authorizationUrl + "?" + params;
    };
    OidcSecurityService.prototype.createEndSessionUrl = function (end_session_endpoint, id_token_hint) {
        var urlParts = end_session_endpoint.split('?');
        var authorizationEndsessionUrl = urlParts[0];
        var params = new HttpParams({
            fromString: urlParts[1],
            encoder: new UriEncoder(),
        });
        params = params.set('id_token_hint', id_token_hint);
        params = params.append('post_logout_redirect_uri', this.authConfiguration.post_logout_redirect_uri);
        return authorizationEndsessionUrl + "?" + params;
    };
    OidcSecurityService.prototype.onUserDataChanged = function () {
        this.loggerService.logDebug("onUserDataChanged: last = " + this.lastUserData + ", new = " + this._userData.value);
        if (this.lastUserData && !this._userData.value) {
            this.loggerService.logDebug('onUserDataChanged: Logout detected.');
        }
        this.lastUserData = this._userData.value;
    };
    OidcSecurityService.prototype.getSigningKeys = function () {
        if (this.authWellKnownEndpoints) {
            this.loggerService.logDebug('jwks_uri: ' + this.authWellKnownEndpoints.jwks_uri);
            return this.oidcDataService
                .get(this.authWellKnownEndpoints.jwks_uri)
                .pipe(catchError(this.handleErrorGetSigningKeys));
        }
        else {
            this.loggerService.logWarning('getSigningKeys: authWellKnownEndpoints is undefined');
        }
        return this.oidcDataService
            .get('undefined')
            .pipe(catchError(this.handleErrorGetSigningKeys));
    };
    OidcSecurityService.prototype.handleErrorGetSigningKeys = function (error) {
        var errMsg;
        if (error instanceof Response) {
            var body = error.json() || {};
            var err = JSON.stringify(body);
            errMsg = error.status + " - " + (error.statusText || '') + " " + err;
        }
        else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return observableThrowError(errMsg);
    };
    OidcSecurityService.prototype.runTokenValidation = function () {
        var _this = this;
        if (this.runTokenValidationRunning) {
            return;
        }
        this.runTokenValidationRunning = true;
        var silentRenewHeartBeatCheck = function () {
            if (_this._userData.value &&
                _this.oidcSecurityCommon.silentRenewRunning !== 'running' &&
                _this.getIdToken()) {
                if (_this.oidcSecurityValidation.isTokenExpired(_this.oidcSecurityCommon.idToken, _this.authConfiguration.silent_renew_offset_in_seconds)) {
                    _this.loggerService.logDebug('IsAuthorized: id_token isTokenExpired, start silent renew if active');
                    if (_this.authConfiguration.silent_renew) {
                        _this.refreshSession().subscribe(function () {
                            _this._scheduledHeartBeat = setTimeout(silentRenewHeartBeatCheck, 3000);
                        }, function (err) {
                            _this.loggerService.logError('Error: ' + err);
                            _this._scheduledHeartBeat = setTimeout(silentRenewHeartBeatCheck, 3000);
                        });
                        return;
                    }
                    else {
                        _this.resetAuthorizationData(false);
                    }
                }
            }
            _this._scheduledHeartBeat = setTimeout(silentRenewHeartBeatCheck, 3000);
        };
        this.zone.runOutsideAngular(function () {
            _this._scheduledHeartBeat = setTimeout(silentRenewHeartBeatCheck, 10000);
        });
    };
    OidcSecurityService.prototype.silentRenewEventHandler = function (e) {
        this.loggerService.logDebug('silentRenewEventHandler');
        this.authorizedCallback(e.detail);
    };
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], OidcSecurityService.prototype, "onModuleSetup", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], OidcSecurityService.prototype, "onAuthorizationResult", void 0);
    __decorate([
        Output(),
        __metadata("design:type", Object)
    ], OidcSecurityService.prototype, "onCheckSessionChanged", void 0);
    OidcSecurityService = __decorate([
        Injectable(),
        __param(0, Inject(PLATFORM_ID)),
        __metadata("design:paramtypes", [Object,
            OidcDataService,
            StateValidationService,
            AuthConfiguration,
            Router,
            OidcSecurityCheckSession,
            OidcSecuritySilentRenew,
            OidcSecurityUserService,
            OidcSecurityCommon,
            OidcSecurityValidation,
            TokenHelperService,
            LoggerService,
            NgZone])
    ], OidcSecurityService);
    return OidcSecurityService;
}());
export { OidcSecurityService };
//# sourceMappingURL=oidc.security.service.js.map