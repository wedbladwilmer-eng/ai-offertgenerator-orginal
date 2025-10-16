/**
 * Bygger dynamiska bild-URL:er (Front, Right, Back, Left)
 * för New Wave Group-produkter, baserat på en baslänk eller parametrar.
 *
 * Denna funktion används både i ProductDisplay.tsx och Quote.tsx
 * för att garantera att samma logik används överallt.
 */

export interface AngleImage {
  label: "Front" | "Right" | "Back" | "Left";
  short: string; // _F, _R, _B, _L
  long: string; // _Front, _Right, _Back, _Left
}

/**
 * Exempel på indata:
 * baseUrl = "https://images.nwgmedia.com/preview/96495/032101_99_HotpantsKids_F.jpg"
 * selectedViews = ["Front", "Right"]
 */
export const generateAngleImages = (
  baseUrl: string,
  selectedViews: string[] = ["Front", "Right", "Back", "Left"],
): AngleImage[] => {
  if (!baseUrl) return [];

  // Rensa bort vy-suffix (_F.jpg, _Front.jpg, etc.)
  const cleanBase = baseUrl.replace(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i, "");

  const allViews: AngleImage[] = [
    { label: "Front", short: `${cleanBase}_F.jpg`, long: `${cleanBase}_Front.jpg` },
    { label: "Right", short: `${cleanBase}_R.jpg`, long: `${cleanBase}_Right.jpg` },
    { label: "Back", short: `${cleanBase}_B.jpg`, long: `${cleanBase}_Back.jpg` },
    { label: "Left", short: `${cleanBase}_L.jpg`, long: `${cleanBase}_Left.jpg` },
  ];

  // Filtrera endast de vinklar användaren valde (om selectedViews finns)
  return allViews.filter((v) => selectedViews.includes(v.label));
};
