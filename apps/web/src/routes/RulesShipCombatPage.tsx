import { AssetCard } from "../components/cards/AssetCard";
import { Tag } from "../components/common/Tag";
import { Text } from "../components/common/Text";
import { LocationCard } from "../components/styleguide/LocationCard";

const componentNotes = [
  "Location cards are ship rooms.",
  "Device Asset cards sit on those rooms: turrets, Sensors, Shields, Engines, Reactor, Life Support, Workbench, and Missile Bay.",
  "Circular Power tokens sit on Device cards and show assigned Power.",
  "Minis/Actor tokens stand in the room they are manning.",
  "Effect cards mark damage, Burning, Freezing, Complication, Toxic Air, or Hull Breach statuses.",
];

const shipLayoutRules = [
  "Place one row of Location cards for each ship. Put the Device Asset card on the Location where that Device lives.",
  "Put circular Power tokens directly on Device Asset cards. Active tokens may be reassigned; spent tokens stay on their Device until End of Round cleanup.",
  "Put each Actor token on the Location they are manning. The Actor may activate that Location's Device with their action.",
  "Track hull damage as a shared ship counter. Track Device damage on the Device Asset card; its effective level is level - damage.",
  "When hull damage creates a room problem, put the status card on the hit Location so everyone can see the current pressure.",
  "Keep enemy ships laid out the same way. If Sensors do not beat enemy Cloaking, choose the target Device randomly by dice.",
];

const combatLoop = [
  "Normal Mighty Decks combat still applies: player turn, assigned enemy turn, move plus one action.",
  "A crew Actor in a Ship Location uses their action to activate the Device Asset there.",
  "Generator level defines the ship Power pool. Assign active circular Power tokens to Devices.",
  "Device activation can spend up to the lower of active assigned Power and effective Device level.",
  "Most Devices exhaust after one activation per round and gain Device Used markers.",
  "End of Round clears Device Used markers and flips spent Power tokens back to active.",
];

const damageRules = [
  "Damage formula: attacker Outcome Effect + weapon damage - defender Outcome Effect - Shields.",
  "Device effective level is level - damage. A Device is destroyed when damage equals its level.",
  "Overflow damage after a Device is destroyed hits hull and adds a status to the hit Location.",
  "Rupture Cascade starts when hull damage reaches hull points; the ship breaks up at the end of the next turn.",
];

const powerAlternatives = [
  "Chosen default: flip spent tokens and lock them until cleanup.",
  "Spent tray at generator: collect spent tokens beside Reactor until End of Round.",
  "Allocation phase: assign all Power at round start, then freeze routes until cleanup.",
  "Device Used markers: mark a Device after activation, even if not all Power was spent.",
  "Actor/station lock: only the Actor manning Reactor or the Device can reassign its Power.",
  "Per-device capacitor slots: each Device has slots that empty once used this round.",
];

type ReferencePanelData = {
  title: string;
  label: string;
  assetCard?: {
    deck?: string;
    modifier: string;
    noun: string;
    nounDescription: string;
    adjectiveDescription: string;
    iconUrl: string;
  };
  locationCard?: {
    imageUrl: string;
    title: string;
    description: string;
  };
  rules: readonly string[];
  variants?: readonly string[];
};

const buildDeviceAssetCard = ({
  noun,
  iconUrl,
  nounDescription,
  adjectiveDescription = "A custom ship Device Asset card for the ship-combat prototype.",
}: {
  noun: string;
  iconUrl: string;
  nounDescription: string;
  adjectiveDescription?: string;
}): NonNullable<ReferencePanelData["assetCard"]> => ({
  deck: "sci-fi",
  modifier: "",
  noun,
  nounDescription,
  adjectiveDescription,
  iconUrl,
});

