// @ts-nocheck
import "keycloakify/tools/Array.prototype.every";
import { assert } from "tsafe/assert";
import { formatNumber } from "keycloakify/tools/formatNumber";
import { emailRegexp } from "keycloakify/tools/emailRegExp";
import { unFormatNumberOnSubmit } from "keycloakify/login/lib/getUserProfileApi/kcNumberUnFormat";
import { structuredCloneButFunctions } from "keycloakify/tools/structuredCloneButFunctions";
import { id } from "tsafe/id";

const cachedUserProfileApiByKcContext = new WeakMap();

export function getUserProfileApi(params) {
    const { kcContext } = params;

    use_cache: {
        const userProfileApi_cache = cachedUserProfileApiByKcContext.get(kcContext);
        if (userProfileApi_cache === undefined) {
            break use_cache;
        }
        return userProfileApi_cache;
    }

    const userProfileApi = getUserProfileApi_noCache(params);
    cachedUserProfileApiByKcContext.set(kcContext, userProfileApi);
    return userProfileApi;
}

function getUserProfileApi_noCache(params) {
    const { kcContext, doMakeUserConfirmPassword } = params;

    unFormatNumberOnSubmit();

    let state = getInitialState({ kcContext });

    const callbacks = new Set();

    return {
        dispatchFormAction: action => {
            state = reducer({ action, kcContext, doMakeUserConfirmPassword, state });
            callbacks.forEach(callback => callback());
        },
        getFormState: () => formStateSelector({ state }),
        subscribeToFormState: callback => {
            callbacks.add(callback);
            return {
                unsubscribe: () => {
                    callbacks.delete(callback);
                }
            };
        }
    };
}

