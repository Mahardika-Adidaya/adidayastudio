export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getPersonSlug(
  person: { id?: string; name: string | null; slug?: string | null },
  allPeople: Array<{ id?: string; name: string | null; slug?: string | null }> = []
): string {
  // If manual slug provided, sanitize and return
  if (person.slug && person.slug.trim()) {
    return slugify(person.slug);
  }

  if (!person.name || !person.name.trim()) {
    return "member";
  }

  const parts = person.name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const firstName = slugify(parts[0]);

  if (!allPeople || allPeople.length <= 1) {
    return firstName;
  }

  // Find people sharing the same first name
  const sameFirst = allPeople.filter((p) => {
    if (!p.name) return false;
    const pFirst = slugify(p.name.trim().toLowerCase().split(/\s+/)[0] || "");
    return pFirst === firstName;
  });

  if (sameFirst.length <= 1) {
    return firstName;
  }

  // If duplicate first name, use first-second name
  const personIndex = sameFirst.findIndex((p) =>
    p.id && person.id ? p.id === person.id : p === person
  );
  if (parts.length >= 2 && personIndex > 0) {
    const secondName = slugify(parts[1]);
    return `${firstName}-${secondName}`;
  }

  return firstName;
}

export function findPersonBySlug<
  T extends { id?: string; name: string | null; slug?: string | null }
>(slugQuery: string, allPeople: T[]): T | null {
  if (!slugQuery || !allPeople || allPeople.length === 0) return null;

  const target = slugify(slugQuery);

  // 1. Direct manual slug match
  const directSlug = allPeople.find(
    (p) => p.slug && slugify(p.slug) === target
  );
  if (directSlug) return directSlug;

  // 2. Computed getPersonSlug match
  const computedSlug = allPeople.find(
    (p) => getPersonSlug(p, allPeople) === target
  );
  if (computedSlug) return computedSlug;

  // 3. Full name slug match (e.g. "adi-nur-khamim")
  const fullNameSlug = allPeople.find(
    (p) => p.name && slugify(p.name) === target
  );
  if (fullNameSlug) return fullNameSlug;

  // 4. First name match (only if unambiguous)
  const firstNameMatches = allPeople.filter((p) => {
    if (!p.name) return false;
    const first = slugify(p.name.trim().split(/\s+/)[0] || "");
    return first === target;
  });

  if (firstNameMatches.length === 1) {
    return firstNameMatches[0];
  }

  return null;
}

export type ContactChannel =
  | "phone"
  | "email"
  | "personal_email"
  | "linkedin"
  | "instagram";

export function isChannelVisible(
  visibility: Record<string, { feed?: boolean; card?: boolean }> | null | undefined,
  channel: ContactChannel,
  target: "feed" | "card"
): boolean {
  if (
    visibility &&
    visibility[channel] &&
    typeof visibility[channel][target] === "boolean"
  ) {
    return !!visibility[channel][target];
  }

  // Sensible Defaults:
  // In Virtual ID Card: all filled contact items show by default (card: true)
  if (target === "card") {
    return true;
  }

  // In Studio Feed: public socials & work email show by default, personal email & phone hide by default
  if (target === "feed") {
    if (channel === "personal_email" || channel === "phone") {
      return false;
    }
    return true;
  }

  return true;
}


