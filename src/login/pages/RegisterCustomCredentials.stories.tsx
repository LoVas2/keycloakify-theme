import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "register-custom-credentials.ftl" });

const meta = {
    title: "login/register-custom-credentials.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => <KcPageStory />
};

export const WithPasswordMinLength8: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                passwordPolicies: {
                    length: 8
                }
            }}
        />
    )
};

export const WithComplexPasswordPolicy: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                passwordPolicies: {
                    length: 8,
                    digits: 1,
                    lowerCase: 1,
                    upperCase: 1,
                    specialChars: 1
                }
            }}
        />
    )
};

export const WithPasswordMismatch: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                passwordPolicies: {
                    length: 8
                },
                messagesPerField: {
                    existsError: (fieldName: string) => fieldName === "password-confirm",
                    get: (fieldName: string) => (fieldName === "password-confirm" ? "Passwords don't match." : undefined)
                }
            }}
        />
    )
};

export const WithAllValidations: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                passwordPolicies: {
                    length: 8,
                    digits: 1,
                    lowerCase: 1,
                    upperCase: 1,
                    specialChars: 1
                }
            }}
        />
    )
};

export const WithGlobalErrorMessage: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                message: {
                    summary: "Erreur globale",
                    type: "error"
                }
            }}
        />
    )
};

export const WithEmailConfirmErrorMessage: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                messagesPerField: {
                    existsError: (fieldName: string) => ["email", "email-confirm"].includes(fieldName),
                    get: (fieldName: string) => {
                        if (fieldName === "email") return "Invalid email format.";
                        if (fieldName === "email-confirm") return "Email confirmation doesn't match.";
                    }
                }
            }}
        />
    )
};