function getInitialState(params) {
    const { kcContext } = params;
    const { getErrors } = createGetErrors({ kcContext });

    // NOTE: We don't use the kcContext.profile.attributes directly because
    // they don't include the password and password confirm fields and we want to add them.
    // We also want to apply some retro-compatibility and consistency patches.
    const attributes = (() => {
        mock_user_profile_attributes_for_older_keycloak_versions: {
            if (
                "profile" in kcContext &&
                "attributesByName" in kcContext.profile &&
                Object.keys(kcContext.profile.attributesByName).length !== 0
            ) {
                break mock_user_profile_attributes_for_older_keycloak_versions;
            }
            if ("register" in kcContext && kcContext.register instanceof Object && "formData" in kcContext.register) {
                // NOTE: Handle legacy register.ftl page
                return ["firstName", "lastName", "email", "username"]
                    .filter(name => (name !== "username" ? true : !kcContext.realm.registrationEmailAsUsername))
                    .map(name => {
                        return id({
                            name,
                            displayName: id(`\${${name}}`),
                            required: true,
                            value: kcContext.register.formData[name] ?? "",
                            html5DataAnnotations: {},
                            readOnly: false,
                            validators: {},
                            annotations: {},
                            autocomplete: (() => {
                                switch (name) {
                                    case "email":
                                        return "email";
                                    case "username":
                                        return "username";
                                    default:
                                        return undefined;
                                }
                            })()
                        });
                    });
            }
            if ("user" in kcContext && kcContext.user instanceof Object) {
                // NOTE: Handle legacy login-update-profile.ftl
                return ["username", "email", "firstName", "lastName"]
                    .filter(name => (name !== "username" ? true : kcContext.user.editUsernameAllowed))
                    .map(name => {
                        return id({
                            name,
                            displayName: id(`\${${name}}`),
                            required: true,
                            value: kcContext.user[name] ?? "",
                            html5DataAnnotations: {},
                            readOnly: false,
                            validators: {},
                            annotations: {},
                            autocomplete: (() => {
                                switch (name) {
                                    case "email":
                                        return "email";
                                    case "username":
                                        return "username";
                                    default:
                                        return undefined;
                                }
                            })()
                        });
                    });
            }
            if ("email" in kcContext && kcContext.email instanceof Object) {
                // NOTE: Handle legacy update-email.ftl
                return [
                    id({
                        name: "email",
                        displayName: id(`\${email}`),
                        required: true,
                        value: kcContext.email.value ?? "",
                        html5DataAnnotations: {},
                        readOnly: false,
                        validators: {},
                        annotations: {},
                        autocomplete: "email"
                    })
                ];
            }
            assert(false, "Unable to mock user profile from the current kcContext");
        }

        return Object.values(kcContext.profile.attributesByName).map(structuredCloneButFunctions);
    })();

    /* See: https://github.com/keycloak/keycloak/issues/38029 and https://github.com/keycloakify/keycloakify/issues/837 */
    add_locale_attribute_for_keycloak_prior_to_26_2_0: {
        if (kcContext.locale === undefined) {
            break add_locale_attribute_for_keycloak_prior_to_26_2_0;
        }
        if (attributes.find(attribute => attribute.name === "locale") !== undefined) {
            break add_locale_attribute_for_keycloak_prior_to_26_2_0;
        }
        attributes.push(
            id({
                validators: {},
                displayName: "locale",
                values: [],
                annotations: {},
                required: false,
                html5DataAnnotations: {},
                multivalued: false,
                readOnly: false,
                name: "locale"
            })
        );
    }

    // Retro-compatibility and consistency patches
    attributes.forEach(attribute => {
        if (attribute.name === "locale") {
            assert(kcContext.locale !== undefined);
            attribute.annotations.inputType = "hidden";
            attribute.value = kcContext.locale.currentLanguageTag;
            delete attribute.values;
        }
        patch_legacy_group: {
            if (typeof attribute.group !== "string") {
                break patch_legacy_group;
            }
            const { group, groupDisplayHeader, groupDisplayDescription, groupAnnotations } = attribute;
            delete attribute.group;
            // @ts-expect-error
            delete attribute.groupDisplayHeader;
            // @ts-expect-error
            delete attribute.groupDisplayDescription;
            // @ts-expect-error
            delete attribute.groupAnnotations;
            if (group === "") {
                break patch_legacy_group;
            }
            attribute.group = {
                name: group,
                displayHeader: groupDisplayHeader,
                displayDescription: groupDisplayDescription,
                annotations: groupAnnotations,
                html5DataAnnotations: {}
            };
        }
        // Attributes with options rendered by default as select inputs
        if (attribute.validators.options !== undefined && attribute.annotations.inputType === undefined) {
            attribute.annotations.inputType = "select";
        }
        // Consistency patch on values/value property
        {
            if (getIsMultivaluedSingleField({ attribute })) {
                attribute.multivalued = true;
            }
            if (attribute.multivalued) {
                attribute.values ??= attribute.value !== undefined ? [attribute.value] : [];
                delete attribute.value;
            } else {
                attribute.value ??= attribute.values?.[0];
                delete attribute.values;
            }
        }
    });

    add_email_confirm: {
        if (attributes.some(attribute => attribute.name === "email-confirm")) {
            break add_email_confirm;
        }
        attributes.forEach((attribute, i) => {
            if (attribute.name !== "email") {
                return;
            }
            attributes.splice(i + 1, 0, {
                name: "email-confirm",
                displayName: id("${emailConfirm}"),
                required: true,
                readOnly: false,
                validators: {},
                annotations: {},
                autocomplete: "email",
                html5DataAnnotations: {}
            });
        });
    }

    add_password_and_password_confirm: {
        if (!kcContext.passwordRequired) {
            break add_password_and_password_confirm;
        }
        attributes.forEach((attribute, i) => {
            if (attribute.name !== (kcContext.realm.registrationEmailAsUsername ? "email" : "username")) {
                // NOTE: We want to add password and password-confirm after the field that identifies the user.
                // It's either email or username.
                return;
            }
            attributes.splice(
                i + 1,
                0,
                {
                    name: "password",
                    displayName: id("${password}"),
                    required: true,
                    readOnly: false,
                    validators: {},
                    annotations: {},
                    autocomplete: "new-password",
                    html5DataAnnotations: {}
                },
                {
                    name: "password-confirm",
                    displayName: id("${passwordConfirm}"),
                    required: true,
                    readOnly: false,
                    validators: {},
                    annotations: {},
                    html5DataAnnotations: {},
                    autocomplete: "new-password"
                }
            );
        });
    }

    const initialFormFieldState = [];

    for (const attribute of attributes) {
        handle_multi_valued_attribute: {
            if (!attribute.multivalued) {
                break handle_multi_valued_attribute;
            }
            const values = attribute.values?.length ? attribute.values : [""];
            apply_validator_min_range: {
                if (getIsMultivaluedSingleField({ attribute })) {
                    break apply_validator_min_range;
                }
                const validator = attribute.validators.multivalued;
                if (validator === undefined) {
                    break apply_validator_min_range;
                }
                const { min: minStr } = validator;
                if (!minStr) {
                    break apply_validator_min_range;
                }
                const min = parseInt(`${minStr}`);
                for (let index = values.length; index < min; index++) {
                    values.push("");
                }
            }
            initialFormFieldState.push({
                attribute,
                valueOrValues: values
            });
            continue;
        }
        initialFormFieldState.push({
            attribute,
            valueOrValues: attribute.value ?? ""
        });
    }

    const initialState = {
        formFieldStates: initialFormFieldState.map(({ attribute, valueOrValues }) => ({
            attribute,
            errors: getErrors({
                attributeName: attribute.name,
                formFieldStates: initialFormFieldState
            }),
            hasLostFocusAtLeastOnce:
                valueOrValues instanceof Array && !getIsMultivaluedSingleField({ attribute })
                    ? valueOrValues.map(() => false)
                    : false,
            valueOrValues
        }))
    };

    return initialState;
}

