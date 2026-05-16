import { cardLibrary } from "./spaceshipCardLibraryData";
import {
  pirateActors,
  pirateShipLocations,
} from "./spaceshipScenePirateData";
import {
  playerActors,
  playerShipLocations,
} from "./spaceshipScenePlayerData";
import type { SpaceshipScene } from "./spaceshipTypes";

export const spaceshipScene: SpaceshipScene = {
  sceneId: "scene-exiles-ship-prototype",
  title: "Exiles Ship Combat Mockup",
  subtitle: "",
  panes: [
    {
      paneId: "pane-player",
      title: "Exiles Corvette",
      subtitle: "Derelict corvette held together by ritual, frost, and stubborn crew.",
      backgroundImageUrl: "/api/adventure-artifacts/exiles-corvette.png",
      faction: "Crew",
      emphasis: "player",
      hullPoints: 8,
      hullDamage: 3,
      generatorLevel: 5,
      rangeBand: "near",
      detectionPower: 1,
      cloakingPower: 0,
      locations: playerShipLocations,
      actors: playerActors,
    },
    {
      paneId: "pane-pirate",
      title: "Xithrax Raider",
      subtitle: "Stolen corvette pushing a transport through the rocks.",
      backgroundImageUrl: "/api/adventure-artifacts/pirate-corvette.png",
      faction: "Pirates",
      emphasis: "enemy",
      hullPoints: 6,
      hullDamage: 2,
      generatorLevel: 4,
      rangeBand: "near",
      detectionPower: 0,
      cloakingPower: 1,
      locations: pirateShipLocations,
      actors: pirateActors,
    },
  ],
  overlay: {
    open: false,
  },
  selection: {
    selectedEntryIds: [],
  },
  zBands: {
    cards: [
      ...playerShipLocations.map((location) => location.locationId),
      ...pirateShipLocations.map((location) => location.locationId),
    ],
    tokens: [
      ...playerShipLocations.flatMap((location) =>
        location.actorTokens.map((token) => token.tokenId),
      ),
      ...pirateShipLocations.flatMap((location) =>
        location.actorTokens.map((token) => token.tokenId),
      ),
    ],
  },
  cardLibrary,
};
