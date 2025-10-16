// 🧩 Typen för en rad i tabellen "product_images"
export interface ProductImageRow {
  article_number: string;
  image_url?: string;
  folder_id: string;
  color_code: string;
  slug_name: string;
}

/**
 * 🖼️ Bygger upp till fyra bild-URL:er (Front, Right, Back, Left)
 * baserat på data från tabellen product_images.
 *
 * Exempel:
 * input:
 *   {
 *     folder_id: "96495",
 *     article_number: "032101",
 *     color_code: "99",
 *     slug_name: "HotpantsKids"
 *   }
 *
 * output:
 *   [
 *     "https://images.nwgmedia.com/preview/96495/032101_99_HotpantsKids_F.jpg",
 *     "https://images.nwgmedia.com/preview/96495/032101_99_HotpantsKids_R.jpg",
 *     "https://images.nwgmedia.com/preview/96495/032101_99_HotpantsKids_B.jpg",
 *     "https://images.nwgmedia.com/preview/96495/032101_99_HotpantsKids_L.jpg"
 *   ]
 *
 * Om de korta versionerna inte finns, kan frontend testa de längre
 * (_Front, _Right, _Back, _Left) som fallback.
 */

export const buildImageUrls = (row: ProductImageRow): string[] => {
  if (!row?.folder_id || !row?.article_number || !row?.color_code || !row?.slug_name) {
    console.warn("❗ buildImageUrls: saknar nödvändig data", row);
    return [];
  }

  const base = `https://images.nwgmedia.com/preview/${row.folder_id}/${row.article_number}_${row.color_code}_${row.slug_name}`;

  // Primära länkar (kort format)
  const shortUrls = [
    `${base}_F.jpg`, // Front
    `${base}_R.jpg`, // Right
    `${base}_B.jpg`, // Back
    `${base}_L.jpg`, // Left
  ];

  // Fallback-långa varianter (om frontend vill testa dessa vid fel)
  const longUrls = [`${base}_Front.jpg`, `${base}_Right.jpg`, `${base}_Back.jpg`, `${base}_Left.jpg`];

  // Returnera alla korta varianter; frontend kan hantera fallback vid 404
  return shortUrls.length > 0 ? shortUrls : longUrls;
};