const formStateByState = new WeakMap();

function formStateSelector(params) {
    const { state } = params;

    use_memoized_value: {
        const formState = formStateByState.get(state);
        if (formState === undefined) {
            break use_memoized_value;
        }
        return formState;
    }

    return {
        formFieldStates: state.formFieldStates.map(({ errors, hasLostFocusAtLeastOnce: hasLostFocusAtLeastOnceOrArr, attribute, ...valueOrValuesWrap }) => {
            return {
                displayableErrors: errors.filter(error => {
                    const hasLostFocusAtLeastOnce =
                        typeof hasLostFocusAtLeastOnceOrArr === "boolean"
                            ? hasLostFocusAtLeastOnceOrArr
                            : error.fieldIndex !== undefined
                                ? hasLostFocusAtLeastOnceOrArr[error.fieldIndex]
                                : hasLostFocusAtLeastOnceOrArr[hasLostFocusAtLeastOnceOrArr.length - 1];
                    switch (error.source.type) {
                        case "server":
                            return true;
                        case "other":
                            switch (error.source.rule) {
                                case "requiredField":
                                    return hasLostFocusAtLeastOnce;
                                case "passwordConfirmMatchesPassword":
                                    return hasLostFocusAtLeastOnce;
                                case "emailConfirmMatchesEmail":
                                    return hasLostFocusAtLeastOnce;
                            }
                            assert(false);
                        case "passwordPolicy":
                            switch (error.source.name) {
                                case "length":
                                case "maxLength":
                                case "digits":
                                case "lowerCase":
                                case "upperCase":
                                case "specialChars":
                                    return hasLostFocusAtLeastOnce;
                                case "notUsername":
                                case "notEmail":
                                    return true;
                            }
                            assert(false);
                        case "validator":
                            switch (error.source.name) {
                                case "length":
                                case "pattern":
                                case "email":
                                case "integer":
                                case "multivalued":
                                case "options":
                                    return hasLostFocusAtLeastOnce;
                            }
                            assert(false);
                    }
                }),
                attribute,
                ...valueOrValuesWrap
            };
        }),
        isFormSubmittable: state.formFieldStates.every(({ errors }) => errors.length === 0)
    };
}

