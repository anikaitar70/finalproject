/** Personas and take templates for demo seed — Cred Rank Net */

export type DemoUser = {
  name: string;
  username: string;
  expertise: string[];
  credibilityScore: number;
};

export type TakeTemplate = {
  title: string;
  subreddit: string;
  domain: string;
  paragraphs: string[];
};

export const DEMO_USERS: DemoUser[] = [
  { name: "Dr. Maya Chen", username: "maya_neuro", expertise: ["Neuroscience", "Cognitive Science"], credibilityScore: 72 },
  { name: "James Okonkwo", username: "james_climate", expertise: ["Climate Science", "Ecology"], credibilityScore: 68 },
  { name: "Dr. Priya Sharma", username: "priya_ml", expertise: ["Machine Learning", "Computer Science"], credibilityScore: 81 },
  { name: "Marcus Webb", username: "marcus_econ", expertise: ["Economics", "Public Policy"], credibilityScore: 59 },
  { name: "Elena Vasquez", username: "elena_phil", expertise: ["Philosophy", "Ethics"], credibilityScore: 64 },
  { name: "Dr. Ahmed Hassan", username: "ahmed_med", expertise: ["Medicine", "Public Health"], credibilityScore: 77 },
  { name: "Sophie Laurent", username: "sophie_physics", expertise: ["Physics", "Astronomy"], credibilityScore: 70 },
  { name: "Kenji Tanaka", username: "kenji_robotics", expertise: ["Robotics", "Engineering"], credibilityScore: 66 },
  { name: "Dr. Rachel Kim", username: "rachel_genetics", expertise: ["Genetics", "Biology"], credibilityScore: 74 },
  { name: "Tomás Rivera", username: "tomas_policy", expertise: ["Public Policy", "Economics"], credibilityScore: 55 },
  { name: "Dr. Fiona McAllister", username: "fiona_ecology", expertise: ["Ecology", "Climate Science"], credibilityScore: 69 },
  { name: "Omar Singh", username: "omar_sec", expertise: ["Cybersecurity", "Computer Science"], credibilityScore: 62 },
  { name: "Dr. Lisa Park", username: "lisa_psych", expertise: ["Psychology", "Neuroscience"], credibilityScore: 71 },
  { name: "Nathan Brooks", username: "nathan_astro", expertise: ["Astronomy", "Physics"], credibilityScore: 58 },
  { name: "Dr. Amara Okafor", username: "amara_health", expertise: ["Public Health", "Medicine"], credibilityScore: 76 },
  { name: "Viktor Petrov", username: "viktor_materials", expertise: ["Materials Science", "Engineering"], credibilityScore: 63 },
  { name: "Dr. Hannah Weiss", username: "hannah_linguistics", expertise: ["Linguistics", "Cognitive Science"], credibilityScore: 60 },
  { name: "Carlos Mendez", username: "carlos_urban", expertise: ["Urban Planning", "Public Policy"], credibilityScore: 57 },
  { name: "Dr. Yuki Nakamura", username: "yuki_quantum", expertise: ["Quantum Computing", "Physics"], credibilityScore: 79 },
  { name: "Isabel Torres", username: "isabel_edu", expertise: ["Education Policy", "Psychology"], credibilityScore: 61 },
];

/** Posts per user — min 3, max 10, average ~7 */
export const POSTS_PER_USER = [
  7, 8, 6, 9, 5, 10, 7, 8, 6, 7, 9, 5, 8, 7, 6, 10, 7, 8, 5, 9,
];

