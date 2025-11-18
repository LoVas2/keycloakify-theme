import type { DeepPartial } from "keycloakify/tools/DeepPartial";
import type { KcContext } from "./KcContext";
import KcPage from "./KcPage";
import { createGetKcContextMock } from "keycloakify/login/KcContext";
import type { KcContextExtension, KcContextExtensionPerPage } from "./KcContext";
import { themeNames, kcEnvDefaults } from "../kc.gen";

const kcContextExtension: KcContextExtension = {
    themeName: themeNames[0],
    properties: {
        ...kcEnvDefaults
    }
};
const kcContextExtensionPerPage: KcContextExtensionPerPage = {
    "register-custom-credentials.ftl": {
        realm: {
            registrationEmailAsUsername: true
        },
        passwordRequired: true,
        auth: {
            attemptedUsername: "user@user.com"
        },
        url: {
            loginRestartFlowUrl: "#",
            loginAction: "#",
            registrationAction: "#",
        },
        messageHeader: "Step 1",
        profile: {
            attributesByName: {
                email: {
                    value: "johndoe@example.com",
                    name: "email",
                    required: true,
                    readOnly: false,
                    validators: {
                        length: { min: "3", max: "64" },
                        integer: undefined,
                        email: {},
                        pattern: undefined,
                        options: undefined,
                        multivalued: undefined
                    },
                    annotations: {
                        inputType: undefined,
                        inputTypeSize: undefined,
                        inputOptionsFromValidation: undefined,
                        inputOptionLabels: undefined,
                        inputOptionLabelsI18nPrefix: undefined,
                        inputTypeCols: undefined,
                        inputTypeRows: undefined,
                        inputTypeMaxlength: undefined,
                        inputHelperTextBefore: undefined,
                        inputHelperTextAfter: undefined,
                        inputTypePlaceholder: undefined,
                        inputTypePattern: undefined,
                        inputTypeMinlength: undefined,
                        inputTypeMax: undefined,
                        inputTypeMin: undefined,
                        inputTypeStep: undefined
                    }
                }
            }
        }
    }
};

export const { getKcContextMock } = createGetKcContextMock({
    kcContextExtension,
    kcContextExtensionPerPage,
    overrides: {},
    overridesPerPage: {}
});

export function createKcPageStory<PageId extends KcContext["pageId"]>(params: {
    pageId: PageId;
}) {
    const { pageId } = params;

    function KcPageStory(props: {
        kcContext?: DeepPartial<Extract<KcContext, { pageId: PageId }>>;
    }) {
        const { kcContext: overrides } = props;

        const kcContextMock = getKcContextMock({
            pageId,
            overrides
        });

        return <KcPage kcContext={kcContextMock} />;
    }

    return { KcPageStory };
}
