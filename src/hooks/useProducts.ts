// 🖼️ Hämta bilder från tabellen product_images
const fetchImagesFromDatabase = async (articleNumber: string): Promise<string[] | null> => {
  try {
    // ❗ Använd "as any" för att undvika Lovable’s strikta generiska typer
    const { data, error } = (supabase as any)
      .from("product_images")
      .select("image_url, folder_id, article_number, color_code, slug_name")
      .eq("article_number", articleNumber)
      .maybeSingle();

    const result = await (data instanceof Promise ? data : Promise.resolve({ data, error }));

    if (result.error) {
      console.warn("Fel vid SELECT mot product_images:", result.error.message);
      return null;
    }

    const row = result.data as any;

    if (!row) return null;

    // Om image_url finns i tabellen → använd den
    if (row.image_url) return [row.image_url];

    // Annars bygg dynamiska URL:er
    if (row.folder_id && row.slug_name && row.color_code) {
      const castedRow = {
        folder_id: row.folder_id,
        article_number: row.article_number,
        color_code: row.color_code,
        slug_name: row.slug_name,
      } as ProductImageRow;

      return buildImageUrls(castedRow);
    }

    return null;
  } catch (error) {
    console.error("Fel vid hämtning från product_images:", error);
    return null;
  }
};
