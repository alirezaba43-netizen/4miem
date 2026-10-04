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
    title: { fa: "پروژه‌ی اول", en: "Project One" },
    year: "2026",
  },
  {
    id: 2,
    slug: "project-two",
    videoUrl: "/portfolio-2.mp4",
    posterUrl: "/portfolio-poster-2.jpg",
    orientation: "portrait",
    title: { fa: "پروژه‌ی دوم", en: "Project Two" },
    year: "2026",
  },
  {
    id: 3,
    slug: "project-three",
    videoUrl: "/portfolio-3.mp4",
    posterUrl: "/portfolio-poster-3.jpg",
    orientation: "portrait",
    title: { fa: "پروژه‌ی سوم", en: "Project Three" },
    year: "2026",
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
