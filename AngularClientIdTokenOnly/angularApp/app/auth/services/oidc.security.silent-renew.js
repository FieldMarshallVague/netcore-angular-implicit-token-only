var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggerService } from './oidc.logger.service';
var OidcSecuritySilentRenew = (function () {
    function OidcSecuritySilentRenew(loggerService) {
        this.loggerService = loggerService;
    }
    OidcSecuritySilentRenew.prototype.initRenew = function () {
        var existsparent = undefined;
        try {
            var parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }
            existsparent = parentdoc.getElementById('myiFrameForSilentRenew');
        }
        catch (e) {
        }
        var exists = window.document.getElementById('myiFrameForSilentRenew');
        if (existsparent) {
            this.sessionIframe = existsparent;
        }
        else if (exists) {
            this.sessionIframe = exists;
        }
        if (!exists && !existsparent) {
            this.sessionIframe = window.document.createElement('iframe');
            this.sessionIframe.id = 'myiFrameForSilentRenew';
            this.loggerService.logDebug(this.sessionIframe);
            this.sessionIframe.style.display = 'none';
            window.document.body.appendChild(this.sessionIframe);
        }
    };
    OidcSecuritySilentRenew.prototype.startRenew = function (url) {
        var _this = this;
        var existsparent = undefined;
        try {
            var parentdoc = window.parent.document;
            if (!parentdoc) {
                throw new Error('Unaccessible');
            }
            existsparent = parentdoc.getElementById('myiFrameForSilentRenew');
        }
        catch (e) {
        }
        var exists = window.document.getElementById('myiFrameForSilentRenew');
        if (existsparent) {
            this.sessionIframe = existsparent;
        }
        else if (exists) {
            this.sessionIframe = exists;
        }
        this.loggerService.logDebug('startRenew for URL:' + url);
        this.sessionIframe.src = url;
        return Observable.create(function (observer) {
            _this.sessionIframe.onload = function () {
                observer.next(_this);
                observer.complete();
            };
        });
    };
    OidcSecuritySilentRenew = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [LoggerService])
    ], OidcSecuritySilentRenew);
    return OidcSecuritySilentRenew;
}());
export { OidcSecuritySilentRenew };
//# sourceMappingURL=oidc.security.silent-renew.js.map