const deviceReferencePanels = [
  {
    title: "Flight Controls",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Flight Controls",
      iconUrl: "/assets/spaceship/devices/flight-controls-device.png",
      nounDescription: "Pilot station for dodging, range changes, target locks, and positional Boosts.",
    }),
    rules: [
      "Actor manning this Device can defend from ship attacks by dodging; use this to dodge incoming ship attacks with an Outcome card.",
      "On their turn, the pilot can change range closer/farther if Engines are powered.",
      "The pilot can line up a shot to grant Boost to a turret, use terrain for cover or positional Boost, break target lock, cover a boarding approach, or brace the ship to reduce the next Location status severity.",
      "Flight Controls do not require Power themselves and cannot be targeted from outside.",
    ],
  },
  {
    title: "Weapon Turret",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Weapon Turret",
      iconUrl: "/assets/spaceship/devices/weapon-turret-device.png",
      nounDescription: "Powered ship weapon station for attacking ships or defending from missiles.",
    }),
    rules: [
      "Actor manning this Device can attack another ship or defend from missiles.",
      "Requires Power. Device Level sets the maximum total Power assignable.",
      "The Actor may spend less Power than the Device maximum if they want to conserve active tokens.",
    ],
    variants: [
      "Laser Turret: 1 Power = 1 energy damage.",
      "Scatter Turret: 1 Power = 2 ballistic damage, then -1 damage per distance.",
      "Rail Turret: 1 Power = 1 ballistic damage; can charge up to 3 rounds with an Outcome card each, for extra damage +0, +1, or +2.",
      "Minigun Turret: 1 Power = 1 ballistic damage; double damage against missiles and organic targets.",
      "Arc Turret: 1 Power = 1 energy damage; damages all enemies in the target Location, including swarms or Actors there.",
      "Plasma Turret: 1 Power = 1 energy damage; heats up the target Location.",
      "Radiation Turret: 1 Power = 1 energy damage; creates toxic particles in the target Location.",
      "Cryo Turret: 1 Power = 1 ballistic damage; freezes the target Location.",
      "Tractor Turret: 1 Power = 1 energy damage; pushes or pulls targets.",
      "Acid Turret: 1 Power = 1 chemical damage; does double damage to ship hull.",
    ],
  },
  {
    title: "Sensors",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Sensors",
      iconUrl: "/assets/spaceship/devices/sensors-device.png",
      nounDescription: "Scanner and electronic warfare station for Detection, Cloaking, and target locks.",
    }),
    rules: [
      "Actor manning this Device can search with scanners, reveal weakpoints, place Complication on a target Device, or use electronic warfare to temporarily disable enemy Devices.",
      "Assign Power between Detecting and Cloaking modes.",
      "Sensors only allow specific targeting when Detection Power is higher than enemy Cloaking Power.",
      "Level sets the maximum total Power assignable.",
    ],
  },
  {
    title: "Shields",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Shields",
      iconUrl: "/assets/spaceship/devices/shields-device.png",
      nounDescription: "Powered shield projector for damage reduction and damage-type tuning.",
    }),
    rules: [
      "Actor manning this Device can boost shields for higher damage reduction.",
      "They may also tune Shields for a specific damage type.",
      "Shield reduction is subtracted after the defender's Outcome Effect.",
    ],
  },
  {
    title: "Engines",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Engines",
      iconUrl: "/assets/spaceship/devices/engines-device.png",
      nounDescription: "Drive system that controls range pressure and risky overdrive output.",
    }),
    rules: [
      "Actor manning this Device can give Engines extra Power over its maximum as overdrive.",
      "Difference between ally and enemy Engine Power determines whether ships get closer or farther away.",
      "Level sets the maximum total Power assignable before overdrive risk.",
    ],
  },
  {
    title: "Spin Drive",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Spin Drive",
      iconUrl: "/assets/spaceship/devices/spin-drive-device.png",
      nounDescription: "Interstellar travel drive that charges over multiple powered rounds.",
    }),
    rules: [
      "Required for travel between star systems.",
      "Requires Power and several rounds to spin up.",
      "Higher Level and more Power shortens the spin-up time.",
    ],
  },
  {
    title: "Life Support",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Life Support",
      iconUrl: "/assets/spaceship/devices/life-support-device.png",
      nounDescription: "Atmosphere, pressure, temperature, gravity, and door-control system.",
    }),
    rules: [
      "Required for artificial gravity and breathable atmosphere on the ship.",
      "Actor manning this Device can depressurize any Location to clear fires or toxic air.",
      "They can re-pressurize a Location, control temperature, and control doors remotely, including an airlock.",
      "Re-pressurizing is automatic if Life Support is Powered.",
    ],
  },
  {
    title: "Workbench",
    label: "Device",
    assetCard: buildDeviceAssetCard({
      noun: "Workbench",
      iconUrl: "/assets/spaceship/devices/workbench-device.png",
      nounDescription: "Repair and fabrication station for specialized shipboard crafting.",
    }),
    rules: [
      "May be required for specialized crafting.",
      "Supports Device repair, missile preparation, field fabrication, and other tool-heavy actions when the Storyteller wants a physical station requirement.",
    ],
  },
] as const satisfies readonly ReferencePanelData[];

