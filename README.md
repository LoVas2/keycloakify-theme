# Thème Hachette - KNE powered par Keycloakify

## Commandes

```bash
# Lancer le serveur de développement Vite
npm run dev

# Compiler le projet TypeScript et créer le build
npm run build

# Compiler et créer le thème Keycloak (.jar)
npm run build-keycloak-theme

# Lancer Storybook pour visualiser les composants
npm run storybook

# Formater le code avec Prettier
npm run format
```

## Créer une nouvelle page

### 1. Définir le contexte dans KcContext.ts

Ajouter le type de la page dans `KcContextExtensionPerPage` :

```typescript
export type KcContextExtensionPerPage = {
    "ma-nouvelle-page.ftl": {
        url: {
            loginRestartFlowUrl: string;
            loginAction: string;
            registrationAction: string;
        };
        messageHeader: string;
        profile: UserProfile;
        // Autres propriétés spécifiques...
    };
};
```

### 2. Créer le composant React

Créer le fichier `src/login/pages/MaNouvellePage.tsx` :

```typescript
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function MaNouvellePage(
    props: PageProps<Extract<KcContext, { pageId: "ma-nouvelle-page.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;
    // ...
}
```

### 3. Enregistrer la page dans KcPage.tsx

Importer et ajouter le case dans le switch :

```typescript
import MaNouvellePage from "./pages/MaNouvellePage";

// Dans le switch :
case "ma-nouvelle-page.ftl": return (
    <MaNouvellePage
        {...{ kcContext, i18n, classes }}
        Template={Template}
        doUseDefaultCss={true}
    />
);
```

### 4. Créer la story

Créer `src/login/pages/MaNouvellePage.stories.tsx` :

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { createKcPageStory } from "../KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "ma-nouvelle-page.ftl" });

const meta = {
    title: "login/ma-nouvelle-page.ftl",
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
                        // Définir les attributs nécessaires
                        monChamp: {
                            name: "monChamp",
                            value: "",
                            displayName: "Mon champ",
                            required: true,
                            validators: {},
                            annotations: {},
                            autocomplete: "off"
                        }
                    }
                }
            }}
        />
    )
};
```

## Gestion des formulaires avec Keycloakify

### Architecture

Keycloakify utilise le hook `useUserProfileForm` pour gérer l'état des formulaires de manière centralisée. Ce hook communique avec le profil utilisateur défini côté Keycloak.

### Concepts clés

#### 1. Controlled Components

Les inputs sont des "controlled components" React : leur valeur est contrôlée par React plutôt que par le DOM.

```typescript
<input
    value={(field?.valueOrValues as string) ?? ""}
    onChange={e => dispatchFormAction({
        action: "update",
        name: "firstName",
        valueOrValues: e.target.value
    })}
/>
```

**Pourquoi ?**
- Validation en temps réel
- Accès à la valeur n'importe où dans le composant
- Synchronisation avec l'état global du formulaire

#### 2. useUserProfileForm

Ce hook retourne :
- `formFieldStates` : états de tous les champs (valeurs, erreurs, etc.)
- `dispatchFormAction` : fonction pour mettre à jour les champs

```typescript
const {
    formState: { formFieldStates },
    dispatchFormAction
} = useUserProfileForm({
    kcContext,
    i18n,
    doMakeUserConfirmPassword: false
});

// Récupérer un champ spécifique
const firstNameField = formFieldStates.find(
    field => field.attribute.name === "firstName"
);
```

#### 3. dispatchFormAction

Deux actions disponibles :

**`update`** - Met à jour la valeur d'un champ
```typescript
dispatchFormAction({
    action: "update",
    name: "firstName",
    valueOrValues: e.target.value
})
```

**`focus lost`** - Déclenche la validation quand l'utilisateur quitte le champ
```typescript
dispatchFormAction({
    action: "focus lost",
    name: "firstName",
    fieldIndex: undefined
})
```

#### 4. Profil utilisateur (backend Keycloak)

Chaque attribut défini dans Keycloak contient :

```typescript
{
    name: "firstName",
    displayName: "First name",
    required: true,

    // Validateurs appliqués automatiquement
    validators: {
        length: { min: 2, max: 50 },
        pattern: { pattern: "^[a-zA-Z]+$", "error-message": "Lettres uniquement" }
    },

    // Métadonnées pour l'UI
    annotations: {
        inputHelperTextBefore: "Texte d'aide avant le champ",
        inputHelperTextAfter: "Texte d'aide après le champ",
        inputType: "text"
    },

    autocomplete: "given-name"
}
```

#### 5. Affichage des erreurs

Les erreurs sont disponibles dans `displayableErrors` :

```typescript
{firstNameField && firstNameField.displayableErrors.length > 0 && (
    <FieldErrors
        attribute={firstNameField.attribute}
        displayableErrors={firstNameField.displayableErrors}
        kcClsx={kcClsx}
    />
)}
```

### Flow complet

1. User tape → `onChange` → `dispatchFormAction({ action: "update", ... })`
2. `useUserProfileForm` met à jour son état interne
3. Re-render avec nouvelle `valueOrValues`
4. User quitte le champ → `onBlur` → `dispatchFormAction({ action: "focus lost", ... })`
5. Validation déclenchée → `displayableErrors` mis à jour

### Configuration des Stories

Pour que Storybook fonctionne, il faut définir le profil avec les attributs nécessaires :

```typescript
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
```
