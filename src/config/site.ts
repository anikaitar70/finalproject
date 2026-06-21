type SiteConfig = {
  name: string;
  url: string;
  description: string;
  creator: string;
  authors: { name: string; url: string }[];
  keywords: string[];
  ogImage?: string;
  links: {
    github: string;
    twitter?: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "Cred Rank Net",
  url: "https://crn.anikait.page",
  description:
    "A credibility-ranked research platform where scholars share takes, vote on ideas, and build reputation through evidence.",
  creator: "Cred Rank Net",
  authors: [{ name: "Cred Rank Net", url: "https://crn.anikait.page" }],
  keywords: [
    "research",
    "credibility",
    "scholars",
    "science",
    "nextjs",
    "typescript",
  ],
  links: {
    github: "https://github.com/anikaitar70/finalproject",
  },
};
