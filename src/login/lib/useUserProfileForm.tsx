// @ts-nocheck
import type React from "react";
import { useEffect, useState, useMemo, Fragment } from "react";
import { assert } from "tsafe/assert";
import * as reactlessApi from "./getUserProfileApi";

export { getButtonToDisplayForMultivaluedAttributeField } from "./getUserProfileApi";
export type { FormAction, FormFieldError, FormFieldState } from "./getUserProfileApi";
export type FormState = {
    isFormSubmittable: boolean;
    formFieldStates: reactlessApi.FormFieldState[];
};
export type ParamsOfUseUserProfileForm = {
    kcContext: reactlessApi.KcContextLike;
    doMakeUserConfirmPassword: boolean;
    i18n: {
        advancedMsg: (...args: any[]) => React.ReactNode;
        advancedMsgStr: (...args: any[]) => string;
    };
};
{
    assert();
}
{
    assert();
}
{
    assert();
}
{
    assert();
}
{
    assert();
}
{
    assert();
}

export function useUserProfileForm(
    params: ParamsOfUseUserProfileForm
): { formState: FormState; dispatchFormAction: (action: reactlessApi.FormAction) => void } {
    const { doMakeUserConfirmPassword, i18n, kcContext } = params;

    const api = reactlessApi.getUserProfileApi({
        kcContext,
        doMakeUserConfirmPassword
    });

    const [formState_reactless, setFormState_reactless] = useState(() => api.getFormState());

    useEffect(() => {
        const { unsubscribe } = api.subscribeToFormState(() => {
            setFormState_reactless(api.getFormState());
        });

        return () => unsubscribe();
    }, [api]);

    const { advancedMsg, advancedMsgStr } = i18n;

    const formState = useMemo(
        () => ({
            isFormSubmittable: formState_reactless.isFormSubmittable,
            formFieldStates: formState_reactless.formFieldStates.map(formFieldState_reactless => ({
                attribute: formFieldState_reactless.attribute,
                valueOrValues: formFieldState_reactless.valueOrValues,
                displayableErrors: formFieldState_reactless.displayableErrors.map((formFieldError_reactless, i) => ({
                    errorMessage: (
                        <Fragment key={`${formFieldState_reactless.attribute.name}-${i}`}>
                            {advancedMsg(...formFieldError_reactless.advancedMsgArgs)}
                        </Fragment>
                    ),
                    errorMessageStr: advancedMsgStr(...formFieldError_reactless.advancedMsgArgs),
                    source: formFieldError_reactless.source,
                    fieldIndex: formFieldError_reactless.fieldIndex
                }))
            }))
        }),
        [formState_reactless]
    );

    return {
        formState,
        dispatchFormAction: api.dispatchFormAction
    };
}
