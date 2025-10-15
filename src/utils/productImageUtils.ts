import { Product } from "@/hooks/useProducts";

export interface ProductViews {
  front: string;
  right: string;
  back: string;
  left: string;
}

/**
 * Genererar bildlänkar för alla fyra vinklar av en produkt
 * @param product - Produktobjektet
 * @returns Ett objekt med bildlänkar för front, right, back och left
 */
export const generateProductViews = (product: Product): ProductViews => {
  const baseId = product.id?.split("-")[0] || product.id;
  const colorCode = product.id?.split("-")[1] || "91";
  const cleanName = product.name.replace(/\s+/g, "_");

  return {
    front: `https://images.nwgmedia.com/preview/${baseId}/${baseId}-${colorCode}_${cleanName}_Front.jpg`,
    right: `https://images.nwgmedia.com/preview/${baseId}/${baseId}-${colorCode}_${cleanName}_Right.jpg`,
    back: `https://images.nwgmedia.com/preview/${baseId}/${baseId}-${colorCode}_${cleanName}_Back.jpg`,
    left: `https://images.nwgmedia.com/preview/${baseId}/${baseId}-${colorCode}_${cleanName}_Left.jpg`,
  };
};

/**
 * Verifierar vilka bildvinklar som faktiskt existerar
 * @param views - Objekt med bildlänkar för olika vinklar
 * @returns Ett objekt med endast de bildlänkar som existerar
 */
export const validateProductViews = async (
  views: ProductViews
): Promise<Record<string, string>> => {
  const checked: Record<string, string> = {};
  
  await Promise.all(
    Object.entries(views).map(async ([key, url]) => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) checked[key] = url;
      } catch {
        console.warn(`Bild saknas för ${key}`);
      }
    })
  );

  return checked;
};
