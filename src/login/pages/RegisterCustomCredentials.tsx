import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Fragment, useState, useEffect } from "react";
import { useUserProfileForm, type FormFieldError } from "keycloakify/login/lib/useUserProfileForm";
import type { Attribute } from "keycloakify/login/KcContext";

export default function RegisterCustomCredentials(props: PageProps<Extract<KcContext, { pageId: "register-custom-credentials.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });


    const { msg, msgStr, advancedMsg } = i18n;
    const { messageHeader, messagesPerField, url } = kcContext;

    const {
        formState: { formFieldStates },
        dispatchFormAction
    } = useUserProfileForm({
        kcContext,
        i18n,
        doMakeUserConfirmPassword: false // Ne pas utiliser useUserProfileForm pour les mots de passe
    });

    // Récupérer les états des champs email uniquement
    const emailField = formFieldStates.find(field => field.attribute.name === "email");

    // États locaux pour la confirmation de l'email
    const [emailConfirm, setEmailConfirm] = useState("");
    const [emailConfirmError, setEmailConfirmError] = useState<string | null>(null);
    const [emailConfirmTouched, setEmailConfirmTouched] = useState(false);
    const [customEmailError, setCustomEmailError] = useState<string | null>(null);
    const [emailTouched, setEmailTouched] = useState(false);

    // États locaux pour les mots de passe
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);

    // Validation du format de l'email
    useEffect(() => {
        if (emailTouched) {
            const emailValue = (emailField?.valueOrValues as string) ?? "";
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (emailValue && !emailRegex.test(emailValue)) {
                setCustomEmailError("Le format de l'adresse email est invalide.");
            } else {
                setCustomEmailError(null);
            }
        }
    }, [emailField?.valueOrValues, emailTouched]);

    // Validation de la correspondance des emails
    useEffect(() => {
        if (emailConfirmTouched) {
            const emailValue = (emailField?.valueOrValues as string) ?? "";
            if (emailConfirm !== emailValue) {
                setEmailConfirmError("Les adresses email ne correspondent pas.");
            } else {
                setEmailConfirmError(null);
            }
        }
    }, [emailConfirm, emailField?.valueOrValues, emailConfirmTouched]);

    // Validation de la politique de mot de passe
    useEffect(() => {
        if (passwordTouched && kcContext.passwordPolicies) {
            const errors: string[] = [];
            const policies = kcContext.passwordPolicies;

            if (policies.length && password.length < policies.length) {
                errors.push(`Le mot de passe doit contenir au moins ${policies.length} caractères.`);
            }
            if (policies.digits) {
                const digitCount = (password.match(/\d/g) || []).length;
                if (digitCount < policies.digits) {
                    errors.push(`Le mot de passe doit contenir au moins ${policies.digits} chiffre(s).`);
                }
            }
            if (policies.lowerCase) {
                const lowerCaseCount = (password.match(/[a-z]/g) || []).length;
                if (lowerCaseCount < policies.lowerCase) {
                    errors.push(`Le mot de passe doit contenir au moins ${policies.lowerCase} lettre(s) minuscule(s).`);
                }
            }
            if (policies.upperCase) {
                const upperCaseCount = (password.match(/[A-Z]/g) || []).length;
                if (upperCaseCount < policies.upperCase) {
                    errors.push(`Le mot de passe doit contenir au moins ${policies.upperCase} lettre(s) majuscule(s).`);
                }
            }
            if (policies.specialChars) {
                const specialCharCount = (password.match(/[^a-zA-Z0-9]/g) || []).length;
                if (specialCharCount < policies.specialChars) {
                    errors.push(`Le mot de passe doit contenir au moins ${policies.specialChars} caractère(s) spécial(aux).`);
                }
            }

            setPasswordError(errors.length > 0 ? errors.join(" ") : null);
        }
    }, [password, passwordTouched, kcContext.passwordPolicies]);

    // Validation de la correspondance des mots de passe
    useEffect(() => {
        if (passwordConfirmTouched) {
            if (passwordConfirm !== password) {
                setPasswordConfirmError("Les mots de passe ne correspondent pas.");
            } else {
                setPasswordConfirmError(null);
            }
        }
    }, [passwordConfirm, password, passwordConfirmTouched]);

    // Calculer si le formulaire complet est valide
    const emailValue = (emailField?.valueOrValues as string) ?? "";
    const hasEmailErrors = emailField?.displayableErrors && emailField.displayableErrors.length > 0;

    const isFormValid =
        emailValue !== "" && // L'email doit être rempli
        !hasEmailErrors && // L'email ne doit pas avoir d'erreurs de useUserProfileForm
        customEmailError === null && // L'email ne doit pas avoir d'erreur de format
        emailConfirm !== "" &&
        emailConfirmError === null &&
        password !== "" &&
        passwordError === null &&
        passwordConfirm !== "" &&
        passwordConfirmError === null;

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayInfo={false}
            headerNode={messageHeader !== undefined ? advancedMsg(messageHeader) : msg("registerTitle")}
            displayMessage={!messagesPerField.existsError("username", "email", "email-confirm", "password", "password-confirm")}
            displayRequiredFields
        >
            <form id="kc-register-form" className={kcClsx("kcFormClass")} action={url.registrationAction} method="post">
                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="email" className={kcClsx("kcLabelClass")}>
                            {msg("email")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={(emailField?.valueOrValues as string) ?? ""}
                            onChange={e => dispatchFormAction({
                                action: "update",
                                name: "email",
                                valueOrValues: e.target.value
                            })}
                            onBlur={() => {
                                setEmailTouched(true);
                                dispatchFormAction({
                                    action: "focus lost",
                                    name: "email",
                                    fieldIndex: undefined
                                });
                            }}
                            className={kcClsx("kcInputClass")}
                            aria-invalid={(emailField?.displayableErrors && emailField.displayableErrors.length > 0) || customEmailError !== null}
                        />
                        {emailField && emailField.displayableErrors.length > 0 && (
                            <FieldErrors attribute={emailField.attribute} displayableErrors={emailField.displayableErrors} kcClsx={kcClsx} />
                        )}
                        {customEmailError && (
                            <span
                                id="input-error-email-custom"
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                            >
                                {customEmailError}
                            </span>
                        )}
                    </div>
                </div>

                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="email-confirm" className={kcClsx("kcLabelClass")}>
                            Confirmer email *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <input
                            type="email"
                            id="email-confirm"
                            name="email-confirm"
                            required
                            value={emailConfirm}
                            onChange={e => setEmailConfirm(e.target.value)}
                            onBlur={() => setEmailConfirmTouched(true)}
                            className={kcClsx("kcInputClass")}
                            aria-invalid={emailConfirmError !== null}
                        />
                        {emailConfirmError && (
                            <span
                                id="input-error-email-confirm"
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                            >
                                {emailConfirmError}
                            </span>
                        )}
                        {messagesPerField.existsError("email-confirm") && (
                            <span
                                id="input-error-email-confirm-server"
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                            >
                                {messagesPerField.get("email-confirm")}
                            </span>
                        )}
                    </div>
                </div>

                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="password" className={kcClsx("kcLabelClass")}>
                            {msg("password")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onBlur={() => setPasswordTouched(true)}
                            className={kcClsx("kcInputClass")}
                            autoComplete="new-password"
                            aria-invalid={passwordError !== null}
                        />
                        {passwordError && (
                            <span
                                id="input-error-password"
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                            >
                                {passwordError}
                            </span>
                        )}
                    </div>
                </div>

                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="password-confirm" className={kcClsx("kcLabelClass")}>
                            {msg("passwordConfirm")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <input
                            type="password"
                            id="password-confirm"
                            name="password-confirm"
                            required
                            value={passwordConfirm}
                            onChange={e => setPasswordConfirm(e.target.value)}
                            onBlur={() => setPasswordConfirmTouched(true)}
                            className={kcClsx("kcInputClass")}
                            autoComplete="new-password"
                            aria-invalid={passwordConfirmError !== null}
                        />
                        {passwordConfirmError && (
                            <span
                                id="input-error-password-confirm"
                                className={kcClsx("kcInputErrorMessageClass")}
                                aria-live="polite"
                            >
                                {passwordConfirmError}
                            </span>
                        )}
                    </div>
                </div>


                <div className={kcClsx("kcFormGroupClass")}>
                    <div id="kc-form-options" className={kcClsx("kcFormOptionsClass")}>
                        <div className={kcClsx("kcFormOptionsWrapperClass")}>
                            <span>
                                <a href={url.loginUrl}>{msg("backToLogin")}</a>
                            </span>
                        </div>
                    </div>


                    <div id="kc-form-buttons" className={kcClsx("kcFormButtonsClass")}>
                        <input
                            disabled={!isFormValid}
                            className={kcClsx("kcButtonClass", "kcButtonPrimaryClass", "kcButtonBlockClass", "kcButtonLargeClass")}
                            type="submit"
                            value={msgStr("doRegister")}
                        />
                    </div>
                </div>
            </form>
        </Template>
    );
}

function FieldErrors(props: { attribute: Attribute; displayableErrors: FormFieldError[]; kcClsx: ReturnType<typeof getKcClsx>["kcClsx"] }) {
    const { attribute, displayableErrors, kcClsx } = props;

    if (displayableErrors.length === 0) {
        return null;
    }

    return (
        <span
            id={`input-error-${attribute.name}`}
            className={kcClsx("kcInputErrorMessageClass")}
            aria-live="polite"
        >
            {displayableErrors.map(({ errorMessage }, i, arr) => (
                <Fragment key={i}>
                    {errorMessage}
                    {arr.length - 1 !== i && <br />}
                </Fragment>
            ))}
        </span>
    );
}
