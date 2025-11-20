/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { ExtendKcContext } from "keycloakify/login";
import type { KcEnvName, ThemeName } from "../kc.gen";
import { UserProfile } from "keycloakify/login/KcContext/KcContext";

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {};
    // NOTE: Here you can declare more properties to extend the KcContext
    // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
};

export type KcContextExtensionPerPage = {
    "register-custom-credentials.ftl": {
        auth: {
            attemptedUsername: string;
        };
        url: {
            loginRestartFlowUrl: string;
            loginAction: string;
            registrationAction: string;
        };
        messageHeader: string;
        profile: UserProfile;
        passwordPolicies?: {
            length?: number;
            digits?: number;
            lowerCase?: number;
            upperCase?: number;
            specialChars?: number;
            notUsername?: boolean;
            notEmail?: boolean;
            blacklist?: string[];
            hashIterations?: number;
        };
    };
    "register-custom-personal-data.ftl": {
        url: {
            loginRestartFlowUrl: string;
            loginAction: string;
            registrationAction: string;
        };
        messageHeader: string;
        profile: UserProfile;
    };
};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;
