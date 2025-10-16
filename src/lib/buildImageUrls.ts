export type ProductImageRow = {
  folder_id: string;
  article_number: string;
  color_code: string;
  slug_name: string;
};

const VIEWS = ["Front", "Right", "Back", "Left"] as const;

export function buildImageUrls(row: ProductImageRow): string[] {
  const { folder_id, color_code, slug_name } = row;
  
  return VIEWS.map(
    (view) =>
      `https://images.nwgmedia.com/preview/${folder_id}/${folder_id}-${color_code}_${slug_name}_${view}.jpg`
  );
}
