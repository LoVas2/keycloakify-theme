import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { Fragment, useState } from "react";
import { useUserProfileForm, type FormFieldError } from "../lib/useUserProfileForm";

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
        kcContext: {
            // Force password fields and email-as-username for this step
            ...kcContext,
            passwordRequired: true,
            realm: {
                ...kcContext.realm,
                registrationEmailAsUsername: true
            }
        },
        i18n,
        doMakeUserConfirmPassword: true
    });

    const fieldsToRender = (() => {
        const desiredOrder = ["email", "email-confirm", "password", "password-confirm"] as const;
        return desiredOrder
            .map(name => formFieldStates.find(({ attribute }) => attribute.name === name))
            .filter((fieldState): fieldState is NonNullable<typeof fieldState> => fieldState !== undefined);
    })();

    const [isFormSubmittable] = useState(true);

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayInfo={false}
            headerNode={messageHeader !== undefined ? advancedMsg(messageHeader) : msg("registerTitle")}
            displayMessage={messagesPerField.exists("global")}
            displayRequiredFields
        >
            <form id="kc-register-form" className={kcClsx("kcFormClass")} action={url.registrationAction} method="post">

                {fieldsToRender.map(({ attribute, displayableErrors, valueOrValues }) => (
                    <Fragment key={attribute.name}>
                        {/* Label */}
                        <div className={kcClsx("kcFormGroupClass")}>
                            <div className={kcClsx("kcLabelWrapperClass")}>
                                <label htmlFor={attribute.name} className={kcClsx("kcLabelClass")}>
                                    {advancedMsg(attribute.displayName ?? "")}
                                </label>
                                {attribute.required && <> *</>}
                            </div>

                            {/* Input */}
                            <div className={kcClsx("kcInputWrapperClass")}>
                                <input
                                    type={attribute.annotations.inputType?.startsWith("html5-")
                                        ? attribute.annotations.inputType.slice(6)
                                        : attribute.annotations.inputType ?? "text"
                                    }
                                    id={attribute.name}
                                    name={attribute.name}
                                    value={valueOrValues as string}
                                    className={kcClsx("kcInputClass")}
                                    aria-invalid={displayableErrors.length > 0}
                                    placeholder={attribute.annotations.inputTypePlaceholder}
                                    onChange={e =>
                                        dispatchFormAction({
                                            action: "update",
                                            name: attribute.name,
                                            valueOrValues: e.target.value
                                        })
                                    }
                                />

                                {/* Messages d'erreur backend */}
                                {displayableErrors.length > 0 && (
                                    <span
                                        id={`input-error-${attribute.name}`}
                                        className={kcClsx("kcInputErrorMessageClass")}
                                    >
                                        {displayableErrors.map((err: FormFieldError, i: number) => (
                                            <Fragment key={i}>
                                                {err.errorMessage}
                                                <br />
                                            </Fragment>
                                        ))}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Fragment>
                ))}

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
                            disabled={!isFormSubmittable}
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
