import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "register-custom-personal-data.ftl" });

const meta = {
    title: "login/register-custom-personal-data.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <KcPageStory
            kcContext={{
                profile: {
                    attributesByName: {
                        firstName: {
                            name: "firstName",
                            value: "",
                            displayName: "First name",
                            required: true,
                            validators: {},
                            annotations: {},
                            autocomplete: "given-name"
                        }
                    }
                }
            }}
        />
    )
};