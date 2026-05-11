import type {
  ActorTokenModel,
  EnergyTokenModel,
  ShipActorCustomCardModel,
  ShipActorInstance,
  ShipDeviceInstance,
  ShipLocationInstance,
  ShipLocationType,
} from "./spaceshipTypes";

export const exilesActorCards = {
  machinistPriestHeretic: {
    imageUrl: "/api/adventure-artifacts/machinist-priest-profile-ec92bc7e9074ab3a50ec.png",
    adjective: "",
    noun: "Machinist-Priest Heretic",
    nounDescription:
      "An exiled engineer-priest who treats forbidden machine communion as holy work.",
    adjectiveDescription: "Machine Speaker\nServo-Arms\nSpecialized Augments",
  },
  augmentedVeteran: {
    imageUrl: "/api/adventure-artifacts/augmented-veteran-male-profile-f520a85de6d856aee8ae.png",
    adjective: "",
    noun: "Augmented Veteran",
    nounDescription:
      "A battle-scarred Legion deserter rebuilt for war and stubborn survival.",
    adjectiveDescription: "Weapon Proficiency\nAugmented Body\nPain Inhibitor",
  },
  voidSeer: {
    imageUrl: "/api/adventure-artifacts/void-seer-male-profile-068f166010f79cfded63.png",
    adjective: "",
    noun: "Void-seer",
    nounDescription:
      "A navigator-mystic who reads the Void and bends space just enough to survive it.",
    adjectiveDescription: "Certified Navigator\nSpace Folding\nGravity Manipulation",
  },
  syntheticMedic: {
    imageUrl: "/api/adventure-artifacts/robot-surgeon-male-profile-dea30fb20cdbdfbce28d.png",
    adjective: "",
    noun: "Synthetic Medic",
    nounDescription:
      "An illegal sentient intelligence piloting a medic shell and looking for purpose.",
    adjectiveDescription: "Knowledge Base\nExpert Doctor\nVacuum Tolerance",
  },
} satisfies Record<string, ShipActorCustomCardModel>;

const deviceByLocationType: Partial<Record<
  ShipLocationType,
  {
    title: string;
    type: ShipDeviceInstance["type"];
    modifier: string;
    nounDescription: string;
    adjectiveDescription: string;
    iconUrl: string;
    maxPower?: number;
    used?: boolean;
    damage?: number;
  }
>> = {
  cockpit: {
    title: "Flight Controls",
    type: "flight-controls",
    modifier: "",
    nounDescription:
      "Pilot station for dodging, range changes, target locks, and positional Boosts.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/flight-controls-device.png",
    maxPower: 0,
  },
  "engine-room": {
    title: "Engines",
    type: "engines",
    modifier: "",
    nounDescription: "Drive system that controls range pressure and risky overdrive output.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/engines-device.png",
  },
  "life-support": {
    title: "Life Support",
    type: "life-support",
    modifier: "",
    nounDescription:
      "Atmosphere, pressure, temperature, gravity, and door-control system.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/life-support-device.png",
  },
  reactor: {
    title: "Reactor",
    type: "reactor",
    modifier: "",
    nounDescription: "Ship power heart for routing Power, overrides, and risky cascade choices.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/reactor-device.png",
  },
  "medical-bay": {
    title: "Med Bay",
    type: "support",
    modifier: "",
    nounDescription: "Clinical support station for emergency triage and stabilizing wounded crew.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/life-support-device.png",
    maxPower: 0,
  },
  "missile-bay": {
    title: "Missile Bay",
    type: "missile-bay",
    modifier: "",
    nounDescription: "Munition station where crews craft, load, arm, and target missiles.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/missile-bay-device.png",
    maxPower: 0,
  },
  "sensor-array": {
    title: "Sensors",
    type: "sensors",
    modifier: "",
    nounDescription:
      "Scanner and electronic warfare station for Detection, Cloaking, and target locks.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/sensors-device.png",
  },
  "shield-generator": {
    title: "Shields",
    type: "shields",
    modifier: "",
    nounDescription:
      "Powered shield projector for damage reduction and damage-type tuning.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/shields-device.png",
  },
  "spin-drive": {
    title: "Spin Drive",
    type: "spin-drive",
    modifier: "",
    nounDescription: "Interstellar travel drive that charges over multiple powered rounds.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/spin-drive-device.png",
  },
  "laser-turret": {
    title: "Laser Turret",
    type: "weapon-turret",
    modifier: "",
    nounDescription:
      "Powered ship weapon station for attacking ships or defending from missiles.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/weapon-turret-device.png",
  },
  "scatter-turret": {
    title: "Scatter Turret",
    type: "weapon-turret",
    modifier: "",
    nounDescription:
      "Powered ship weapon station for attacking ships or defending from missiles.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/weapon-turret-device.png",
  },
  "weapons-station": {
    title: "Weapon Turret",
    type: "weapon-turret",
    modifier: "",
    nounDescription:
      "Powered ship weapon station for attacking ships or defending from missiles.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/weapon-turret-device.png",
    used: true,
    damage: 1,
  },
  "crew-quarters": {
    title: "Workbench",
    type: "workbench",
    modifier: "",
    nounDescription:
      "Repair and fabrication station for specialized shipboard crafting.",
    adjectiveDescription: "A custom ship Device Asset card for the ship-combat prototype.",
    iconUrl: "/assets/spaceship/devices/workbench-device.png",
    maxPower: 0,
  },
};

