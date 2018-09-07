var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { OidcSecurityService } from '../auth/services/oidc.security.service';
import { Component } from '@angular/core';
var HomeComponent = (function () {
    function HomeComponent(oidcSecurityService) {
        this.oidcSecurityService = oidcSecurityService;
        this.name = 'none';
        this.email = 'none';
        this.userData = false;
        this.isAuthorized = false;
        this.message = 'HomeComponent constructor';
    }
    HomeComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.isAuthorizedSubscription = this.oidcSecurityService.getIsAuthorized().subscribe(function (isAuthorized) {
            _this.isAuthorized = isAuthorized;
        });
        this.userDataSubscription = this.oidcSecurityService.getUserData().subscribe(function (userData) {
            if (userData !== '') {
                _this.name = userData.name;
                _this.email = userData.email;
                console.log(userData);
            }
            console.log('userData getting data');
        });
    };
    HomeComponent.prototype.ngOnDestroy = function () {
        if (this.userDataSubscription) {
            this.userDataSubscription.unsubscribe();
        }
        if (this.isAuthorizedSubscription) {
            this.isAuthorizedSubscription.unsubscribe();
        }
    };
    HomeComponent = __decorate([
        Component({
            selector: 'app-home',
            templateUrl: 'home.component.html'
        }),
        __metadata("design:paramtypes", [OidcSecurityService])
    ], HomeComponent);
    return HomeComponent;
}());
export { HomeComponent };
//# sourceMappingURL=home.component.js.map