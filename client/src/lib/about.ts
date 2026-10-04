import type { Lang } from "./i18n";

type L<T> = Record<Lang, T>;

export type Fact = { label: L<string>; value: L<string> };
export type TimelineItem = {
  year: L<string>;
  title: L<string>;
  place?: L<string>;
  text?: L<string>;
};

// The big opening sentence and the page's search description are in seo.json, under routes["/about"].
// Everything below is shown on the About page. Optional fields stay hidden until you fill them in.
export const about: {
  facts: Fact[];
  /** Who is behind the studio: a short paragraph under its own heading. */
  story?: L<{ heading: string; text: string }>;
  /** Work history or milestones, newest first. */
  timeline?: TimelineItem[];
  /** Added to the facts list, e.g. ["ComfyUI", "Blender"]. */
  tools?: string[];
} = {
  facts: [
    { label: { fa: "مکان", en: "Based in" }, value: { fa: "تهران", en: "Tehran" } },
    { label: { fa: "زبان", en: "Languages" }, value: { fa: "فارسی و انگلیسی", en: "Persian and English" } },
    { label: { fa: "شکل کار", en: "Studio" }, value: { fa: "استودیوی مستقل", en: "Independent" } },
  ],

  story: {
    fa: {
      heading: "پشت میم",
      text: "علیرضا حسنخانی هستم. از ۲۰ سالگی گرافیک کار می‌کنم و از سال ۱۳۹۰ سایت طراحی می‌کنم؛ اولین سایتم «گالری فرش ایران» بود. حالا با کمک هوش مصنوعی و ایده‌های خودم استودیوی میم را راه انداخته‌ام: تولید محتوا، طراحی لوگو و سایت، هویت بصری و برندسازی.",
    },
    en: {
      heading: "Behind 4miem",
      text: "I'm Alireza Hasankhani. I've worked in graphic design since I was 20 and have built websites since 2011; my first was the Iran Carpet Gallery site. Now, with AI and ideas of my own, I've started the 4miem studio: content production, logo and website design, visual identity and branding.",
    },
  },
  timeline: [
    {
      year: { fa: "امروز", en: "Now" },
      title: { fa: "استودیوی میم", en: "4miem studio" },
      place: { fa: "تهران", en: "Tehran" },
      text: {
        fa: "تولید محتوا، طراحی لوگو و سایت، هویت بصری و برندسازی، با هوش مصنوعی و کارگردانی انسانی.",
        en: "Content production, logo and website design, visual identity and branding, with AI and human direction.",
      },
    },
    {
      year: { fa: "۱۳۹۰", en: "2011" },
      title: { fa: "شروع طراحی سایت", en: "First website" },
      text: {
        fa: "اولین سایت: گالری فرش ایران.",
        en: "The first site was Iran Carpet Gallery.",
      },
    },
  ],
};
