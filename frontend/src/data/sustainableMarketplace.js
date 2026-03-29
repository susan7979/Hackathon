/**
 * Sustainable marketplace — curated brands (shop, clean power, removal, offsets).
 * Images use each brand’s own CDN / official marketing assets (or credited editorial
 * photos where storefront meta tags are empty), not third-party logo APIs.
 */
export const MARKETPLACE_IMAGE_FALLBACK =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Seedlings_at_McDonald_Nursery.jpg/800px-Seedlings_at_McDonald_Nursery.jpg";

export const SUSTAINABLE_MARKETPLACE_SECTIONS = [
  {
    id: "shop",
    title: "Responsible shopping",
    lead:
      "Marketplaces and brands for lower-impact goods — reusables, ethical fashion, and clean home products.",
    brands: [
      {
        id: "earthhero",
        name: "EarthHero",
        subtitle:
          "One-stop shop for vetted sustainable products — plastic-free shipping and carbon-neutral orders.",
        url: "https://earthhero.com",
        image:
          "https://earthhero.com/cdn/shop/files/earthhero-logomark-and-wordmark-blue_6aabe4f7-73da-44ef-9ce0-c85262d37de1.jpg?v=1662767270&width=1024",
      },
      {
        id: "donegood",
        name: "DoneGood",
        subtitle:
          "Ethical brands and fair-trade makers — discover clothing, home, and gifts with real impact stories.",
        url: "https://donegood.co",
        image:
          "https://donegood.co/wp-content/uploads/2025/12/6480846130354-2025-12-23T151421.263.jpg",
      },
      {
        id: "allbirds",
        name: "Allbirds",
        subtitle:
          "Carbon-neutral shoes and apparel made from merino, tree fiber, and sugarcane-based materials.",
        url: "https://www.allbirds.com",
        image:
          "https://www.allbirds.com/cdn/shop/files/logo-seo.jpg?v=1753720776",
      },
      {
        id: "patagonia",
        name: "Patagonia",
        subtitle:
          "Outdoor gear built to last — repair, reuse, and 1% for the Planet since day one.",
        url: "https://www.patagonia.com",
        image:
          "https://www.patagonia.com/on/demandware.static/-/Sites/default/dw10b5bd51/nav/PAT_S26_FWK_NavTile-Womens.jpg",
      },
      {
        id: "tentree",
        name: "Tentree",
        subtitle:
          "Comfort-focused apparel; plants trees for many purchases toward a 1 billion tree goal.",
        url: "https://www.tentree.com",
        image:
          "https://cdn.shopify.com/s/files/1/2341/3995/files/tentreeWordmarkLogo_RGB.jpg?height=628&pad_color=ffffff&v=1614739015&width=1200",
      },
      {
        id: "pangaia",
        name: "PANGAIA",
        subtitle:
          "Materials-science fashion — bio-based fibers, recycled inputs, and transparent supply thinking.",
        url: "https://pangaia.com",
        image:
          "https://assets.vogue.com/photos/60cb43673f282b861057d413/16:9/w_1280,c_limit/210519_Pangaia_Activewear_Shot12_Male%26Female_Aerobics_186_01_R1.jpeg",
      },
      {
        id: "grove",
        name: "Grove Collaborative",
        subtitle:
          "Refillable natural cleaning and personal care — cut single-use plastic from everyday routines.",
        url: "https://www.grove.co",
        image:
          "https://www.grove.co/cdn/shop/files/Grove-Meta_Preview.jpg?v=1773877757",
      },
      {
        id: "package-free",
        name: "Package Free Shop",
        subtitle:
          "Zero-waste store for reusables, bulk staples, and plastic-free bathroom and kitchen swaps.",
        url: "https://packagefreeshop.com",
        image:
          "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "detox-market",
        name: "The Detox Market",
        subtitle:
          "Curated clean beauty — strict ingredient standards and brands focused on non-toxic formulas.",
        url: "https://www.thedetoxmarket.com",
        image:
          "https://www.byrdie.com/thmb/3WfmMfoU8L5_cNAZmivkb-vO-EI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/First-Aid-Beauty-Ultra-Repair-Cream-Intense-Hydration-4-7ca74edea6a54d43b6c32127dd7b8287.jpg",
      },
    ],
  },
  {
    id: "climate",
    title: "Clean energy, removal & offsets",
    lead:
      "Ways to power your life with renewables, support durable carbon removal, and fund verified climate projects.",
    brands: [
      {
        id: "arcadia",
        name: "Arcadia",
        subtitle:
          "Access community solar and clean energy programs — lower bills and grid emissions where available.",
        url: "https://www.arcadia.com",
        image:
          "https://images.prismic.io/arcadia-marketing-site-2023/82c6fcdf-2cdf-4557-bfd0-725b02c020ad_Arcadia-Global-Meta.png?auto=compress,format",
      },
      {
        id: "climeworks",
        name: "Climeworks",
        subtitle:
          "Direct air capture that stores CO₂ underground — durable removal for companies and individuals.",
        url: "https://climeworks.com",
        image:
          "https://climeworks.com/glide/containers/images/news_and_press/cw-%26-rcjy.jpg/a2a5d2919a99ccd93443a29338ab4950/cw-%26-rcjy.jpg",
      },
      {
        id: "onetree",
        name: "One Tree Planted",
        subtitle:
          "Non-profit reforestation — simple donations plant trees across global restoration projects.",
        url: "https://onetreeplanted.org",
        image:
          "https://onetreeplanted.org/cdn/shop/files/social-media-default_56d64461-f6bd-4222-a91f-8c2daa5e75b3_1200x.jpg?v=1738154602",
      },
      {
        id: "ecosia",
        name: "Ecosia",
        subtitle:
          "Search the web; ad revenue funds tree planting and transparency on where trees go.",
        url: "https://www.ecosia.org",
        image:
          "https://upload.wikimedia.org/wikipedia/commons/7/75/Ecosia_logo.svg",
      },
      {
        id: "terrapass",
        name: "TerraPass",
        subtitle:
          "Carbon offsets for flights, commutes, and events — calculators and business climate tools.",
        url: "https://www.terrapass.com",
        image:
          "https://terrapass.com/wp-content/uploads/2021/08/iStock-481897077-4.jpg",
      },
      {
        id: "cooleffect",
        name: "Cool Effect",
        subtitle:
          "Crowdfunded, third-party reviewed projects — forestry, cookstoves, and methane capture worldwide.",
        url: "https://www.cooleffect.org",
        image:
          "https://www.cooleffect.org/lib/content/wp-content/uploads/2020/12/Gray-CE-Logo.png",
      },
    ],
  },
];

/** Flat list (9 shop + 6 climate = 15) for a 3×5 grid */
export const MARKETPLACE_ALL_BRANDS = SUSTAINABLE_MARKETPLACE_SECTIONS.flatMap(
  (s) => s.brands
);
