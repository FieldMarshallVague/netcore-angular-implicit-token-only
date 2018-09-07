var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component } from '@angular/core';
import { OidcSecurityService } from './auth/services/oidc.security.service';
import './app.component.css';
var AppComponent = (function () {
    function AppComponent(securityService) {
        this.securityService = securityService;
        this.isAuthorized = false;
    }
    AppComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.isAuthorizedSubscription = this.securityService.getIsAuthorized().subscribe(function (isAuthorized) {
            _this.isAuthorized = isAuthorized;
        });
        if (window.location.hash) {
            this.securityService.authorizedCallback();
        }
    };
    AppComponent.prototype.ngOnDestroy = function () {
        if (this.isAuthorizedSubscription) {
            this.isAuthorizedSubscription.unsubscribe();
        }
    };
    AppComponent.prototype.login = function () {
        console.log('start login');
        this.securityService.authorize();
    };
    AppComponent.prototype.refreshSession = function () {
        console.log('start refreshSession');
        this.securityService.authorize();
    };
    AppComponent.prototype.logout = function () {
        console.log('start logoff');
        this.securityService.logoff();
    };
    AppComponent = __decorate([
        Component({
            selector: 'app-component',
            templateUrl: 'app.component.html'
        }),
        __metadata("design:paramtypes", [OidcSecurityService])
    ], AppComponent);
    return AppComponent;
}());
export { AppComponent };
//# sourceMappingURL=app.component.js.map