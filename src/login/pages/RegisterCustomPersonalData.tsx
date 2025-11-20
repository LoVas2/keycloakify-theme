import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { useState, useEffect, useRef } from "react";
import { useUserProfileForm } from "keycloakify/login/lib/useUserProfileForm";
import { FieldErrors } from "../components/FormComponents";

export default function RegisterCustomPersonalData(props: PageProps<Extract<KcContext, { pageId: "register-custom-personal-data.ftl" }>, I18n>) {
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
        doMakeUserConfirmPassword: false
    });

    // Debug: voir les champs disponibles
    console.log("formFieldStates", formFieldStates.map(f => f.attribute.name));

    // Récupérer les états des champs depuis le state global
    const civilityField = formFieldStates.find(field => field.attribute.name === "civility");
    const lastNameField = formFieldStates.find(field => field.attribute.name === "lastName");
    const firstNameField = formFieldStates.find(field => field.attribute.name === "firstName");
    const profileField = formFieldStates.find(field => field.attribute.name === "profile");

    console.log("civilityField", civilityField);
    console.log("profileField", profileField);

    // State pour le dropdown multi-select
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    // Fermer le dropdown quand on clique en dehors
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        }

        if (isProfileDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    // Calculer si le formulaire complet est valide
    const civilityValue = (civilityField?.valueOrValues as string) ?? "";
    const lastNameValue = (lastNameField?.valueOrValues as string) ?? "";
    const firstNameValue = (firstNameField?.valueOrValues as string) ?? "";
    // profile est multivalued, donc c'est un tableau
    const profileValues = profileField?.valueOrValues as string[] ?? [];

    const hasErrors =
        (civilityField?.displayableErrors && civilityField.displayableErrors.length > 0) ||
        (lastNameField?.displayableErrors && lastNameField.displayableErrors.length > 0) ||
        (firstNameField?.displayableErrors && firstNameField.displayableErrors.length > 0) ||
        (profileField?.displayableErrors && profileField.displayableErrors.length > 0);

    const isFormValid =
        civilityValue !== "" &&
        lastNameValue !== "" &&
        firstNameValue !== "" &&
        profileValues.some(v => v !== "") && // Au moins un profil sélectionné
        !hasErrors;

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
                {/* Civilité */}
                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="civility" className={kcClsx("kcLabelClass")}>
                            {msg("civility")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <select
                            id="civility"
                            name="civility"
                            required
                            value={civilityValue}
                            onChange={e => dispatchFormAction({
                                action: "update",
                                name: "civility",
                                valueOrValues: e.target.value
                            })}
                            onBlur={() => dispatchFormAction({
                                action: "focus lost",
                                name: "civility",
                                fieldIndex: undefined
                            })}
                            className={kcClsx("kcInputClass")}
                            aria-invalid={civilityField?.displayableErrors && civilityField.displayableErrors.length > 0}
                        >
                            <option value="">-- Sélectionnez --</option>
                            {civilityField?.attribute.validators.options?.options?.map(option => (
                                <option key={option} value={option}>
                                    {civilityField.attribute.annotations.inputOptionLabels?.[option] ?? option}
                                </option>
                            ))}
                        </select>
                        {civilityField && civilityField.displayableErrors.length > 0 && (
                            <FieldErrors attribute={civilityField.attribute} displayableErrors={civilityField.displayableErrors} kcClsx={kcClsx} />
                        )}
                    </div>
                </div>

                {/* Nom */}
                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="lastName" className={kcClsx("kcLabelClass")}>
                            {msg("lastName")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            required
                            value={lastNameValue}
                            onChange={e => dispatchFormAction({
                                action: "update",
                                name: "lastName",
                                valueOrValues: e.target.value
                            })}
                            onBlur={() => dispatchFormAction({
                                action: "focus lost",
                                name: "lastName",
                                fieldIndex: undefined
                            })}
                            className={kcClsx("kcInputClass")}
                            aria-invalid={lastNameField?.displayableErrors && lastNameField.displayableErrors.length > 0}
                        />
                        {lastNameField && lastNameField.displayableErrors.length > 0 && (
                            <FieldErrors attribute={lastNameField.attribute} displayableErrors={lastNameField.displayableErrors} kcClsx={kcClsx} />
                        )}
                    </div>
                </div>

                {/* Prénom */}
                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label htmlFor="firstName" className={kcClsx("kcLabelClass")}>
                            {msg("firstName")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            required
                            value={firstNameValue}
                            onChange={e => dispatchFormAction({
                                action: "update",
                                name: "firstName",
                                valueOrValues: e.target.value
                            })}
                            onBlur={() => dispatchFormAction({
                                action: "focus lost",
                                name: "firstName",
                                fieldIndex: undefined
                            })}
                            className={kcClsx("kcInputClass")}
                            aria-invalid={firstNameField?.displayableErrors && firstNameField.displayableErrors.length > 0}
                        />
                        {firstNameField && firstNameField.displayableErrors.length > 0 && (
                            <FieldErrors attribute={firstNameField.attribute} displayableErrors={firstNameField.displayableErrors} kcClsx={kcClsx} />
                        )}
                    </div>
                </div>

                {/* Profil - Multi-select dropdown avec checkboxes */}
                <div className={kcClsx("kcFormGroupClass")}>
                    <div className={kcClsx("kcLabelWrapperClass")}>
                        <label className={kcClsx("kcLabelClass")}>
                            {msg("profile")} *
                        </label>
                    </div>
                    <div className={kcClsx("kcInputWrapperClass")}>
                        <div style={{ position: "relative" }} ref={profileDropdownRef}>
                            {/* Bouton dropdown */}
                            <div
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className={kcClsx("kcInputClass")}
                                style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    minHeight: "38px"
                                }}
                                aria-invalid={profileField?.displayableErrors && profileField.displayableErrors.length > 0}
                            >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {profileValues.filter(v => v !== "").length > 0
                                        ? profileValues.filter(v => v !== "").map(v =>
                                            profileField?.attribute.annotations.inputOptionLabels?.[v] ?? v
                                        ).join(", ")
                                        : "-- Sélectionnez --"
                                    }
                                </span>
                                <span style={{ marginLeft: "8px" }}>{isProfileDropdownOpen ? "▲" : "▼"}</span>
                            </div>

                            {/* Liste dropdown */}
                            {isProfileDropdownOpen && (
                                <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    backgroundColor: "white",
                                    border: "1px solid #ccc",
                                    borderTop: "none",
                                    zIndex: 1000,
                                    maxHeight: "200px",
                                    overflowY: "auto"
                                }}>
                                    {profileField?.attribute.validators.options?.options?.map(option => {
                                        const isChecked = profileValues.includes(option);
                                        return (
                                            <label
                                                key={option}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    padding: "8px 12px",
                                                    cursor: "pointer",
                                                    borderBottom: "1px solid #eee"
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "white")}
                                            >
                                                <input
                                                    type="checkbox"
                                                    name="profile"
                                                    value={option}
                                                    checked={isChecked}
                                                    onChange={e => {
                                                        let newValues: string[];
                                                        if (e.target.checked) {
                                                            newValues = [...profileValues.filter(v => v !== ""), option];
                                                        } else {
                                                            newValues = profileValues.filter(v => v !== option && v !== "");
                                                        }
                                                        dispatchFormAction({
                                                            action: "update",
                                                            name: "profile",
                                                            valueOrValues: newValues.length > 0 ? newValues : [""]
                                                        });
                                                    }}
                                                    style={{ marginRight: "8px" }}
                                                />
                                                {profileField.attribute.annotations.inputOptionLabels?.[option] ?? option}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {profileField && profileField.displayableErrors.length > 0 && (
                            <FieldErrors attribute={profileField.attribute} displayableErrors={profileField.displayableErrors} kcClsx={kcClsx} />
                        )}
                    </div>
                </div>


                <div className={kcClsx("kcFormGroupClass")}>
                    <div id="kc-form-options" className={kcClsx("kcFormOptionsClass")}>
                        <div className={kcClsx("kcFormOptionsWrapperClass")}>
                            <span>
                                <a href={url.loginRestartFlowUrl}>{msg("backToLogin")}</a>
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
