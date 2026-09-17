export type StyleguideCategory =
  | "Foundations"
  | "Actions & Inputs"
  | "Feedback"
  | "Surfaces & Content"
  | "Game Components"
  | "Composite Patterns";

export type StyleguideTone =
  | "gold" | "cloth" | "bone" | "fire" | "iron" | "steel" | "blood" | "curse" | "monster" | "skin";

export type StyleguideCatalogEntry = {
  title: string;
  path: string;
  category: StyleguideCategory;
  useWhen: string;
  componentNames?: readonly string[];
  activePaths?: readonly string[];
  parent?: string;
  available?: boolean;
};

export const styleguideCategories: readonly StyleguideCategory[] = [
  "Foundations", "Actions & Inputs", "Feedback", "Surfaces & Content", "Game Components", "Composite Patterns",
];

export const styleguideCatalog: readonly StyleguideCatalogEntry[] = [
  { title: "Overview", path: "/styleguide", category: "Foundations", useWhen: "you need to find the existing primitive or pattern before building a new UI surface.", componentNames: ["Styleguide catalog"], activePaths: ["/styleguide"] },
  { title: "Typography", path: "/styleguide/typography", category: "Foundations", useWhen: "you are choosing page hierarchy, narrative copy, or a marker-highlighted heading.", componentNames: ["Heading", "Text", "Highlight"] },
  { title: "Colors", path: "/styleguide/colors", category: "Foundations", useWhen: "you need a semantic palette family, token name, or exact implementation hex.", componentNames: ["Palette tokens"] },
  { title: "Labels", path: "/styleguide/labels", category: "Foundations", useWhen: "you need a compact sticker-like heading or a semantic badge.", componentNames: ["Label"] },
  { title: "Buttons", path: "/styleguide/buttons", category: "Actions & Inputs", useWhen: "you need a standard action, prominent CTA, or compact icon action.", componentNames: ["Button", "CTAButton"] },
  { title: "Inputs", path: "/styleguide/inputs", category: "Actions & Inputs", useWhen: "you are collecting short or long-form player and author input.", componentNames: ["TextField", "TextArea"] },
  { title: "Controls", path: "/styleguide/controls", category: "Actions & Inputs", useWhen: "you need grouped choices, a single selection, or a binary setting.", componentNames: ["ToggleButton", "ButtonRadioGroup", "RockerSwitch"] },
  { title: "Loading", path: "/styleguide/loading", category: "Feedback", useWhen: "work is pending and you can show either real progress or an in-flight state.", componentNames: ["LoadingIndicator", "PendingIndicator"] },
  { title: "Messages", path: "/styleguide/messages", category: "Feedback", useWhen: "you need an informational, warning, error, or success callout.", componentNames: ["Message"] },
  { title: "Tags", path: "/styleguide/tags", category: "Feedback", useWhen: "you need a read-only chip, editable tag row, or live connection status.", componentNames: ["Tag", "Tags", "ConnectionStatusPill"] },
  { title: "Panel", path: "/styleguide/panel", category: "Surfaces & Content", useWhen: "a route-level story surface, summary, or grouped guidance truly needs a frame.", componentNames: ["Panel", "Section"] },
  { title: "Media", path: "/styleguide/media", category: "Surfaces & Content", useWhen: "an image, caption, or narrative tile needs a consistent media treatment.", componentNames: ["ImageCard", "StoryTileCard"] },
  { title: "Cards", path: "/styleguide/cards", category: "Game Components", useWhen: "you need the correct catalog-backed game card or want to compare game card directions.", componentNames: ["GameCardView", "CardBoundary"], activePaths: ["/styleguide/cards", "/styleguide/location-card", "/styleguide/encounter-card", "/styleguide/quest-card"] },
  { title: "Location Card", path: "/styleguide/location-card", category: "Game Components", useWhen: "you need a scene or zone card with an authored location reference.", componentNames: ["LocationCard"], parent: "/styleguide/cards" },
  { title: "Encounter Card", path: "/styleguide/encounter-card", category: "Game Components", useWhen: "you need an encounter card with authored pressure and content.", componentNames: ["EncounterCard"], parent: "/styleguide/cards" },
  { title: "Quest Card", path: "/styleguide/quest-card", category: "Game Components", useWhen: "you need an authored quest card and its story framing.", componentNames: ["QuestCard"], parent: "/styleguide/cards" },
  { title: "Tokens", path: "/styleguide/tokens", category: "Game Components", useWhen: "you need a circular actor, crew, or board marker.", componentNames: ["Token"], activePaths: ["/styleguide/tokens", "/styleguide/actor-token"] },
  { title: "Actor Token", path: "/styleguide/actor-token", category: "Game Components", useWhen: "you need a focused reference for actor-token presentation.", componentNames: ["ActorToken"], parent: "/styleguide/tokens" },
  { title: "Step Navigation", path: "/styleguide/step-navigation", category: "Composite Patterns", useWhen: "a multi-step flow needs visible progress without becoming a dashboard.", componentNames: ["StepNavigation"] },
  { title: "Session Chat", path: "/styleguide/session-chat", category: "Composite Patterns", useWhen: "you are composing a player or storyteller transcript and action surface.", componentNames: ["StyleguideSessionChatMock"], activePaths: ["/styleguide/session-chat", "/styleguide/session-chat-player", "/styleguide/session-chat-storyteller"] },
  { title: "Player Session Chat", path: "/styleguide/session-chat-player", category: "Composite Patterns", useWhen: "you need the player-focused transcript treatment in isolation.", componentNames: ["Player session chat"], parent: "/styleguide/session-chat" },
  { title: "Storyteller Session Chat", path: "/styleguide/session-chat-storyteller", category: "Composite Patterns", useWhen: "you need the storyteller-focused transcript treatment in isolation.", componentNames: ["Storyteller session chat"], parent: "/styleguide/session-chat" },
] as const;