const specialLocationPanels = [
  {
    title: "Docking Bay",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/docking-bay-63de54ac4b3c469379e9.png",
      title: "Docking Bay",
      description: "A hard-lock bay for shuttles, boarding craft, cargo traffic, and sudden breaches.",
    },
    rules: [
      "Can store a shuttle or a fighter.",
      "Actors can board, launch, recover, or defend small craft here when the bay is accessible.",
    ],
  },
  {
    title: "Cargo Bay",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/cargo-hold-202afa0e160b9f892887.png",
      title: "Cargo Bay",
      description: "Stacked crates, salvage cages, and loose mass that becomes cover or hazard under fire.",
    },
    rules: [
      "Can store cargo.",
      "Cargo can become cover, a mission objective, a hazard, or a resource source during ship combat.",
    ],
  },
  {
    title: "Crew Quarters",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/crew-quarters-fb4b60ee93280b0a8dca.png",
      title: "Crew Quarters",
      description: "Bunks, lockers, personal effects, and the ship's fragile reserve of morale.",
    },
    rules: [
      "Required for crew comfort.",
      "Damage or long-term loss can create morale pressure, fatigue, or comfort-related complications between fights.",
    ],
  },
  {
    title: "Med Bay",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/medical-bay-db2f101567e8ebf32643.png",
      title: "Med Bay",
      description: "A clinical station for emergency triage, surgical tools, and stabilizing wounded crew.",
    },
    rules: [
      "Can heal minor injuries.",
      "Can heal minor injuries or boost a medic's healing abilities when they treat Actors in this Location.",
    ],
  },
  {
    title: "Ritual Hall",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/ritual-chamber-486d7edd806eec3296e2.png",
      title: "Ritual Hall",
      description: "A sanctified chamber of sigils, machinery, and rites prepared for spiritual work.",
    },
    rules: [
      "Required for conducting rituals.",
      "boosts spiritual abilities when the ritual needs a prepared sacred or occult space.",
    ],
  },
  {
    title: "Morgue",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/morgue-shroud-operating-table.png",
      title: "Morgue",
      description:
        "Cold storage drawers and a spot-lit operating table where death-priests prepare bodies for forbidden reconstruction.",
    },
    rules: [
      "Can preserve bodies, samples, and evidence after combat.",
      "Death-priest or medic actions here can study remains, harvest clues, prepare unsettling repairs, or create complications if the room is damaged.",
      "If breached or depowered, stored remains, chemicals, or ritual equipment can become a morale hazard or contamination threat.",
    ],
  },
  {
    title: "Missile Bay",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/missile-bay-97234afe5d3d668c403b.png",
      title: "Missile Bay",
      description: "A cramped munition room where crews craft, load, arm, and risk unstable ordnance.",
    },
    rules: [
      "Actors can craft, load, and target missiles here.",
      "Higher Level means more missiles can be fired at the same time.",
      "Does not require Power. Missiles pass through shields, but cost resources.",
    ],
  },
  {
    title: "Reactor",
    label: "Location",
    locationCard: {
      imageUrl: "/api/adventure-artifacts/reactor-99836c3e8add9c720018.png",
      title: "Reactor",
      description: "The ship's unstable power heart, always one heroic override away from a cascade.",
    },
    rules: [
      "Provides Power to the ship.",
      "Actors here can boost its Power output, cut power to a system, or trigger a Rupture Cascade intentionally.",
    ],
  },
] as const satisfies readonly ReferencePanelData[];