function reducer(params) {
    const { kcContext, doMakeUserConfirmPassword, action } = params;
    const { formFieldStates } = (params.state ??= {});

    switch (action.action) {
        case "update":
            {
                const formFieldState = formFieldStates.find(({ attribute }) => attribute.name === action.name);
                assert(formFieldState !== undefined);
                if (formFieldState.valueOrValues === action.valueOrValues) {
                    return { ...params.state };
                }
                formFieldState.valueOrValues = action.valueOrValues;
                formFieldState.errors = createGetErrors({ kcContext: structuredCloneButFunctions(kcContext) }).getErrors({
                    attributeName: action.name,
                    formFieldStates
                });
                // NOTE: Overall consistency of formFieldStates is maintained by creating a new object
                // that references the updated formFieldStates. This new object is returned and saved as the
                // current state. The  formFieldStates array contains objects that hold state, and when this array is
                // spread into this state object, it retains references to those original objects, not clones of them.
                // Therefore, any operations on the formFieldStates array itself will inadvertently affect the state.
                update_multivalued_has_lost_focus: {
                    if (action.fieldIndex === undefined) {
                        break update_multivalued_has_lost_focus;
                    }
                    if (!(formFieldState.hasLostFocusAtLeastOnce instanceof Array)) {
                        break update_multivalued_has_lost_focus;
                    }
                    formFieldState.hasLostFocusAtLeastOnce[action.fieldIndex] = true;
                }
                update_password_confirm: {
                    if (!doMakeUserConfirmPassword) {
                        break update_password_confirm;
                    }
                    if (action.name !== "password") {
                        break update_password_confirm;
                    }
                    params.state = reducer({
                        state: params.state,
                        kcContext,
                        doMakeUserConfirmPassword,
                        action: {
                            action: "update",
                            name: "password-confirm",
                            valueOrValues: action.valueOrValues,
                            displayErrorsImmediately: action.displayErrorsImmediately
                        }
                    });
                }
                trigger_password_confirm_validation_on_password_change: {
                    if (!doMakeUserConfirmPassword) {
                        break trigger_password_confirm_validation_on_password_change;
                    }
                    if (action.name !== "password") {
                        break trigger_password_confirm_validation_on_password_change;
                    }
                    params.state = reducer({
                        state: params.state,
                        kcContext,
                        doMakeUserConfirmPassword,
                        action: {
                            action: "update",
                            name: "password-confirm",
                            valueOrValues: (() => {
                                const formFieldState = formFieldStates.find(({ attribute }) => attribute.name === "password-confirm");
                                assert(formFieldState !== undefined);
                                return formFieldState.valueOrValues;
                            })(),
                            displayErrorsImmediately: action.displayErrorsImmediately
                        }
                    });
                }
                update_email_confirm: {
                    if (action.name !== "email") {
                        break update_email_confirm;
                    }
                    params.state = reducer({
                        state: params.state,
                        kcContext,
                        doMakeUserConfirmPassword,
                        action: {
                            action: "update",
                            name: "email-confirm",
                            valueOrValues: action.valueOrValues,
                            displayErrorsImmediately: action.displayErrorsImmediately
                        }
                    });
                }
                trigger_email_confirm_validation_on_email_change: {
                    if (action.name !== "email") {
                        break trigger_email_confirm_validation_on_email_change;
                    }
                    params.state = reducer({
                        state: params.state,
                        kcContext,
                        doMakeUserConfirmPassword,
                        action: {
                            action: "update",
                            name: "email-confirm",
                            valueOrValues: (() => {
                                const formFieldState = formFieldStates.find(({ attribute }) => attribute.name === "email-confirm");
                                assert(formFieldState !== undefined);
                                return formFieldState.valueOrValues;
                            })(),
                            displayErrorsImmediately: action.displayErrorsImmediately
                        }
                    });
                }
                return { ...params.state };
            }
        case "focus lost":
            {
                const formFieldState = formFieldStates.find(({ attribute }) => attribute.name === action.name);
                assert(formFieldState !== undefined);
                if (formFieldState.hasLostFocusAtLeastOnce instanceof Array) {
                    const { fieldIndex } = action;
                    assert(fieldIndex !== undefined);
                    formFieldState.hasLostFocusAtLeastOnce[fieldIndex] = true;
                    return { ...params.state };
                }
                formFieldState.hasLostFocusAtLeastOnce = true;
                return { ...params.state };
            }
    }
    assert(false);
}