export const TAKE_TEMPLATES: TakeTemplate[] = [
  {
    title: "Sleep consolidation is underrated in learning policy",
    subreddit: "Neuroscience",
    domain: "Neuroscience",
    paragraphs: [
      "Most education systems still treat sleep as a lifestyle issue rather than a cognitive prerequisite.",
      "The evidence from memory reactivation studies suggests spaced learning without adequate sleep produces fragile retention.",
      "If we care about durable skill acquisition, sleep hygiene belongs in curriculum design—not wellness brochures.",
    ],
  },
  {
    title: "Carbon budgets should be tied to verifiable regional baselines",
    subreddit: "ClimateScience",
    domain: "Climate Science",
    paragraphs: [
      "National pledges without regional baselines invite accounting games.",
      "Satellite-linked land-use data gives us a path to auditable targets.",
      "Without that, COP commitments read like press releases, not engineering specs.",
    ],
  },
  {
    title: "Foundation models need explicit uncertainty channels in production",
    subreddit: "MachineLearning",
    domain: "Machine Learning",
    paragraphs: [
      "Deploying LLMs without calibrated uncertainty is like shipping drugs without dosage labels.",
      "Retrieval augmentation helps, but it does not replace epistemic humility in the interface.",
      "We should standardize refusal + confidence metadata the way we standardize API rate limits.",
    ],
  },
  {
    title: "Inflation targeting ignored supply-side shocks for too long",
    subreddit: "Economics",
    domain: "Economics",
    paragraphs: [
      "Central banks optimized for demand management in a world of fractured supply chains.",
      "The 2020s showed that goods inflation can persist even when labor markets soften.",
      "Macro models need richer supply elasticities, not louder hawkish rhetoric.",
    ],
  },
  {
    title: "AI alignment is a governance problem before it is a math problem",
    subreddit: "Philosophy",
    domain: "Philosophy",
    paragraphs: [
      "We keep searching for a single utility function while institutions lack audit trails.",
      "Alignment begins with who can deploy, who can override, and who bears liability.",
      "Philosophy of mind debates are interesting—but procurement rules change outcomes faster.",
    ],
  },
  {
    title: "Primary care should own longitudinal biomarker trends",
    subreddit: "Medicine",
    domain: "Medicine",
    paragraphs: [
      "Specialists see snapshots; primary care sees trajectories.",
      "When labs are siloed by episode, early drift signals get lost.",
      "A patient-owned trend line would reduce reactive medicine and redundant panels.",
    ],
  },
  {
    title: "Dark matter searches should fund more small-scale experiments",
    subreddit: "Physics",
    domain: "Physics",
    paragraphs: [
      "Mega-detectors are essential, but null results still constrain models slowly.",
      "Tabletop and astrophysical probes diversify our falsification portfolio.",
      "Funding monoculture slows science when the answer might be unconventional.",
    ],
  },
  {
    title: "Humanoid robots are a distraction from warehouse automation",
    subreddit: "Robotics",
    domain: "Robotics",
    paragraphs: [
      "Bipedal platforms get headlines; grippers and SLAM get ROI.",
      "Most near-term economic value is in constrained environments with repeatable SKUs.",
      "We should fund boring automation that ships, not demo videos that pivot.",
    ],
  },
  {
    title: "Polygenic scores need community consent frameworks",
    subreddit: "Genetics",
    domain: "Genetics",
    paragraphs: [
      "Predictive genetics without participatory governance repeats old eugenics optics.",
      "Scores for education or health risk amplify existing structural bias.",
      "Any clinical use should require opt-in cohorts with transparent limitations.",
    ],
  },
  {
    title: "Housing policy is climate policy",
    subreddit: "PublicPolicy",
    domain: "Public Policy",
    paragraphs: [
      "Sprawl externalizes transport emissions onto families who cannot afford central rents.",
      "Upzoning near transit is unpopular locally but efficient globally.",
      "We need federal carrots that reward density, not just solar panels on exurban roofs.",
    ],
  },
  {
    title: "Rewilding corridors beat isolated protected pockets",
    subreddit: "Ecology",
    domain: "Ecology",
    paragraphs: [
      "Species need gene flow, not postcard habitats.",
      "Corridor projects fail politically because benefits cross municipal lines.",
      "National land trusts could broker easements the way we broker highway rights-of-way.",
    ],
  },
  {
    title: "Zero-trust is meaningless without device attestation",
    subreddit: "Cybersecurity",
    domain: "Cybersecurity",
    paragraphs: [
      "Identity-centric zero-trust stops at the browser tab.",
      "Without hardware-backed attestation, MFA is just slower password reuse.",
      "Enterprise security budgets should prioritize endpoint integrity over dashboard theater.",
    ],
  },
  {
    title: "Social media A/B tests should require pre-registration",
    subreddit: "Psychology",
    domain: "Psychology",
    paragraphs: [
      "Platform experiments shape cognition at population scale without IRB oversight.",
      "Pre-registration would not kill innovation—it would document intent.",
      "We regulate clinical trials; we shrug at feed ranking experiments.",
    ],
  },
  {
    title: "Exoplanet habitability metrics overweight star type",
    subreddit: "Astronomy",
    domain: "Astronomy",
    paragraphs: [
      "M-dwarf flares dominate headlines, but atmospheric retention models matter more.",
      "We should rank targets by observability and atmospheric escape rates jointly.",
      "JWST time is scarce; prioritize worlds where spectra can falsify models.",
    ],
  },
  {
    title: "Heat alert systems fail non-English speaking seniors",
    subreddit: "PublicHealth",
    domain: "Public Health",
    paragraphs: [
      "SMS alerts in one language do not reach heterogeneous neighborhoods.",
      "Cooling center maps assume smartphone literacy and mobility.",
      "Public health tech must be multilingual by default, not after disasters.",
    ],
  },
  {
    title: "Solid-state batteries need recycling plans before scale-up",
    subreddit: "MaterialsScience",
    domain: "Materials Science",
    paragraphs: [
      "New chemistries repeat lithium-ion's end-of-life blind spot.",
      "Manufacturers optimize for energy density, not disassembly.",
      "Regulators should tie subsidies to take-back infrastructure.",
    ],
  },
  {
    title: "Large language models will not fix low-resource languages alone",
    subreddit: "Linguistics",
    domain: "Linguistics",
    paragraphs: [
      "Corpus size gaps mean synthetic data amplifies dominant languages.",
      "Community linguists need funding to curate primary texts, not just fine-tune.",
      "Preservation is archival work—not a prompt engineering side project.",
    ],
  },
  {
    title: "15-minute cities need freight logistics, not just cafes",
    subreddit: "UrbanPlanning",
    domain: "Urban Planning",
    paragraphs: [
      "Walkability metrics ignore overnight delivery congestion.",
      "Micro-hubs for last-mile freight reduce double parking more than bike lanes alone.",
      "Urban planners should map logistics flows with the same zeal as pedestrian plazas.",
    ],
  },
  {
    title: "Quantum error correction timelines are misrepresented to investors",
    subreddit: "QuantumComputing",
    domain: "Quantum Computing",
    paragraphs: [
      "Logical qubit demos are milestones, not products.",
      "Stacking physical qubits is engineering; decoding at scale is still research.",
      "Honest roadmaps separate NISQ wins from fault-tolerant timelines.",
    ],
  },
  {
    title: "Standardized tests measure test prep, not readiness",
    subreddit: "Education",
    domain: "Education Policy",
    paragraphs: [
      "Score gains correlate with tutoring access more than curriculum quality.",
      "Portfolio-based assessment is noisy—but so is a single Saturday morning.",
      "Policy should fund teacher time for evaluation design, not another bubble sheet vendor.",
    ],
  },
  {
    title: "Microplastics in blood are a signal—we still lack dose-response",
    subreddit: "PublicHealth",
    domain: "Public Health",
    paragraphs: [
      "Detection studies outpace toxicology.",
      "Policy jumps to bans before we know thresholds.",
      "Fund longitudinal cohorts before headline-driven regulation.",
    ],
  },
  {
    title: "Open-weight models accelerate science but widen misuse surface",
    subreddit: "MachineLearning",
    domain: "Machine Learning",
    paragraphs: [
      "Reproducibility wins are real; so are spam and fraud automation.",
      "Release tiers with gated weights preserved research access in biology.",
      "ML needs similar staged release norms—not binary open vs closed debates.",
    ],
  },
  {
    title: "Behavioral economics overfit to WEIRD undergrad samples",
    subreddit: "Psychology",
    domain: "Psychology",
    paragraphs: [
      "Nudge literature dominated policy before cross-cultural replication.",
      "Effect sizes shrink when studies leave campus convenience samples.",
      "Governments should demand external validity before scaling interventions.",
    ],
  },
  {
    title: "Nuclear fusion should not cannibalize fission maintenance budgets",
    subreddit: "Physics",
    domain: "Physics",
    paragraphs: [
      "Existing plants provide baseline low-carbon power today.",
      "Fusion optimism sometimes justifies neglecting regulatory staffing.",
      "We can fund breakthroughs without starving operating fleets.",
    ],
  },
  {
    title: "Antitrust in tech needs data portability standards",
    subreddit: "Economics",
    domain: "Economics",
    paragraphs: [
      "Breaking up platforms is slow; exporting social graphs is concrete.",
      "Interoperability reduces lock-in faster than decade-long court fights.",
      "Mandate portable identity layers the way we mandated number porting.",
    ],
  },
  {
    title: "Animal consciousness claims should update animal agriculture policy",
    subreddit: "Philosophy",
    domain: "Philosophy",
    paragraphs: [
      "Sentience reviews in cephalopods and mammals converge on overlapping criteria.",
      "Ethical frameworks that ignore farming scale look academic.",
      "Policy lag here is moral, not scientific.",
    ],
  },
  {
    title: "Clinical trial diversity quotas need phenotype not just ancestry boxes",
    subreddit: "Medicine",
    domain: "Medicine",
    paragraphs: [
      "Checkbox diversity misses metabolic and environmental heterogeneity.",
      "Recruitment should track comorbidity profiles, not only census categories.",
      "Without phenotype depth, equity metrics become cosmetic.",
    ],
  },
  {
    title: "Autonomous vehicle safety cases should publish disengagement context",
    subreddit: "Robotics",
    domain: "Robotics",
    paragraphs: [
      "Miles-driven metrics hide operational design domain tricks.",
      "Weather, geography, and speed caps differ across vendors.",
      "Standardized scenario reporting beats vanity mile counts.",
    ],
  },
  {
    title: "Gene drives require transnational veto windows",
    subreddit: "Genetics",
    domain: "Genetics",
    paragraphs: [
      "Malaria reduction benefits are regional; ecological spillover is not.",
      "Release moratoria must be binding across neighbors.",
      "Science diplomacy here is as hard as the CRISPR itself.",
    ],
  },
  {
    title: "Water pricing is the missing climate adaptation lever",
    subreddit: "ClimateScience",
    domain: "Climate Science",
    paragraphs: [
      "Drought response focuses on emergency shipments, not marginal pricing signals.",
      "Agriculture consumes most freshwater with weak scarcity feedback.",
      "Progressive tariffs beat crisis tanker theatrics.",
    ],
  },
];

export function makeEditorContent(paragraphs: string[]) {
  return {
    blocks: [
      {
        type: "header",
        data: { text: "Summary", level: 3 },
      },
      ...paragraphs.map((text) => ({
        type: "paragraph",
        data: { text },
      })),
    ],
  };
}

export function serializeExpertise(domains: string[]): string {
  return domains.join(",");
}
