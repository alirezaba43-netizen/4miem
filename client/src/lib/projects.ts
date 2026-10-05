import type { Lang } from "./i18n";

type L<T> = Record<Lang, T>;
export type Step = { name: string; text: string };
export type Block = { heading: string; text: string };

export type Project = {
  id: number;
  /** Used in the address: /gallery/<slug> */
  slug: string;
  videoUrl: string;
  posterUrl: string;
  /** "portrait" = reels-style video, "landscape" = wide cinematic video */
  orientation: "portrait" | "landscape";
  title: L<string>;
  /** One short line under the title. Leave out to hide it. */
  tagline?: L<string>;
  year: string;
  /** Every field below is optional: a missing one simply hides its section. */
  duration?: L<string>;
  type?: L<string>;
  tools?: string[];
  /** The idea or the problem, in one or two sentences. */
  brief?: L<Block>;
  /** How it was made, shown under "Show how it was made". */
  steps?: L<Step[]>;
  /** The outcome, in one or two sentences. */
  result?: L<Block>;
  /** Optional public source post for experimental samples. */
  sourceUrl?: string;
};

// TODO: replace titles, taglines and year with the real ones, and set orientation to match each video.
// To fill a section, add the field to the project. Example:
//
//   tools: ["ComfyUI"],
//   duration: { fa: "۳ هفته", en: "3 weeks" },
//   type: { fa: "تیزر", en: "Teaser" },
//   brief: { fa: { heading: "...", text: "..." }, en: { heading: "...", text: "..." } },
//   steps: {
//     fa: [{ name: "ایده و استوری‌بورد", text: "..." }],
//     en: [{ name: "Idea and storyboard", text: "..." }],
//   },
//   result: { fa: { heading: "...", text: "..." }, en: { heading: "...", text: "..." } },
export const portfolioProjects: Project[] = [
  {
    id: 1,
    slug: "project-one",
    videoUrl: "/portfolio.mp4",
    posterUrl: "/portfolio-poster-1.jpg",
    orientation: "portrait",
    title: { fa: "آزمایش تبلیغاتی سوهان ایرانی", en: "Iranian Sohan Ad Experiment" },
    tagline: { fa: "یک نمونه‌ی تجربی برای ساخت تیزر تبلیغاتی با هوش مصنوعی", en: "An experimental AI commercial for a familiar Iranian sweet." },
    year: "2026",
    type: { fa: "نمونه / تیزر تبلیغاتی", en: "Sample / commercial teaser" },
    tools: ["AI generation", "Premiere Pro", "Sound design"],
    brief: {
      fa: { heading: "ایده از کجا شروع شد؟", text: "از یک موقعیت آشنا شروع کردیم: وقتی یک تبلیغ قرار است هم ساده باشد، هم لوکس، هم متفاوت و به‌یادماندنی." },
      en: { heading: "Where did it start?", text: "We started with a familiar brief: make an ad that feels simple, premium, different and memorable at the same time." },
    },
    steps: {
      fa: [
        { name: "ایده و پرامت", text: "سناریوی کوتاه به پرامت‌های تصویری و حرکتی تبدیل شد." },
        { name: "تولید با هوش مصنوعی", text: "شات‌ها و جهان بصری با ابزارهای تولید تصویر و ویدیو ساخته شدند." },
        { name: "ادیت و صداگذاری", text: "ریتم، تدوین، متن و صداگذاری نهایی در Premiere Pro انجام شد." },
      ],
      en: [
        { name: "Idea and prompts", text: "A short scenario became a set of visual and motion prompts." },
        { name: "AI generation", text: "The shots and visual world were generated with AI image and video tools." },
        { name: "Edit and sound", text: "Rhythm, edit, typography and final sound design came together in Premiere Pro." },
      ],
    },
    sourceUrl: "https://www.instagram.com/reel/Dds8L0_I-am/",
  },
  {
    id: 2,
    slug: "project-two",
    videoUrl: "/portfolio-2.mp4",
    posterUrl: "/portfolio-poster-2.jpg",
    orientation: "portrait",
    title: { fa: "انتخاب یک جهان برای موزیک‌ویدئو", en: "Choosing a Music Video World" },
    tagline: { fa: "آزمایش سبک و فضا برای ساخت یک موزیک‌ویدئوی کامل با هوش مصنوعی", en: "A style and mood experiment for a full AI music video." },
    year: "2026",
    type: { fa: "نمونه / موزیک‌ویدئو", en: "Sample / music video" },
    tools: ["AI generation", "Premiere Pro", "Sound design"],
    brief: {
      fa: { heading: "دو مسیر، یک ایده", text: "برای یک موزیک‌ویدئو، دو جهان متفاوت را آزمایش کردیم: سینمایی و احساسی، یا پرانرژی و مدرن." },
      en: { heading: "Two directions, one idea", text: "For one music video, we tested two distinct worlds: cinematic and emotional, or energetic and modern." },
    },
    steps: {
      fa: [
        { name: "تعریف حال‌وهوا", text: "رنگ، نور، حرکت دوربین و زبان تصویری هر مسیر مشخص شد." },
        { name: "ساخت شات‌ها", text: "هر شات از ایده‌ی اولیه به پرامت تبدیل و با هوش مصنوعی تولید شد." },
        { name: "تدوین نهایی", text: "شات‌ها با ریتم موسیقی در Premiere Pro کنار هم نشستند و صداگذاری شدند." },
      ],
      en: [
        { name: "Set the mood", text: "Colour, light, camera movement and visual language were defined for each direction." },
        { name: "Generate the shots", text: "Each shot moved from the initial idea to a prompt and an AI-generated result." },
        { name: "Final edit", text: "The shots were cut to the music in Premiere Pro and finished with sound design." },
      ],
    },
    sourceUrl: "https://www.instagram.com/reel/Ddfpw4PiLFh/",
  },
  {
    id: 3,
    slug: "project-three",
    videoUrl: "/portfolio-3.mp4",
    posterUrl: "/portfolio-poster-3.jpg",
    orientation: "portrait",
    title: { fa: "از ایده تا یک جهان سینمایی", en: "From Idea to a Cinematic World" },
    tagline: { fa: "نمونه‌ای از ساخت جهان، شخصیت و صحنه با کمک هوش مصنوعی", en: "A sample world built through AI-assisted characters, scenes and direction." },
    year: "2026",
    type: { fa: "نمونه / ویدئوی خلاقانه", en: "Sample / creative film" },
    tools: ["AI generation", "Premiere Pro", "Sound design"],
    brief: {
      fa: { heading: "یک ایده‌ی اولیه", text: "همه‌چیز از یک تصویر ذهنی شروع شد؛ بعد جهان، شخصیت‌ها و صحنه‌های سینمایی کم‌کم شکل گرفتند." },
      en: { heading: "One initial idea", text: "Everything started from a mental image, then the world, characters and cinematic scenes took shape." },
    },
    steps: {
      fa: [
        { name: "طراحی جهان", text: "لحن، فضا و قواعد بصری جهان قبل از تولید شات‌ها مشخص شد." },
        { name: "پرامت و تولید", text: "ایده به پرامت‌های دقیق تبدیل شد و شات‌ها با ابزارهای هوش مصنوعی ساخته شدند." },
        { name: "روایت و صدا", text: "تدوین، اتصال شات‌ها، ریتم و صداگذاری در Premiere Pro انجام شد." },
      ],
      en: [
        { name: "World building", text: "The tone, atmosphere and visual rules were set before generating the shots." },
        { name: "Prompts and generation", text: "The idea became precise prompts, then the shots were generated with AI tools." },
        { name: "Story and sound", text: "Editing, shot continuity, rhythm and sound design were completed in Premiere Pro." },
      ],
    },
    sourceUrl: "https://www.instagram.com/reel/DdbyexjhB1z/",
  },
];

export function findProject(slug: string | undefined): Project | undefined {
  return portfolioProjects.find((p) => p.slug === slug);
}

/** "/gallery/project-one" -> the project, anything else -> undefined */
export function projectFromPath(path: string): Project | undefined {
  const match = /^\/gallery\/([^/]+)\/?$/.exec(path);
  return match ? findProject(match[1]) : undefined;
}
