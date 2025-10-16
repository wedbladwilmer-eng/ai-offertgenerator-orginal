/**
 * Bygger dynamiska bild-URL:er (Front, Right, Back, Left)
 * för New Wave Group-produkter.
 * 
 * URL-mönster: https://images.nwgmedia.com/preview/{folder_id}/{article_number}_{color_code}_{slug}_{view}.jpg
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
 * folderId = "96495"
 * articleNumber = "032101"
 * colorCode = "99"
 * slug = "HotpantsKids"
 * selectedViews = ["Front", "Right"]
 */
export const generateAngleImages = (
  folderId: string,
  articleNumber: string,
  colorCode: string,
  slug: string,
  selectedViews: string[] = ["Front", "Right", "Back", "Left"],
): AngleImage[] => {
  if (!folderId || !articleNumber || !colorCode || !slug) return [];

  // Bygg bas-URL enligt New Wave Group-mönster
  const base = `https://images.nwgmedia.com/preview/${folderId}/${articleNumber}_${colorCode}_${slug}`;

  const allViews: AngleImage[] = [
    { label: "Front", short: `${base}_F.jpg`, long: `${base}_Front.jpg` },
    { label: "Right", short: `${base}_R.jpg`, long: `${base}_Right.jpg` },
    { label: "Back", short: `${base}_B.jpg`, long: `${base}_Back.jpg` },
    { label: "Left", short: `${base}_L.jpg`, long: `${base}_Left.jpg` },
  ];

  // Filtrera endast de vinklar användaren valde
  return allViews.filter((v) => selectedViews.includes(v.label));
};

/**
 * Översätter engelska vynamn till svenska
 */
export const getViewLabelInSwedish = (view: string): string => {
  switch (view) {
    case "Front": return "Framsida";
    case "Right": return "Höger sida";
    case "Back": return "Baksida";
    case "Left": return "Vänster sida";
    default: return view;
  }
};
