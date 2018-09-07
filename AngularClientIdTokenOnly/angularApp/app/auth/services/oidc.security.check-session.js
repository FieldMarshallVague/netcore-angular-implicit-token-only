var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { EventEmitter, Injectable, NgZone, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthConfiguration } from '../modules/auth.configuration';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCommon } from './oidc.security.common';
var OidcSecurityCheckSession = (function () {
    function OidcSecurityCheckSession(authConfiguration, oidcSecurityCommon, loggerService, zone) {
        this.authConfiguration = authConfiguration;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.loggerService = loggerService;
        this.zone = zone;
        this.onCheckSessionChanged = new EventEmitter(true);
    }
    OidcSecurityCheckSession.prototype.setupModule = function (authWellKnownEndpoints) {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
    };
    OidcSecurityCheckSession.prototype.doesSessionExist = function () {
        var existsparent = undefined;
        try {
            var parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }
            existsparent = parentdoc.getElementById('myiFrameForCheckSession');
        }
        catch (e) {
        }
        var exists = window.document.getElementById('myiFrameForCheckSession');
        if (existsparent) {
            this.sessionIframe = existsparent;
        }
        else if (exists) {
            this.sessionIframe = exists;
        }
        if (existsparent || exists) {
            return true;
        }
        return false;
    };
    OidcSecurityCheckSession.prototype.init = function () {
        var _this = this;
        this.sessionIframe = window.document.createElement('iframe');
        this.sessionIframe.id = 'myiFrameForCheckSession';
        this.loggerService.logDebug(this.sessionIframe);
        this.sessionIframe.style.display = 'none';
        window.document.body.appendChild(this.sessionIframe);
        if (this.authWellKnownEndpoints) {
            this.sessionIframe.src = this.authWellKnownEndpoints.check_session_iframe;
        }
        else {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined');
        }
        this.iframeMessageEvent = this.messageHandler.bind(this);
        window.addEventListener('message', this.iframeMessageEvent, false);
        return Observable.create(function (observer) {
            _this.sessionIframe.onload = function () {
                observer.next(_this);
                observer.complete();
            };
        });
    };
    OidcSecurityCheckSession.prototype.startCheckingSession = function (clientId) {
        if (!this._scheduledHeartBeat) {
            this.pollServerSession(clientId);
        }
    };
    OidcSecurityCheckSession.prototype.stopCheckingSession = function () {
        if (this._scheduledHeartBeat) {
            clearTimeout(this._scheduledHeartBeat);
            this._scheduledHeartBeat = null;
        }
    };
    OidcSecurityCheckSession.prototype.pollServerSession = function (clientId) {
        var _this = this;
        var _pollServerSessionRecur = function () {
            if (_this.sessionIframe && clientId) {
                _this.loggerService.logDebug(_this.sessionIframe);
                var session_state = _this.oidcSecurityCommon.sessionState;
                if (session_state) {
                    _this.sessionIframe.contentWindow.postMessage(clientId + ' ' + session_state, _this.authConfiguration.stsServer);
                }
            }
            else {
                _this.loggerService.logWarning('OidcSecurityCheckSession pollServerSession sessionIframe does not exist');
                _this.loggerService.logDebug(clientId);
                _this.loggerService.logDebug(_this.sessionIframe);
            }
            _this._scheduledHeartBeat = setTimeout(_pollServerSessionRecur, 3000);
        };
        this.zone.runOutsideAngular(function () {
            _this._scheduledHeartBeat = setTimeout(_pollServerSessionRecur, 3000);
        });
    };
    OidcSecurityCheckSession.prototype.messageHandler = function (e) {
        if (this.sessionIframe &&
            e.origin === this.authConfiguration.stsServer &&
            e.source === this.sessionIframe.contentWindow) {
            if (e.data === 'error') {
                this.loggerService.logWarning('error from checksession messageHandler');
            }
            else if (e.data === 'changed') {
                this.onCheckSessionChanged.emit();
            }
            else {
                this.loggerService.logDebug(e.data + ' from checksession messageHandler');
            }
        }
    };
    __decorate([
        Output(),
        __metadata("design:type", EventEmitter)
    ], OidcSecurityCheckSession.prototype, "onCheckSessionChanged", void 0);
    OidcSecurityCheckSession = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [AuthConfiguration,
            OidcSecurityCommon,
            LoggerService,
            NgZone])
    ], OidcSecurityCheckSession);
    return OidcSecurityCheckSession;
}());
export { OidcSecurityCheckSession };
//# sourceMappingURL=oidc.security.check-session.js.map