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
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { OidcSecurityService } from './auth/services/oidc.security.service';
var AuthorizationGuard = (function () {
    function AuthorizationGuard(router, oidcSecurityService) {
        this.router = router;
        this.oidcSecurityService = oidcSecurityService;
    }
    AuthorizationGuard.prototype.canActivate = function (route, state) {
        var _this = this;
        console.log(route + '' + state);
        console.log('AuthorizationGuard, canActivate');
        return this.oidcSecurityService.getIsAuthorized().pipe(map(function (isAuthorized) {
            console.log('AuthorizationGuard, canActivate isAuthorized: ' + isAuthorized);
            if (isAuthorized) {
                return true;
            }
            _this.router.navigate(['/unauthorized']);
            return false;
        }));
    };
    AuthorizationGuard = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [Router,
            OidcSecurityService])
    ], AuthorizationGuard);
    return AuthorizationGuard;
}());
export { AuthorizationGuard };
//# sourceMappingURL=authorization.guard.js.map