const createDeviceForLocation = (
  location: Pick<
    ShipLocationInstance,
    "locationId" | "locationType" | "level" | "energyTokens"
  >,
): ShipDeviceInstance | undefined => {
  const template = deviceByLocationType[location.locationType];
  if (!template) {
    return undefined;
  }

  const maxPower = template.maxPower ?? location.level;
  const powerTokens: EnergyTokenModel[] = location.energyTokens.map((token) => ({
    ...token,
    detail:
      token.detail ??
      (token.state === "spent" ? "Spent power locked until cleanup" : "Active power"),
  }));

  return {
    deviceId: `${location.locationId}-device`,
    title: template.title,
    type: template.type,
    level: location.level,
    damage: template.damage ?? 0,
    used: template.used ?? false,
    maxPower,
    powerTokens,
    asset: {
      deck: "sci-fi",
      modifier: template.modifier,
      noun: template.title,
      nounDescription: template.nounDescription,
      adjectiveDescription: template.adjectiveDescription,
      iconUrl: template.iconUrl,
    },
  };
};

export const createPlayerLocation = (
  location: Omit<ShipLocationInstance, "lastTouchedOrder">,
  index: number,
): ShipLocationInstance => ({
  ...location,
  device: location.device ?? createDeviceForLocation(location),
  lastTouchedOrder: index + 1,
});

export const createActor = (
  actor: Omit<ShipActorInstance, "lastTouchedOrder">,
  index: number,
): ShipActorInstance => ({
  ...actor,
  lastTouchedOrder: index + 1,
});

export const exilesActorTokens = {
  machinist: {
    tokenId: "actor-machinist-token",
    label: "Machinist",
    imageUrl: exilesActorCards.machinistPriestHeretic.imageUrl,
    title: "Reactor",
    subtitle: "Routing power",
    tone: "gold",
    locationId: "player-reactor",
  },
  veteran: {
    tokenId: "actor-veteran-token",
    label: "Veteran",
    imageUrl: exilesActorCards.augmentedVeteran.imageUrl,
    title: "Sealed Corridor",
    subtitle: "Holding line",
    tone: "fire",
    locationId: "player-sealed-corridor",
  },
  seer: {
    tokenId: "actor-seer-token",
    label: "Void-seer",
    imageUrl: exilesActorCards.voidSeer.imageUrl,
    title: "Sensor Array",
    subtitle: "Reading echoes",
    tone: "cloth",
    locationId: "player-sensor-array",
  },
  medic: {
    tokenId: "actor-medic-token",
    label: "Medic",
    imageUrl: exilesActorCards.syntheticMedic.imageUrl,
    title: "Life Support",
    subtitle: "Repressurizing",
    tone: "monster",
    locationId: "player-life-support",
  },
} satisfies Record<string, ActorTokenModel>;
