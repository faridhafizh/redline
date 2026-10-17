import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { AdapterOutput } from "../types";

const TYPE_LABELS: Record<string, string> = {
  MOBILE: "Seluler",
  FIXED_LINE: "Telepon tetap",
  FIXED_LINE_OR_MOBILE: "Tetap / seluler",
  TOLL_FREE: "Bebas pulsa",
  PREMIUM_RATE: "Tarif premium",
  SHARED_COST: "Biaya bersama",
  VOIP: "VoIP",
  PERSONAL_NUMBER: "Nomor pribadi",
  PAGER: "Pager",
  UAN: "UAN",
  VOICEMAIL: "Voicemail",
};

export async function run(input: string): Promise<AdapterOutput> {
  const phone = parsePhoneNumberFromString(input);

  if (!phone) {
    return {
      data: { input, parsed: false, valid: false },
      empty: false,
    };
  }

  const rawType = phone.getType() ?? null;
  const data = {
    input,
    parsed: true,
    valid: phone.isValid(),
    possible: phone.isPossible(),
    e164: phone.number ?? null,
    country: phone.country ?? null,
    callingCode: phone.countryCallingCode ? `+${phone.countryCallingCode}` : null,
    national: phone.formatNational(),
    international: phone.formatInternational(),
    rfc3966: phone.format("RFC3966"),
    type: rawType,
    typeLabel: rawType ? TYPE_LABELS[rawType] ?? rawType : null,
  };

  return { data, empty: false };
}
