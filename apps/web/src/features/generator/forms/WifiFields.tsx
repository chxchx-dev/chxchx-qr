import { QR_CONTENT_LIMITS } from "@chxchx/contracts";
import {
  PasswordField,
  SelectField,
  TextField,
  ToggleField,
} from "../../../shared/components/Field";
import { ui } from "../../../shared/lib/messages";
import type { FieldsProps } from "./forms.types";

const NETWORK_TYPES = ["WPA", "WEP", "nopass"] as const;
type NetworkType = (typeof NETWORK_TYPES)[number];

export function WifiFields({ draft, errors, onChange }: FieldsProps) {
  const networkType = (draft.networkType as NetworkType | undefined) ?? "WPA";
  const showPassword = networkType !== "nopass";

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={ui.forms.wifi.ssidLabel}
        value={typeof draft.ssid === "string" ? draft.ssid : ""}
        onChange={(value) => onChange("ssid", value)}
        error={errors.ssid}
        counterMax={QR_CONTENT_LIMITS.wifiSsidMaxLength}
        autoComplete="off"
      />
      <SelectField
        label={ui.forms.wifi.typeLabel}
        value={networkType}
        onChange={(value) => {
          onChange("networkType", value);
          // Al cambiar a red abierta, limpiar el secreto para no enviarlo por error.
          if (value === "nopass") {
            onChange("password", "");
          }
        }}
        options={NETWORK_TYPES.map((type) => ({
          value: type,
          label: ui.forms.wifi.types[type].label,
          description: ui.forms.wifi.types[type].description,
        }))}
        error={errors.networkType}
      />
      {showPassword && (
        <PasswordField
          label={ui.forms.wifi.passwordLabel}
          value={typeof draft.password === "string" ? draft.password : ""}
          onChange={(value) => onChange("password", value)}
          error={errors.password}
          counterMax={QR_CONTENT_LIMITS.wifiPasswordMaxLength}
          autoComplete="off"
        />
      )}
      <ToggleField
        label={ui.forms.wifi.hiddenLabel}
        checked={draft.hidden === true}
        onChange={(checked) => onChange("hidden", checked)}
      />
      <p className="rounded-md bg-surface/50 p-2 text-xs text-muted" role="note">
        {ui.forms.wifi.notSavedNote}
      </p>
    </div>
  );
}
