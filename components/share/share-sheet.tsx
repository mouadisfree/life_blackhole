"use client";

import { Download, Share2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { Horizon } from "@/lib/horizon";
import {
  calendarDate,
  DEFAULT_SHARE_OPTIONS,
  SHARE_SIZES,
  shareCardContent,
  shareFileName,
  type ShareFormat,
  type ShareOptions,
} from "@/lib/share-card";
import { displayHost, SITE_URL } from "@/lib/site";
import { renderShareCard } from "./render-share-card";

type OkHorizon = Extract<Horizon, { ok: true }>;

function OptionSwitch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="text-sm text-ink">
          {label}
        </Label>
        {hint && (
          <p id={hintId} className="text-xs text-haze">
            {hint}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={hint ? hintId : undefined}
      />
    </div>
  );
}

/**
 * Share dialog. The card is a snapshot taken when the dialog opens, rendered
 * on the device, and shared via the Web Share API (download as fallback).
 */
export function ShareSheet({
  horizon,
  birthDate,
}: {
  horizon: OkHorizon;
  birthDate: string;
}) {
  const t = useTranslations("Share");
  const th = useTranslations("Horizon");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [cardFormat, setCardFormat] = useState<ShareFormat>("story");
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const [snapshot, setSnapshot] = useState<OkHorizon | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const horizonRef = useRef(horizon);
  useEffect(() => {
    horizonRef.current = horizon;
  }, [horizon]);

  const percent = snapshot
    ? format.number(snapshot.snapshot.percentLived, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

  // Render the card whenever the snapshot, format or options change.
  useEffect(() => {
    if (!snapshot) return;
    let cancelled = false;
    const weekends =
      snapshot.stats.find((s) => s.id === "weekendsLeft")?.value ?? 0;
    const content = shareCardContent(
      {
        brand: t("card.brand"),
        percent: `${percent}%`,
        percentCaption: th("percentLivedCaption"),
        remaining: t("card.remaining", { years: snapshot.remainingWholeYears }),
        weekends: t("card.weekends", { count: weekends }),
        birthDate: t("card.birthDate", {
          date: format.dateTime(calendarDate(birthDate), {
            dateStyle: "long",
            timeZone: "UTC",
          }),
        }),
        tagline:
          cardFormat === "post" ? t("card.taglineShort") : t("card.tagline"),
        host: displayHost(SITE_URL),
      },
      options,
    );
    renderShareCard({
      format: cardFormat,
      percentLived: snapshot.snapshot.percentLived,
      content,
    })
      .then((b) => {
        if (cancelled) return;
        setBlob(b);
        setPreviewUrl((old) => {
          if (old) URL.revokeObjectURL(old);
          return URL.createObjectURL(b);
        });
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [snapshot, cardFormat, options, percent, birthDate, t, th, format]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Freeze the numbers at the moment the user decided to share.
      setSnapshot(horizonRef.current);
      const probe = new File([new Blob()], "probe.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    }
  }

  function download() {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = shareFileName(cardFormat);
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function share() {
    if (!blob) return;
    const file = new File([blob], shareFileName(cardFormat), {
      type: "image/png",
    });
    const text = options.showPercent
      ? t("textWithPercent", { percent })
      : t("text");
    try {
      await navigator.share({ files: [file], text: `${text} ${SITE_URL}` });
    } catch (e) {
      // User closed the share sheet: not an error.
      if (e instanceof DOMException && e.name === "AbortError") return;
      download();
    }
  }

  const set = (patch: Partial<ShareOptions>) =>
    setOptions((o) => ({ ...o, ...patch }));
  const { width, height } = SHARE_SIZES[cardFormat];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-12 gap-2 rounded-full px-6 text-base">
          <Share2 aria-hidden="true" className="size-4" />
          {t("open")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto border-border bg-sky-deep sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex h-[44dvh] w-full items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img
                src={previewUrl}
                alt={t("preview")}
                width={width}
                height={height}
                className="h-auto max-h-full w-auto max-w-full rounded-xl border border-border object-contain"
              />
            ) : (
              <p role="status" className="text-sm text-haze">
                {error ? t("error") : t("generating")}
              </p>
            )}
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm text-ink">{t("format")}</legend>
            <RadioGroup
              value={cardFormat}
              onValueChange={(v) => setCardFormat(v as ShareFormat)}
              className="flex gap-6"
            >
              {(["story", "post"] as const).map((f) => (
                <Label
                  key={f}
                  className="flex min-h-11 items-center gap-2 text-sm text-ink"
                >
                  <RadioGroupItem value={f} />
                  {t(f)}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-sm text-ink">{t("show")}</legend>
            <OptionSwitch
              label={t("showPercent")}
              checked={options.showPercent}
              onChange={(v) => set({ showPercent: v })}
            />
            <OptionSwitch
              label={t("showRemaining")}
              checked={options.showRemaining}
              onChange={(v) => set({ showRemaining: v })}
            />
            <OptionSwitch
              label={t("showWeekends")}
              checked={options.showWeekends}
              onChange={(v) => set({ showWeekends: v })}
            />
            <OptionSwitch
              label={t("showBirthDate")}
              hint={t("birthDateHint")}
              checked={options.showBirthDate}
              onChange={(v) => set({ showBirthDate: v })}
            />
          </fieldset>

          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            {canShareFiles && (
              <Button
                size="lg"
                className="h-12 flex-1 gap-2 rounded-full"
                onClick={share}
                disabled={!blob}
              >
                <Share2 aria-hidden="true" className="size-4" />
                {t("share")}
              </Button>
            )}
            <Button
              size="lg"
              variant={canShareFiles ? "outline" : "default"}
              className="h-12 flex-1 gap-2 rounded-full"
              onClick={download}
              disabled={!blob}
            >
              <Download aria-hidden="true" className="size-4" />
              {t("download")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
