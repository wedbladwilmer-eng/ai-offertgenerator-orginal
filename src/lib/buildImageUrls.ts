export type ProductImageRow = {
  folder_id: string;
  article_number: string;
  color_code: string;
  slug_name: string;
};

/**
 * Skapar fyra bild-URL:er utifrån information i tabellen product_images.
 * Mönster:
 * https://images.nwgmedia.com/preview/${folder_id}/${article_number}-${color_code}_${slug_name}_Front.jpg
 * (och Right, Back, Left)
 */
export function buildImageUrls({
  folder_id,
  article_number,
  color_code,
  slug_name,
}: ProductImageRow): string[] {
  const base = `https://images.nwgmedia.com/preview/${folder_id}/${article_number}-${color_code}_${slug_name}`;
  return [
    `${base}_Front.jpg`,
    `${base}_Right.jpg`,
    `${base}_Back.jpg`,
    `${base}_Left.jpg`,
  ];
}
