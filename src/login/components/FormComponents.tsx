import { Fragment } from "react";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { FormFieldError } from "keycloakify/login/lib/useUserProfileForm";
import type { Attribute } from "keycloakify/login/KcContext";

type KcClsx = ReturnType<typeof getKcClsx>["kcClsx"];

export function FieldErrors(props: {
    attribute: Attribute;
    displayableErrors: FormFieldError[];
    kcClsx: KcClsx
}) {
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

export function CustomErrorMessage(props: {
    id: string;
    message: string;
    kcClsx: KcClsx;
}) {
    const { id, message, kcClsx } = props;

    return (
        <span
            id={id}
            className={kcClsx("kcInputErrorMessageClass")}
            aria-live="polite"
        >
            {message}
        </span>
    );
}