function createGetErrors(params) {
    const { kcContext } = params;
    const { messagesPerField, passwordPolicies: passwordPoliciesFromCtx } = kcContext;
    const passwordPolicies = passwordPoliciesFromCtx ?? {};

    function getErrors(params) {
        const { attributeName, formFieldStates } = params;

        const formFieldState = formFieldStates.find(({ attribute }) => attribute.name === attributeName);
        assert(formFieldState !== undefined);

        const { attribute } = formFieldState;

        const valueOrValues = (() => {
            let { valueOrValues } = formFieldState;
            unFormat_number: {
                const { kcNumberUnFormat } = attribute.html5DataAnnotations ?? {};
                if (!kcNumberUnFormat) {
                    break unFormat_number;
                }
                if (valueOrValues instanceof Array) {
                    valueOrValues = valueOrValues.map(value => formatNumber(value, kcNumberUnFormat));
                } else {
                    valueOrValues = formatNumber(valueOrValues, kcNumberUnFormat);
                }
            }
            return valueOrValues;
        })();

        assert(attribute !== undefined);

        server_side_error: {
            if (attribute.multivalued) {
                const defaultValues = attribute.values?.length ? attribute.values : [""];
                assert(valueOrValues instanceof Array);
                const values = valueOrValues;

                if (JSON.stringify(defaultValues) !== JSON.stringify(values.slice(0, defaultValues.length))) {
                    break server_side_error;
                }
            } else {
                assert(typeof valueOrValues === "string");
                const value = valueOrValues;
                if (value === (attribute.value ?? "") || value === "" || messagesPerField === undefined) {
                    break server_side_error;
                }
            }
            const forwardedErrorMessage = messagesPerField?.find(({ field, message }) => field === attribute.name && message !== "")?.message;
            if (!forwardedErrorMessage) {
                break server_side_error;
            }
            return [
                {
                    advancedMsgArgs: [forwardedErrorMessage],
                    fieldIndex: undefined,
                    source: {
                        type: "server"
                    }
                }
            ];
        }

        const errors = [];

        if (!attribute.multivalued) {
            assert(typeof valueOrValues === "string");
            const value = valueOrValues;

            password_validation: {
                if (attribute.name !== "password") {
                    break password_validation;
                }
                const passwordValidatePolicy = kcContext.realm.passwordPolicy ??
                    kcContext.passwordPolicy?.forcePasswordHistory?.map(policyId => kcContext.passwordPolicy?.policies[policyId]) ??
                    [];
                for (const policy of passwordValidatePolicy) {
                    const [policyName, policyValue] = policy.split("hashIterations")[0].split(/(?<=[a-z])(?=[A-Z])/);
                    check_password_policy_x: {
                        const policyTest = passwordPolicies[policyName];
                        if (!policyTest) {
                            break check_password_policy_x;
                        }
                        const policyArgs = { value, policyValue: `${policyValue}` };
                        if (policyTest(policyArgs, kcContext)) {
                            break check_password_policy_x;
                        }
                        errors.push({
                            advancedMsgArgs: [`invalidPassword${policyName[0].toUpperCase()}${policyName.slice(1)}Message`, policyArgs],
                            fieldIndex: undefined,
                            source: {
                                type: "passwordPolicy",
                                name: policyName
                            }
                        });
                    }
                }
                check_password_policy_x: {
                    const policyName = "notUsername";
                    const notUsername = passwordPolicies[policyName];
                    const username = (() => {
                        if (kcContext.realm.registrationEmailAsUsername) {
                            assert(valueOrValues !== undefined);
                            if (typeof valueOrValues !== "string") {
                                return valueOrValues[0];
                            }
                            return valueOrValues;
                        }
                        const usernameFormFieldState = formFieldStates.find(formFieldState => formFieldState.attribute.name === "username");
                        if (!usernameFormFieldState) {
                            return undefined;
                        }
                        assert(typeof usernameFormFieldState.valueOrValues === "string");
                        return usernameFormFieldState.valueOrValues === "" ? undefined : usernameFormFieldState.valueOrValues;
                    })();
                    if (username === undefined) {
                        break check_password_policy_x;
                    }
                    if (!notUsername) {
                        break check_password_policy_x;
                    }
                    if (value !== username) {
                        break check_password_policy_x;
                    }
                    errors.push({
                        advancedMsgArgs: ["invalidPasswordNotUsernameMessage"],
                        fieldIndex: undefined,
                        source: {
                            type: "passwordPolicy",
                            name: policyName
                        }
                    });
                }
                check_password_policy_x: {
                    const policyName = "notEmail";
                    const notEmail = passwordPolicies[policyName];
                    if (!notEmail) {
                        break check_password_policy_x;
                    }
                    const emailFormFieldState = formFieldStates.find(formFieldState => formFieldState.attribute.name === "email");
                    if (!emailFormFieldState) {
                        break check_password_policy_x;
                    }
                    assert(typeof emailFormFieldState.valueOrValues === "string");
                    const emailValue = emailFormFieldState.valueOrValues;
                    if (emailValue === "") {
                        break check_password_policy_x;
                    }
                    if (value !== emailValue) {
                        break check_password_policy_x;
                    }
                    errors.push({
                        advancedMsgArgs: ["invalidPasswordNotEmailMessage"],
                        fieldIndex: undefined,
                        source: {
                            type: "passwordPolicy",
                            name: policyName
                        }
                    });
                }
            }

            password_confirm_matches_password: {
                if (attributeName !== "password-confirm") {
                    break password_confirm_matches_password;
                }
                const passwordFormFieldState = formFieldStates.find(formFieldState => formFieldState.attribute.name === "password");
                assert(passwordFormFieldState !== undefined);
                assert(typeof passwordFormFieldState.valueOrValues === "string");
                const passwordValue = passwordFormFieldState.valueOrValues;
                if (value === passwordValue) {
                    break password_confirm_matches_password;
                }
                errors.push({
                    advancedMsgArgs: ["invalidPasswordConfirmMessage"],
                    fieldIndex: undefined,
                    source: {
                        type: "other",
                        rule: "passwordConfirmMatchesPassword"
                    }
                });
            }

            email_confirm_matches_email: {
                if (attributeName !== "email-confirm") {
                    break email_confirm_matches_email;
                }
                const emailFormFieldState = formFieldStates.find(formFieldState => formFieldState.attribute.name === "email");
                assert(emailFormFieldState !== undefined);
                assert(typeof emailFormFieldState.valueOrValues === "string");
                const emailValue = emailFormFieldState.valueOrValues;
                if (value === emailValue) {
                    break email_confirm_matches_email;
                }
                errors.push({
                    advancedMsgArgs: ["invalidEmailConfirmMessage"],
                    fieldIndex: undefined,
                    source: {
                        type: "other",
                        rule: "emailConfirmMatchesEmail"
                    }
                });
            }

            const { validators } = attribute;

            required_field: {
                if (!attribute.required) {
                    break required_field;
                }
                if (value !== "") {
                    break required_field;
                }
                errors.push({
                    advancedMsgArgs: ["error-user-attribute-required"],
                    fieldIndex: undefined,
                    source: {
                        type: "other",
                        rule: "requiredField"
                    }
                });
            }

            validator_x: {
                const validatorName = "length";
                const validator = validators[validatorName];
                if (!validator) {
                    break validator_x;
                }
                const { "ignore.empty.value": ignoreEmptyValue = false, max, min } = validator;
                if (ignoreEmptyValue && value === "") {
                    break validator_x;
                }
                const source = {
                    type: "validator",
                    name: validatorName
                };
                if (max && value.length > parseInt(`${max}`)) {
                    errors.push({
                        advancedMsgArgs: ["error-invalid-length-too-long", min, max],
                        fieldIndex: undefined,
                        source
                    });
                }
                if (min && value.length < parseInt(`${min}`)) {
                    errors.push({
                        advancedMsgArgs: ["error-invalid-length-too-short", min, max],
                        fieldIndex: undefined,
                        source
                    });
                }
            }

            validator_x: {
                const validatorName = "pattern";
                const validator = validators[validatorName];
                if (!validator) {
                    break validator_x;
                }
                const { "ignore.empty.value": ignoreEmptyValue = false, pattern, "error-message": errorMessageKey = "error-invalid-value" } = validator;
                if (ignoreEmptyValue && value === "") {
                    break validator_x;
                }
                if (pattern && new RegExp(pattern).test(value)) {
                    break validator_x;
                }
                errors.push({
                    advancedMsgArgs: [errorMessageKey],
                    fieldIndex: undefined,
                    source: {
                        type: "validator",
                        name: validatorName
                    }
                });
            }

            validator_x: {
                const validatorName = "email";
                const validator = validators[validatorName];
                if (!validator) {
                    break validator_x;
                }
                const { "ignore.empty.value": ignoreEmptyValue = false } = validator;
                if (ignoreEmptyValue && value === "") {
                    break validator_x;
                }
                if (emailRegexp.test(value)) {
                    break validator_x;
                }
                errors.push({
                    advancedMsgArgs: ["invalidEmailMessage"],
                    fieldIndex: undefined,
                    source: {
                        type: "validator",
                        name: validatorName
                    }
                });
            }

            validator_x: {
                const validatorName = "integer";
                const validator = validators[validatorName];
                if (!validator) {
                    break validator_x;
                }
                const { "ignore.empty.value": ignoreEmptyValue = false } = validator;
                if (ignoreEmptyValue && value === "") {
                    break validator_x;
                }
                if (/^-?[0-9]+$/.test(`${value}`)) {
                    break validator_x;
                }
                errors.push({
                    advancedMsgArgs: ["invalidNumberMessage"],
                    fieldIndex: undefined,
                    source: {
                        type: "validator",
                        name: validatorName
                    }
                });
            }
        } else {
            assert(valueOrValues instanceof Array);
            const values = valueOrValues;

            validator_x: {
                const validatorName = "multivalued";
                const validator = attribute.validators[validatorName];
                if (!validator) {
                    break validator_x;
                }
                {
                    const { max, min } = validator;
                    const source = {
                        type: "validator",
                        name: validatorName
                    };
                    if (max !== undefined && values.length > parseInt(`${max}`)) {
                        errors.push({
                            advancedMsgArgs: ["error-invalid-length-too-long", min, max],
                            fieldIndex: values.length - 1,
                            source
                        });
                    }
                    if (min !== undefined && values.length < parseInt(`${min}`)) {
                        errors.push({
                            advancedMsgArgs: ["error-invalid-length-too-short", min, max],
                            fieldIndex: values.length - 1,
                            source
                        });
                    }
                }
                values.forEach((value, fieldIndex) => {
                    const { "pattern-error-message": patternErrorMessageKey = "error-invalid-value-multivalued" } = validator;
                    if (value === "") {
                        return;
                    }
                    if (!(validator.pattern ?? []).find(pattern => new RegExp(pattern).test(value))) {
                        errors.push({
                            advancedMsgArgs: [patternErrorMessageKey],
                            fieldIndex,
                            source: {
                                type: "validator",
                                name: validatorName
                            }
                        });
                    }
                });
            }

            validator_x: {
                const validatorName = "options";
                const validator = attribute.validators[validatorName];
                if (!validator) {
                    break validator_x;
                }
                const source = {
                    type: "validator",
                    name: validatorName
                };
                values.forEach((value, fieldIndex) => {
                    if (value === "") {
                        return;
                    }
                    if ((validator.options ?? []).includes(value)) {
                        return;
                    }
                    errors.push({
                        advancedMsgArgs: ["invalidOptionMessage"],
                        fieldIndex,
                        source
                    });
                });
            }
        }

        formFieldState.errors = errors;
        return errors;
    }

    return { getErrors };
}

