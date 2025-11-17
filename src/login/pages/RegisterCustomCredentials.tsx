/*import { getKcClsx } from "keycloakify/login/lib/kcClsx";*/
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function RegisterCustomCredentials(props: PageProps<Extract<KcContext, { pageId: "register-custom-credentials.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    /*const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });*/

    const { msg } = i18n;

    /*const { url } = kcContext;*/


    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayInfo={false}
            headerNode={
                msg("registerTitle")
            }
        >
            // Page code goes here
        </Template>
    );
}