export const styleguidePaletteFamilies = [
  { name: "Gold", tone: "gold", meaning: "Primary", description: "Lead accents, the main action, and the strongest emphasis in the system.", variants: [{ token: "gold", hex: "#F7B500" }, { token: "gold-light", hex: "#FEF3B6" }, { token: "gold-dark", hex: "#F8A732" }, { token: "gold-darker", hex: "#CC7E0D" }] },
  { name: "Cloth", tone: "cloth", meaning: "Info", description: "Helpful guidance, supporting context, and explanatory copy.", variants: [{ token: "cloth", hex: "#2F6FED" }, { token: "cloth-light", hex: "#82A1BA" }, { token: "cloth-lightest", hex: "#D9E3EA" }, { token: "cloth-dark", hex: "#3C598D" }] },
  { name: "Bone", tone: "bone", meaning: "Muted", description: "Secondary surfaces, quieter text, and anything that should recede.", variants: [{ token: "bone", hex: "#E8C9A6" }, { token: "bone-light", hex: "#E8D1B6" }, { token: "bone-dark", hex: "#AC8D6B" }, { token: "bone-darker", hex: "#91765A" }] },
  { name: "Fire", tone: "fire", meaning: "Warning", description: "Attention, caution, and urgent signals that need a fast read.", variants: [{ token: "fire", hex: "#E45700" }, { token: "fire-light", hex: "#FDAD19" }, { token: "fire-lightest", hex: "#FEE58F" }, { token: "fire-dark", hex: "#9D0F0C" }] },
  { name: "Iron", tone: "iron", meaning: "High contrast", description: "Special-case text and accents that must stay legible on busy surfaces.", variants: [{ token: "iron", hex: "#1F2937" }, { token: "iron-light", hex: "#324457" }, { token: "iron-dark", hex: "#101B26" }] },
  { name: "Steel", tone: "steel", meaning: "Machine", description: "Technical cues, mechanical surfaces, and system-like feedback.", variants: [{ token: "steel", hex: "#B7C0CD" }, { token: "steel-light", hex: "#F4F4F5" }, { token: "steel-dark", hex: "#6F8098" }] },
  { name: "Blood", tone: "blood", meaning: "Destructive", description: "Removal, irreversible actions, and strong negative consequence.", variants: [{ token: "blood", hex: "#C1121F" }, { token: "blood-light", hex: "#E82029" }, { token: "blood-lighter", hex: "#FD7D7D" }, { token: "blood-lightest", hex: "#FE9C9E" }, { token: "blood-dark", hex: "#722538" }] },
  { name: "Curse", tone: "curse", meaning: "Error", description: "Failures, invalid state, and anything that should read as a problem now.", variants: [{ token: "curse", hex: "#E83E8C" }, { token: "curse-light", hex: "#FD718C" }, { token: "curse-lighter", hex: "#FEC7CA" }, { token: "curse-lightest", hex: "#FEEEED" }, { token: "curse-dark", hex: "#C6034C" }] },
  { name: "Monster", tone: "monster", meaning: "Success", description: "Positive completion, safe success states, and reassuring confirmation.", variants: [{ token: "monster", hex: "#3CB371" }, { token: "monster-light", hex: "#B5F3B7" }, { token: "monster-lightest", hex: "#E5FCA7" }, { token: "monster-dark", hex: "#28B13A" }] },
  { name: "Skin", tone: "skin", meaning: "Human", description: "Personal, warm, and character-facing labels that should feel alive.", variants: [{ token: "skin", hex: "#F7B8C6" }, { token: "skin-light", hex: "#F6D1D0" }, { token: "skin-dark", hex: "#F1979A" }] },
] as const satisfies readonly { name: string; tone: StyleguideTone; meaning: string; description: string; variants: readonly { token: string; hex: string }[] }[];

export const isStyleguideCatalogEntryAvailable = (entry: StyleguideCatalogEntry): boolean => entry.available !== false;
export const styleguideCatalogChildren = (parentPath: string) => styleguideCatalog.filter(
  (entry) => entry.parent === parentPath && isStyleguideCatalogEntryAvailable(entry),
);
export const styleguideNavigationEntries = styleguideCatalog.filter(
  (entry) => entry.parent === undefined && isStyleguideCatalogEntryAvailable(entry),
);
