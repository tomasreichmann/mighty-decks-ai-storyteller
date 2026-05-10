import { Heading } from "../components/common/Heading";
import { Text } from "../components/common/Text";
import {
  Token,
  tokenColors,
  tokenSizes,
  type TokenColor,
  type TokenSize,
} from "../components/common/Token";
import { StyleguideBackLink } from "../components/styleguide/GameCard";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

const sizeLabels: Record<TokenSize, string> = {
  sm: "0.5in",
  md: "1in",
  lg: "2in",
  xl: "3in",
};

const tokenColorImages: Record<TokenColor, string> = {
  gold: "/actors/base/commander.png",
  fire: "/actors/base/fiery.png",
  blood: "/actors/base/animal-red.png",
  bone: "/actors/base/aristocrat.png",
  steel: "/actors/base/sentry.png",
  iron: "/actors/base/construct.png",
  skin: "/actors/base/healer.png",
  cloth: "/actors/base/manipulator.png",
  curse: "/actors/base/horror.png",
  monster: "/actors/base/animal-green.png",
};

export const StyleguideTokensPage = (): JSX.Element => {
  return (
    <div className="styleguide-tokens-page app-shell stack gap-6 py-8">
      <StyleguideBackLink />
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Heading
          level="h1"
          color="iron"
          className="text-[2.2rem] sm:text-[3.2rem]"
          highlightProps={{ color: "monster-light" }}
        >
          Tokens
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          Circular character and board markers built from the shared circle
          button treatment. Portrait art fills the token, while the optional
          label mirrors the token color and size.
        </Text>
      </div>

      <section className="stack gap-5">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            Standard colors
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The ten standard color families are available for character tokens,
            spaceship crew, and future table markers.
          </Text>
        </div>
        <div className="grid items-start gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {tokenColors.map((color) => (
            <Token
              key={color}
              color={color}
              imageAlt={`${color} token`}
              imageUrl={tokenColorImages[color]}
              label={color}
            />
          ))}
        </div>
      </section>

      <section className="stack gap-5">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            Physical size ladder
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Token sizes use CSS inches so the lab can approximate printable
            tabletop pieces: sm 0.5in, md 1in, lg 2in, and xl 3in.
          </Text>
        </div>
        <div className="flex flex-wrap items-end gap-8">
          {tokenSizes.map((size) => (
            <Token
              key={size}
              color="gold"
              imageAlt={`${size} token`}
              imageUrl="/actors/base/specialist.png"
              label={`${size} ${sizeLabels[size]}`}
              size={size}
            />
          ))}
        </div>
      </section>

      <section className="stack gap-5">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            Image-only marker
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Labels are optional for dense board states where the portrait or
            surrounding card already provides the identity.
          </Text>
        </div>
        <Token
          color="curse"
          imageAlt="unlabeled token"
          imageUrl="/actors/base/horror.png"
          size="lg"
        />
      </section>

      <section className="stack gap-5">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            Selection and ping
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Selected tokens get a wide highlight ring outside the circle without
            changing layout. Ping can play once, a fixed number of times, or
            continuously for an active table cue.
          </Text>
        </div>
        <div className="flex flex-wrap items-end gap-8">
          <Token
            color="cloth"
            imageAlt="selected token"
            imageUrl="/actors/base/manipulator.png"
            label="selected"
            selected
          />
          <Token
            color="monster"
            imageAlt="single ping token"
            imageUrl="/actors/base/animal-green.png"
            label="once"
            ping={true}
          />
          <Token
            color="fire"
            imageAlt="three ping token"
            imageUrl="/actors/base/fiery.png"
            label="three"
            ping={3}
          />
          <Token
            color="curse"
            imageAlt="infinite ping token"
            imageUrl="/actors/base/horror.png"
            label="loop"
            ping="infinite"
          />
        </div>
      </section>
    </div>
  );
};
