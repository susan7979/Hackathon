/**
 * Thematic photos via Wikimedia Commons (stable thumbnails).
 * Each URL matches the step / offset topic (forest, farm, solar, landfill, plant, cookstove).
 */
export const IMAGES = {
  /** CUTthecarbon wordmark + hexagon (project logo) */
  brandLogo: "/logo.png",
  hero: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Hopetoun_falls.jpg/1600px-Hopetoun_falls.jpg",
  step1:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Cycling_in_Amsterdam.jpg/1200px-Cycling_in_Amsterdam.jpg",
  step2:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Field_in_Kansas.jpg/1200px-Field_in_Kansas.jpg",
  step3:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Seedlings_at_McDonald_Nursery.jpg/1200px-Seedlings_at_McDonald_Nursery.jpg",
};

/** Offset cards — image matches project type */
export const OFFSET_CARD_IMAGES = {
  "reforest-standard":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Bialowieza_wrzos1.jpg/800px-Bialowieza_wrzos1.jpg",
  "soil-carbon":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Field_in_Kansas.jpg/800px-Field_in_Kansas.jpg",
  "renewable-lec":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Photovoltaic_system_germany_2007.jpg/800px-Photovoltaic_system_germany_2007.jpg",
  "methane-capture":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Landfill_compactor.jpg/800px-Landfill_compactor.jpg",
  "direct-air-lite":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Laboratory_workbench.jpg/800px-Laboratory_workbench.jpg",
  "community-stoves":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Woman_cooking_with_firewood_in_Mali.jpg/800px-Woman_cooking_with_firewood_in_Mali.jpg",
};

/** If a Commons URL fails (network / block), fall back to Picsum */
export const OFFSET_IMAGE_FALLBACK = "https://picsum.photos/id/28/800/480";

/** Category colors — emissions breakdown donut + bars (mockup palette) */
export const CATEGORY_COLORS = {
  commute: "#76C78F",
  flights: "#F9D462",
  diet: "#F48B94",
  shopping: "#90C460",
  home: "#5BB0D4",
};
