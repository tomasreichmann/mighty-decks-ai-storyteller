import { Heading } from "./common/Heading";
import { ImageBackground } from "./common/ImageBackground";
import { Label } from "./common/Label";
import { Panel } from "./common/Panel";
import { Section } from "./common/Section";

interface LandingProcessStep {
  id: string;
  text: string;
  tone: "bone" | "gold" | "cloth" | "fire";
  imageUri: string;
  imageClassName: string;
}

const landingProcessSteps: LandingProcessStep[] = [
  {
    id: "create",
    text: "Start an adventure",
    tone: "bone",
    imageUri: "/types/asset.png",
    imageClassName:
      "object-contain scale-[1.35] -rotate-[12deg] mix-blend-multiply",
  },
  {
    id: "invite",
    text: "Invite 1-5 players",
    tone: "cloth",
    imageUri: "/types/actor.png",
    imageClassName:
      "object-contain scale-[1.4] rotate-[9deg] mix-blend-multiply",
  },
  {
    id: "vote",
    text: "Vote on an adventure pitch",
    tone: "gold",
    imageUri: "/types/counter.png",
    imageClassName:
      "object-contain scale-[1.35] -rotate-[8deg] mix-blend-multiply",
  },
  {
    id: "play",
    text: "Play narrative scenes with an AI storyteller",
    tone: "fire",
    imageUri: "/sample-scene-image.png",
    imageClassName: "object-cover scale-110 ",
  },
];

const ProcessArrow = (): JSX.Element => {
  return (
    <div className="pointer-events-none z-20 relative">
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="h-16 w-16 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
      >
        <path
          d="M 0 100 L 100 50 L 0 0 L 30 50 Z"
          fill="#121b23"
          strokeLinecap="butt"
        />
        <g transform="scale(0.8) translate(10, 10)">
          <path d="M 0 100 L 100 50 L 0 0 L 30 50 Z" fill="url(#gradient)" />
          <svg height="0" width="0">
            <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#feecb4" stop-opacity="1" />
              <stop offset="50%" stop-color="#ffd23b" stop-opacity="1" />
              <stop offset="100%" stop-color="#886d15" stop-opacity="1" />
            </linearGradient>
          </svg>
        </g>
      </svg>
    </div>
  );
};

export const LandingHero = (): JSX.Element => {
  return (
    <Section className="stack items-center text-center gap-5">
      <Label className="self-start" size="lg">
        Mighty Decks AI Storyteller
      </Label>
      <Heading
        variant="h1"
        color="iron"
        as="h1"
        className="mt-4 mb-8 mx-auto max-w-2xl font-md-title !leading-[0.8] rotate-[-2deg] skew-x-[-10deg]"
        highlightProps={{
          lineCount: 3,
          canvasWidth: 500,
          className: "w-full h-[1.7em]",
          color: "monster-light",
        }}
      >
        A GM-less adventure table that runs on your phones and one shared screen
      </Heading>
      <div className="w-full pb-4 flex flex-col">
        <div className="self-center items-center justify-center grid grid-cols-2 sm:grid-cols-4">
          {landingProcessSteps.map((step, index) => (
            <div
              key={step.id}
              className="relative max-w-full w-[48vw] sm:w-[24vw] h-[30vw] sm:h-[15vw] lg:h-[170px] flex flex-row items-center justify-center"
            >
              <Panel
                tone={step.tone}
                className="flex-1 self-stretch -m-1"
                contentClassName="h-full w-full !p-0 overflow-hidden "
              >
                <ImageBackground
                  imageUri={step.imageUri}
                  className="h-full w-full"
                  imageClassName={step.imageClassName}
                >
                  <div className="relative z-10 flex h-full items-end justify-end p-3">
                    <Label
                      variant={
                        index < landingProcessSteps.length - 1
                          ? "bone"
                          : "monster"
                      }
                      className="absolute bottom-0 right-0 z-10 text-right "
                    >
                      {step.text}
                    </Label>
                  </div>
                </ImageBackground>
              </Panel>
              {index < landingProcessSteps.length - 1 ? <ProcessArrow /> : null}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