const RulesList = ({ items }: { items: readonly string[] }): JSX.Element => (
  <ul className="stack gap-2">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-kac-gold-dark" />
        <Text variant="body" color="iron-light" className="text-sm">
          {item}
        </Text>
      </li>
    ))}
  </ul>
);

const RulesSection = ({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}): JSX.Element => (
  <section className="stack gap-3">
    <Text variant="h3" color="iron" className="text-xl">
      {title}
    </Text>
    <RulesList items={items} />
  </section>
);

const ReferencePanel = ({
  title,
  label,
  assetCard,
  locationCard,
  rules,
  variants,
}: ReferencePanelData): JSX.Element => (
  <article className="stack gap-3 rounded-sm border-2 border-kac-iron/30 bg-kac-bone-light/70 p-3">
    <div className="flex flex-wrap items-center gap-2">
      <Tag tone={label === "Device" ? "bone" : "cloth"} size="sm">
        {label}
      </Tag>
      <Text as="h4" variant="emphasised" color="iron" className="text-lg">
        {title}
      </Text>
    </div>
    <div
      className={
        locationCard
          ? "grid gap-3 sm:grid-cols-[minmax(220px,244px)_1fr]"
          : "grid gap-3 sm:grid-cols-[minmax(112px,150px)_1fr]"
      }
    >
      <div className="flex flex-col items-center gap-3">
        {locationCard ? (
          <LocationCard
            imageUrl={locationCard.imageUrl}
            imageAlt={locationCard.title}
            title={locationCard.title}
            description={locationCard.description}
            className="mx-auto w-[244px] max-w-full"
          />
        ) : null}
        {assetCard ? (
          <AssetCard
            kind="custom"
            {...assetCard}
            className="mx-auto w-[150px] max-w-full"
          />
        ) : null}
      </div>
      <RulesList items={rules} />
    </div>
    {variants ? (
      <div className="stack gap-2 border-t-2 border-kac-iron/20 pt-3">
        <Text as="h5" variant="emphasised" color="iron" className="text-sm">
          Weapon Patterns
        </Text>
        <RulesList items={variants} />
      </div>
    ) : null}
  </article>
);

export const RulesShipCombatPage = (): JSX.Element => {
  return (
    <div className="rules-ship-combat-page stack gap-6">
      <section className="rules-ship-combat-page__intro stack gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="gold" size="sm">
            Prototype
          </Tag>
          <Tag tone="cloth" size="sm">
            Local rules reference
          </Tag>
        </div>
        <Text variant="h2" color="iron" className="text-[2rem]">
          Ship Combat Prototype
        </Text>
        <Text variant="body" color="iron-light" className="max-w-4xl text-sm">
          This route illustrates ship-to-ship combat as physical components on
          the table: Location cards, Device Asset cards, circular Power tokens,
          minis/Actor tokens, and status cards. It is not a synchronized combat
          engine yet.
        </Text>
      </section>

      <section className="rules-ship-combat-page__layout stack gap-3">
        <Text variant="h3" color="iron" className="text-xl">
          Ship Layout Without A Diagram
        </Text>
        <RulesList items={shipLayoutRules} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <RulesSection title="Physical Components" items={componentNotes} />
        <RulesSection title="Round And Power" items={combatLoop} />
        <RulesSection title="Damage And Cascade" items={damageRules} />
        <RulesSection title="Power Token Alternatives" items={powerAlternatives} />
      </div>

      <section className="stack gap-4">
        <Text variant="h3" color="iron" className="text-xl">
          Device Reference Panels
        </Text>
        <div className="grid gap-3 md:grid-cols-2">
          {deviceReferencePanels.map((panel) => (
            <ReferencePanel key={panel.title} {...panel} />
          ))}
        </div>
      </section>

      <section className="stack gap-4">
        <Text variant="h3" color="iron" className="text-xl">
          Special Location Reference Panels
        </Text>
        <div className="grid gap-3 md:grid-cols-2">
          {specialLocationPanels.map((panel) => (
            <ReferencePanel key={panel.title} {...panel} />
          ))}
        </div>
      </section>
    </div>
  );
};
