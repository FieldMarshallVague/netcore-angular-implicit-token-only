var ValidateStateResult = (function () {
    function ValidateStateResult(access_token, id_token, authResponseIsValid, decoded_id_token) {
        if (access_token === void 0) { access_token = ''; }
        if (id_token === void 0) { id_token = ''; }
        if (authResponseIsValid === void 0) { authResponseIsValid = false; }
        this.access_token = access_token;
        this.id_token = id_token;
        this.authResponseIsValid = authResponseIsValid;
        this.decoded_id_token = decoded_id_token;
    }
    return ValidateStateResult;
}());
export { ValidateStateResult };
//# sourceMappingURL=validate-state-result.model.js.map