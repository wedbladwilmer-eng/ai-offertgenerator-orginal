/**
 * Generate angle image URLs from a base image URL
 * Used by both Quote page and PDF generator for consistency
 */

export interface AngleImage {
  label: string;
  short: string;
  long: string;
}

/**
 * Builds angle image URLs for Front, Right, Back, and Left views
 * @param baseImageUrl - The base product image URL (with or without view suffix)
 * @param selectedViews - Optional array of views to filter (defaults to all 4 views)
 * @returns Array of angle images with short and long URL variants
 */
export const generateAngleImages = (
  baseImageUrl: string,
  selectedViews?: string[]
): AngleImage[] => {
  if (!baseImageUrl) return [];

  // Remove any existing suffix from the base URL
  const cleanBase = baseImageUrl.replace(/_(F|B|L|R|Front|Back|Left|Right)\.jpg$/i, "");

  // All possible views
  const allViews = ["Front", "Right", "Back", "Left"];
  
  // Filter to selected views or use all
  const viewsToGenerate = selectedViews?.length ? selectedViews : allViews;

  // Build URLs for each view
  return viewsToGenerate.map((view) => ({
    label: view,
    short: `${cleanBase}_${view[0].toUpperCase()}.jpg`,
    long: `${cleanBase}_${view}.jpg`,
  }));
};

/**
 * Get Swedish label for a view name
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
