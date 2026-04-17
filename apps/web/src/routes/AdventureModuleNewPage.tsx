import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { PendingIndicator } from "../components/PendingIndicator";
import { Text } from "../components/common/Text";
import { TextField } from "../components/common/TextField";
import {
  createAdventureModule,
  getAdventureModuleSlugAvailability,
} from "../lib/adventureModuleApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";

type SlugStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const slugStatusTone = (status: SlugStatus): "iron-light" | "monster" | "blood" => {
  if (status === "available") {
    return "monster";
  }
  if (status === "taken" || status === "invalid" || status === "error") {
    return "blood";
  }
  return "iron-light";
};

export const AdventureModuleNewPage = (): JSX.Element => {
  const navigate = useNavigate();
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugMessage, setSlugMessage] = useState("Enter a title to generate a slug.");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slugTouched) {
      return;
    }
    setSlug(normalizeSlug(title));
  }, [title, slugTouched]);

  useEffect(() => {
    const candidate = slug.trim();
    if (candidate.length === 0) {
      setSlugStatus("invalid");
      setSlugMessage("Slug is required.");
      return;
    }
    if (!SLUG_PATTERN.test(candidate)) {
      setSlugStatus("invalid");
      setSlugMessage("Slug must be lowercase kebab-case.");
      return;
    }

    setSlugStatus("checking");
    setSlugMessage("Checking slug availability");

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await getAdventureModuleSlugAvailability(
            candidate,
            creatorToken,
          );
          if (cancelled) {
            return;
          }
          if (result.available) {
            setSlugStatus("available");
            setSlugMessage("Slug is available.");
            return;
          }
          setSlugStatus("taken");
          setSlugMessage(result.reason ?? "Slug is already in use.");
        } catch (loadError) {
          if (cancelled) {
            return;
          }
          setSlugStatus("error");
          setSlugMessage(
            loadError instanceof Error
              ? loadError.message
              : "Could not check slug availability.",
          );
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, creatorToken]);

  const titleTrimmed = title.trim();
  const canCreate =
    !submitting && titleTrimmed.length > 0 && slugStatus === "available";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (titleTrimmed.length === 0) {
      setError("Title is required.");
      return;
    }
    if (slugStatus !== "available") {
      setError("Use a globally unique slug before creating the module.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAdventureModule(
        {
          source: "blank",
          title: titleTrimmed,
          slug: slug.trim(),
        },
        creatorToken,
      );
      navigate(`/adventure-module/${encodeURIComponent(created.index.slug)}/base`);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create module.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell stack py-8 gap-4">
      <Text variant="h2" color="iron">
        Create Adventure Module
      </Text>
      <Text variant="body" color="iron-light" className="text-sm max-w-2xl">
        Start by setting a module title and globally unique slug. After creation, you
        will continue in the Base tab for premise and palette authoring.
      </Text>

      {error ? (
        <Message label="Error" color="blood">
          {error}
        </Message>
      ) : null}

      <Panel className="max-w-2xl">
        <form className="stack gap-4" onSubmit={handleSubmit}>
          <TextField
            label="Title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError(null);
            }}
            placeholder="Clockwork Siege at Dawn"
            maxLength={120}
            required
            showCharCount
          />

          <TextField
            label="Slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(normalizeSlug(event.target.value));
              setError(null);
            }}
            placeholder="clockwork-siege-at-dawn"
            maxLength={120}
            required
            showCharCount
          />

          {slugStatus === "checking" ? (
            <PendingIndicator label="Checking slug availability" color="cloth" />
          ) : (
            <Text
              variant="note"
              color={slugStatusTone(slugStatus)}
              className="text-sm !opacity-100"
            >
              {slugMessage}
            </Text>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {slugTouched && titleTrimmed.length > 0 ? (
              <Button
                variant="ghost"
                color="steel"
                size="sm"
                disabled={submitting}
                onClick={() => {
                  setSlugTouched(false);
                  setSlug(normalizeSlug(titleTrimmed));
                }}
              >
                Regenerate From Title
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" color="gold" disabled={!canCreate}>
              {submitting ? (
                <PendingIndicator label="Creating module" color="gold" />
              ) : (
                "Create Module"
              )}
            </Button>
            <Button
              variant="ghost"
              color="cloth"
              disabled={submitting}
              onClick={() => navigate("/adventure-module/list")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
};
