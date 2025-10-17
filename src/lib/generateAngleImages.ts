/**
 * Bygger dynamiska bild-URL:er (Front, Right, Back, Left)
 * för New Wave Group-produkter enligt strukturen:
 * https://images.nwgmedia.com/preview/{folder_id}/{article_number}_{color_code}_{slug}_{view}.jpg
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
 * Genererar bild-URLs baserat på New Wave Group-strukturen
 * @param folderId - Mapp-ID (t.ex. "96495")
 * @param articleNumber - Artikelnummer (t.ex. "032101")
 * @param colorCode - Färgkod (t.ex. "99")
 * @param slug - Produktnamn utan mellanslag (t.ex. "HotpantsKids")
 * @param selectedViews - Vilka vinklar som ska genereras
 */
export const generateAngleImages = (
  folderId: string,
  articleNumber: string,
  colorCode: string,
  slug: string,
  selectedViews: string[] = ["Front", "Right", "Back", "Left"],
): AngleImage[] => {
  // 🧩 Logga inkommande parametrar
  console.log("🖼️ generateAngleImages() anropad med:", {
    folderId,
    articleNumber,
    colorCode,
    slug,
    selectedViews,
  });

  if (!folderId || !articleNumber || !colorCode || !slug) {
    console.warn("⚠️ Saknas parameter i generateAngleImages:", {
      folderId,
      articleNumber,
      colorCode,
      slug,
    });
    return [];
  }

  const base = `https://images.nwgmedia.com/preview/${folderId}/${articleNumber}_${colorCode}_${slug}`;

  const allViews: AngleImage[] = [
    { label: "Front", short: `${base}_F.jpg`, long: `${base}_Front.jpg` },
    { label: "Right", short: `${base}_R.jpg`, long: `${base}_Right.jpg` },
    { label: "Back", short: `${base}_B.jpg`, long: `${base}_Back.jpg` },
    { label: "Left", short: `${base}_L.jpg`, long: `${base}_Left.jpg` },
  ];

  // 🧩 Logga alla genererade URL:er i en tabell
  console.groupCollapsed("🖼️ Genererade bildlänkar för alla vinklar");
  console.table(allViews);
  console.groupEnd();

  const filtered = allViews.filter((v) => selectedViews.includes(v.label));
  console.log(`✅ Returnerar ${filtered.length} bilder (från ${selectedViews.length} valda vyer)`);

  return filtered;
};

/**
 * Returnerar svenska översättningar för vyetiketter
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
