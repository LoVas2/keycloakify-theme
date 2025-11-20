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
                username: {
                    value: "johndoe",
                    name: "",
                    required: false,
                    readOnly: false,
                    validators: {
                        length: undefined,
                        integer: undefined,
                        email: undefined,
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
                },
                email: {
                    value: "johndoe@example.com",
                    name: "email",
                    displayName: "Email",
                    required: true,
                    readOnly: false,
                    validators: {
                        length: undefined,
                        integer: undefined,
                        email: undefined,
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
                },
                password: {
                    value: "",
                    name: "password",
                    displayName: "Password",
                    required: true,
                    readOnly: false,
                    validators: {
                        length: undefined,
                        integer: undefined,
                        email: undefined,
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
                },
                "password-confirm": {
                    value: "",
                    name: "password-confirm",
                    displayName: "Confirm Password",
                    required: true,
                    readOnly: false,
                    validators: {
                        length: undefined,
                        integer: undefined,
                        email: undefined,
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
    },
    "register-custom-personal-data.ftl": {
        url: {
            loginRestartFlowUrl: "#",
            loginAction: "#",
            registrationAction: "#"
        },
        messageHeader: "Step 2 - Personal Data",
        profile: {
            attributesByName: {
                civility: {
                    value: "",
                    name: "civility",
                    displayName: "Civility",
                    required: true,
                    readOnly: false,
                    validators: {
                        options: {
                            options: ["M", "Mme"]
                        }
                    },
                    annotations: {
                        inputOptionLabels: {
                            "M": "Monsieur",
                            "Mme": "Madame"
                        }
                    }
                },
                lastName: {
                    value: "",
                    name: "lastName",
                    displayName: "Last Name",
                    required: true,
                    readOnly: false,
                    validators: {
                        length: {
                            min: "2",
                            max: "255"
                        }
                    },
                    annotations: {}
                },
                firstName: {
                    value: "",
                    name: "firstName",
                    displayName: "First Name",
                    required: true,
                    readOnly: false,
                    validators: {
                        length: {
                            min: "2",
                            max: "255"
                        }
                    },
                    annotations: {}
                },
                profile: {
                    values: [],
                    name: "profile",
                    displayName: "Profile",
                    required: true,
                    readOnly: false,
                    multivalued: true,
                    validators: {
                        options: {
                            options: ["admin", "user", "manager"]
                        }
                    },
                    annotations: {
                        inputOptionLabels: {
                            "admin": "Administrateur",
                            "user": "Utilisateur",
                            "manager": "Manager"
                        }
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
