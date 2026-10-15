import { WeddingModel } from './wedding.model';

export function normalizeNameForSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters
    .trim()
    .replace(/\s+/g, '-'); // Replace whitespace with hyphen
}

export function formatDateForSlug(dateString: string): string {
  // Input: YYYY-MM-DD -> Output: DDMMYYYY
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}${month}${year}`;
  }
  return dateString.replace(/[^0-9]/g, '');
}

export function buildBaseSlug(brideName: string, groomName: string, weddingDate: string): string {
  const normBride = normalizeNameForSlug(brideName) || 'bride';
  const normGroom = normalizeNameForSlug(groomName) || 'groom';
  const dateFormatted = formatDateForSlug(weddingDate);

  return `${normBride}-${normGroom}-${dateFormatted}`;
}

export async function generateUniqueWeddingSlug(
  brideName: string,
  groomName: string,
  weddingDate: string
): Promise<string> {
  const baseSlug = buildBaseSlug(brideName, groomName, weddingDate);

  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await WeddingModel.findOne({ 'website.slug': candidateSlug });
    if (!existing) {
      return candidateSlug;
    }

    counter += 1;
    candidateSlug = `${baseSlug}-${counter}`;
  }
}