function getIsMultivaluedSingleField(params) {
    const { attribute } = params;
    return attribute.multivalued && attribute.annotations.inputType === "multivaluedSingleField";
}

export function getButtonToDisplayForMultivaluedAttributeField(params) {
    const { attribute, values, fieldIndex } = params;

    const hasRemove = (() => {
        if (values.length === 1) {
            return false;
        }
        const minCount = (() => {
            const { multivalued } = attribute.validators;
            if (multivalued === undefined) {
                return undefined;
            }
            const minStr = multivalued.min;
            if (minStr === undefined) {
                return undefined;
            }
            return parseInt(`${minStr}`);
        })();
        if (minCount === undefined) {
            return true;
        }
        if (values.length === minCount) {
            return false;
        }
        return true;
    })();

    const hasAdd = (() => {
        if (fieldIndex + 1 !== values.length) {
            return false;
        }
        const maxCount = (() => {
            const { multivalued } = attribute.validators;
            if (multivalued === undefined) {
                return undefined;
            }
            const maxStr = multivalued.max;
            if (maxStr === undefined) {
                return undefined;
            }
            return parseInt(`${maxStr}`);
        })();
        if (maxCount === undefined) {
            return true;
        }
        return values.length !== maxCount;
    })();

    return { hasRemove, hasAdd };
}

export type FormFieldState = ReturnType<typeof formStateSelector>["formFieldStates"][number];
export type FormFieldError = FormFieldState["displayableErrors"][number];
export type FormAction =
    | {
        action: "update";
        name: string;
        valueOrValues: string | string[];
        fieldIndex?: number;
        displayErrorsImmediately?: boolean;
    }
    | {
        action: "focus lost";
        name: string;
        fieldIndex?: number;
    };
export type KcContextLike = any;
