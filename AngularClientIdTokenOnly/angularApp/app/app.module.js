var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { Configuration } from './app.constants';
import { routing } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { AuthModule } from './auth/modules/auth.module';
import { OidcSecurityService } from './auth/services/oidc.security.service';
import { OpenIDImplicitFlowConfiguration } from './auth/modules/auth.configuration';
import { OidcConfigService } from './auth/services/oidc.security.config.service';
import { AuthWellKnownEndpoints } from './auth/models/auth.well-known-endpoints';
export function loadConfig(oidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return function () { return oidcConfigService.load_using_stsServer('https://localhost:44318'); };
}
var AppModule = (function () {
    function AppModule(oidcSecurityService, oidcConfigService) {
        var _this = this;
        this.oidcSecurityService = oidcSecurityService;
        this.oidcConfigService = oidcConfigService;
        this.oidcConfigService.onConfigurationLoaded.subscribe(function () {
            var openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
            var flowType = 'id_token';
            openIDImplicitFlowConfiguration.stsServer = 'https://localhost:44318';
            openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44372';
            openIDImplicitFlowConfiguration.client_id = 'angularclientidtokenonly';
            openIDImplicitFlowConfiguration.response_type = flowType;
            openIDImplicitFlowConfiguration.scope = 'openid profile email';
            openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44372/Unauthorized';
            openIDImplicitFlowConfiguration.start_checksession = false;
            openIDImplicitFlowConfiguration.silent_renew = true;
            openIDImplicitFlowConfiguration.silent_renew_url = 'https://localhost:44372/silent-renew.html';
            openIDImplicitFlowConfiguration.post_login_route = '/home';
            openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
            openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
            openIDImplicitFlowConfiguration.log_console_warning_active = true;
            openIDImplicitFlowConfiguration.log_console_debug_active = false;
            openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 3;
            openIDImplicitFlowConfiguration.auto_clean_state_after_authentication = false;
            var authWellKnownEndpoints = new AuthWellKnownEndpoints();
            authWellKnownEndpoints.setWellKnownEndpoints(_this.oidcConfigService.wellKnownEndpoints);
            _this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration, authWellKnownEndpoints);
        });
    }
    AppModule = __decorate([
        NgModule({
            imports: [
                BrowserModule,
                FormsModule,
                routing,
                HttpClientModule,
                AuthModule.forRoot(),
            ],
            declarations: [
                AppComponent,
                ForbiddenComponent,
                HomeComponent,
                UnauthorizedComponent
            ],
            providers: [
                OidcConfigService,
                OidcSecurityService,
                {
                    provide: APP_INITIALIZER,
                    useFactory: loadConfig,
                    deps: [OidcConfigService],
                    multi: true
                },
                Configuration
            ],
            bootstrap: [AppComponent],
        }),
        __metadata("design:paramtypes", [OidcSecurityService,
            OidcConfigService])
    ], AppModule);
    return AppModule;
}());
export { AppModule };
//# sourceMappingURL=app.module.js.map