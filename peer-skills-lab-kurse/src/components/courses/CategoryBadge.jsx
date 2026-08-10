import React from "react";
import { Badge } from "@/components/ui/badge";
import { getCategoryOklch, getStatusStyle, STATUS_LABELS } from "@/lib/categoryStyles";
import { useIsDarkTheme } from "@/lib/useTheme";

export function CategoryBadge({ category, className = "text-xs border" }) {
  const dark = useIsDarkTheme();
  const colors = getCategoryOklch(category, { dark });
  return (
    <Badge
      className={className}
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {category}
    </Badge>
  );
}

export function StatusBadge({ status, className = "text-xs border" }) {
  const dark = useIsDarkTheme();
  const colors = getStatusStyle(status, { dark });
  return (
    <Badge
      className={className}
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}
