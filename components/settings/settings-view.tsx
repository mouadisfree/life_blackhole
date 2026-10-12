"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { BirthForm } from "@/components/birth-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  type CounterUnit,
  type MotionPreference,
  useAppStore,
} from "@/lib/store";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-void-raised/60 p-5"
    >
      <h2 id={id} className="text-base font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor={id} className="text-sm text-starlight">
          {label}
        </Label>
        {hint && (
          <p id={hintId} className="text-xs text-dust">
            {hint}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        className="mt-0.5"
      />
    </div>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm text-starlight">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as T)}
        className="flex flex-col gap-1"
      >
        {options.map((o) => (
          <Label
            key={o.value}
            className="flex min-h-11 items-center gap-3 text-sm text-starlight"
          >
            <RadioGroupItem value={o.value} />
            {o.label}
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

export function SettingsView() {
  const t = useTranslations("Settings");
  const tf = useTranslations("BirthForm");
  const tw = useTranslations("Wellbeing");
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const setProfile = useAppStore((s) => s.setProfile);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const [saved, setSaved] = useState(false);

  if (!hydrated) return <div className="h-96" aria-hidden="true" />;

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <Section title={t("detailsTitle")}>
        {profile ? (
          <>
            <BirthForm
              // Remount with fresh values after deleting/re-entering data.
              key={JSON.stringify(profile)}
              initial={profile}
              submitLabel={tf("save")}
              onSubmit={(p) => {
                setProfile(p);
                setSaved(true);
              }}
            />
            <p role="status" className="text-sm text-gold">
              {saved ? tf("saved") : ""}
            </p>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-dust">{t("noProfile")}</p>
            <Button asChild variant="outline">
              <Link href="/">{tf("submit")}</Link>
            </Button>
          </div>
        )}
      </Section>

      <Section title={t("displayTitle")}>
        <ChoiceGroup<CounterUnit>
          legend={t("unit")}
          value={settings.unit}
          onChange={(unit) => updateSettings({ unit })}
          options={[
            { value: "calendar", label: t("unitCalendar") },
            { value: "days", label: t("unitDays") },
            { value: "seconds", label: t("unitSeconds") },
          ]}
        />
        <SwitchRow
          label={t("hideCountdown")}
          hint={t("hideCountdownHint")}
          checked={settings.hideCountdown}
          onCheckedChange={(hideCountdown) => updateSettings({ hideCountdown })}
        />
        <ChoiceGroup<MotionPreference>
          legend={t("motion")}
          value={settings.motion}
          onChange={(motion) => updateSettings({ motion })}
          options={[
            { value: "system", label: t("motionSystem") },
            { value: "reduce", label: t("motionReduce") },
            { value: "full", label: t("motionFull") },
          ]}
        />
        <SwitchRow
          label={t("sound")}
          hint={t("soundHint")}
          checked={settings.sound}
          onCheckedChange={(sound) => updateSettings({ sound })}
          disabled
        />
      </Section>

      <Section title={t("privacyTitle")}>
        <p className="text-sm text-dust">{t("privacyBody")}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="self-start">
              {t("delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirmBody")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  deleteAllData();
                  router.push("/");
                }}
              >
                {t("deleteConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>

      <p className="px-2 text-center text-xs text-dust">{tw("note")}</p>
    </div>
  );
}
