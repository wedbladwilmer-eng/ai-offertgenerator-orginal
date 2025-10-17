/**
 * Bygger dynamiska bild-URL:er (Front, Right, Back, Left)
 * för New Wave Group-produkter enligt strukturen:
 * https://images.nwgmedia.com/preview/{folder_id}/{article_number}_{color_code}_{slug}_{view}.jpg
 */

export interface AngleImage {
  label: "Front" | "Right" | "Back" | "Left";
  short: string;
  long: string;
}

/**
 * Genererar bild-URLs baserat på NWG-strukturen
 */
export const generateAngleImages = (
  folderId: string,
  articleNumber: string,
  colorCode: string,
  slug: string,
  selectedViews: string[] = ["Front", "Right", "Back", "Left"],
): AngleImage[] => {
  if (!folderId || !articleNumber || !colorCode || !slug) {
    console.warn("⚠️ Saknas parameter i generateAngleImages:", {
      folderId,
      articleNumber,
      colorCode,
      slug,
    });
    return [];
  }

  // Ta bort ogiltiga tecken från slug
  const cleanSlug = slug.replace(/[^a-zA-Z0-9]/g, "");

  const base = `https://images.nwgmedia.com/preview/${folderId}/${articleNumber}_${colorCode}_${cleanSlug}`;

  const allViews: AngleImage[] = [
    { label: "Front", short: `${base}_F.jpg`, long: `${base}_Front.jpg` },
    { label: "Right", short: `${base}_R.jpg`, long: `${base}_Right.jpg` },
    { label: "Back", short: `${base}_B.jpg`, long: `${base}_Back.jpg` },
    { label: "Left", short: `${base}_L.jpg`, long: `${base}_Left.jpg` },
  ];

  console.groupCollapsed("🖼️ Genererade bildlänkar");
  console.table(allViews);
  console.groupEnd();

  return allViews.filter((v) => selectedViews.includes(v.label));
};

/**
 * Svenska etiketter
 */
export const getViewLabelInSwedish = (view: string): string => {
  switch (view) {
    case "Front":
      return "Framsida";
    case "Right":
      return "Höger sida";
    case "Back":
      return "Baksida";
    case "Left":
      return "Vänster sida";
    default:
      return view;
  }
};
