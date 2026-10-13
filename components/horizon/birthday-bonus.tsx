"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { bonusDuration } from "@/lib/birthday";

/** Shown for a week after each birthday until dismissed (PROGRESS.md D2). */
export function BirthdayBonus({
  ms,
  onDismiss,
}: {
  ms: number;
  onDismiss: () => void;
}) {
  const t = useTranslations("Horizon");
  const [open, setOpen] = useState(true);
  const { unit, count } = bonusDuration(ms);

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {open && (
        <motion.aside
          aria-labelledby="birthday-bonus-title"
          className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-cloud/40 bg-sky-deep/80 p-5 text-center shadow-[0_0_60px_-20px_var(--cloud)]"
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          <h2
            id="birthday-bonus-title"
            className="text-lg font-semibold text-mist"
          >
            {t("bonusMomentTitle")}
          </h2>
          <p className="text-ink">
            {unit === "days"
              ? t("bonusMomentDays", { count })
              : t("bonusMomentWeeks", { count })}
          </p>
          <p className="text-sm text-haze">{t("bonusMomentNote")}</p>
          <Button
            variant="outline"
            className="self-center rounded-full"
            onClick={() => setOpen(false)}
          >
            {t("bonusMomentDismiss")}
          </Button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
