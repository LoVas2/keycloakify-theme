/* eslint-disable @typescript-eslint/no-unused-vars */
import { i18nBuilder } from "keycloakify/login";
import type { ThemeName } from "../kc.gen";

/** @see: https://docs.keycloakify.dev/features/i18n */
const { useI18n, ofTypeI18n } = i18nBuilder
    .withThemeName<ThemeName>()
    .withCustomTranslations({
        // WARNING: You can't import the translation from external files
        en: {
            invalidEmailConfirmMessage: "Email confirmation doesn't match",
            civility: "Title",
            profile: "Profile"
        },
        // cspell: disable
        fr: {
            invalidEmailConfirmMessage: "L'email de confirmation ne correspond pas.",
            civility: "Civilité",
            profile: "Profil"
        }
    })
    .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };
