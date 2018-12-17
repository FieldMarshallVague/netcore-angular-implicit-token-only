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
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { ValidateStateResult } from '../models/validate-state-result.model';
import { AuthConfiguration } from '../modules/auth.configuration';
import { TokenHelperService } from './oidc-token-helper.service';
import { LoggerService } from './oidc.logger.service';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcSecurityValidation } from './oidc.security.validation';
var StateValidationService = (function () {
    function StateValidationService(authConfiguration, oidcSecurityCommon, oidcSecurityValidation, tokenHelperService, loggerService) {
        this.authConfiguration = authConfiguration;
        this.oidcSecurityCommon = oidcSecurityCommon;
        this.oidcSecurityValidation = oidcSecurityValidation;
        this.tokenHelperService = tokenHelperService;
        this.loggerService = loggerService;
        this.authWellKnownEndpoints = new AuthWellKnownEndpoints();
    }
    StateValidationService.prototype.setupModule = function (authWellKnownEndpoints) {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
    };
    StateValidationService.prototype.validateState = function (result, jwtKeys) {
        var toReturn = new ValidateStateResult('', '', false, {});
        if (!this.oidcSecurityValidation.validateStateFromHashCallback(result.state, this.oidcSecurityCommon.authStateControl)) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            return toReturn;
        }
        if (this.authConfiguration.response_type === 'id_token token') {
            toReturn.access_token = result.access_token;
        }
        toReturn.id_token = result.id_token;
        toReturn.decoded_id_token = this.tokenHelperService.getPayloadFromToken(toReturn.id_token, false);
        if (!this.oidcSecurityValidation.validate_signature_id_token(toReturn.id_token, jwtKeys)) {
            this.loggerService.logDebug('authorizedCallback Signature validation failed id_token');
            return toReturn;
        }
        if (!this.oidcSecurityValidation.validate_id_token_nonce(toReturn.decoded_id_token, this.oidcSecurityCommon.authNonce)) {
            this.loggerService.logWarning('authorizedCallback incorrect nonce');
            return toReturn;
        }
        if (!this.oidcSecurityValidation.validate_required_id_token(toReturn.decoded_id_token)) {
            this.loggerService.logDebug('authorizedCallback Validation, one of the REQUIRED properties missing from id_token');
            return toReturn;
        }
        if (!this.oidcSecurityValidation.validate_id_token_iat_max_offset(toReturn.decoded_id_token, this.authConfiguration
            .max_id_token_iat_offset_allowed_in_seconds)) {
            this.loggerService.logWarning('authorizedCallback Validation, iat rejected id_token was issued too far away from the current time');
            return toReturn;
        }
        if (this.authWellKnownEndpoints) {
            if (!this.oidcSecurityValidation.validate_id_token_iss(toReturn.decoded_id_token, this.authWellKnownEndpoints.issuer)) {
                this.loggerService.logWarning('authorizedCallback incorrect iss does not match authWellKnownEndpoints issuer');
                return toReturn;
            }
        }
        else {
            this.loggerService.logWarning('authWellKnownEndpoints is undefined');
            return toReturn;
        }
        if (!this.oidcSecurityValidation.validate_id_token_aud(toReturn.decoded_id_token, this.authConfiguration.client_id)) {
            this.loggerService.logWarning('authorizedCallback incorrect aud');
            return toReturn;
        }
        if (!this.oidcSecurityValidation.validate_id_token_exp_not_expired(toReturn.decoded_id_token)) {
            this.loggerService.logWarning('authorizedCallback token expired');
            return toReturn;
        }
        if (this.authConfiguration.response_type !== 'id_token token') {
            toReturn.authResponseIsValid = true;
            this.handleSuccessfulValidation();
            return toReturn;
        }
        if (!this.oidcSecurityValidation.validate_id_token_at_hash(toReturn.access_token, toReturn.decoded_id_token.at_hash) ||
            !toReturn.access_token) {
            this.loggerService.logWarning('authorizedCallback incorrect at_hash');
            return toReturn;
        }
        toReturn.authResponseIsValid = true;
        this.handleSuccessfulValidation();
        return toReturn;
    };
    StateValidationService.prototype.handleSuccessfulValidation = function () {
        this.oidcSecurityCommon.authNonce = '';
        if (this.authConfiguration.auto_clean_state_after_authentication) {
            this.oidcSecurityCommon.authStateControl = '';
        }
        this.loggerService.logDebug('AuthorizedCallback token(s) validated, continue');
    };
    StateValidationService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [AuthConfiguration,
            OidcSecurityCommon,
            OidcSecurityValidation,
            TokenHelperService,
            LoggerService])
    ], StateValidationService);
    return StateValidationService;
}());
export { StateValidationService };
//# sourceMappingURL=oidc-security-state-validation.service.js.map