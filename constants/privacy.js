// constants/privacy.js
export const PUBLIC_LISTING_FIELDS = ['id', 'role', 'age', 'location', 'availability', 'image'];

/**
 * Return a public-only version of a listing.
 * Any extra fields (e.g., medical, contact, bios) are dropped.
 */
export function toPublicListing(listing) {
  const safe = {};
  for (const key of PUBLIC_LISTING_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(listing, key)) {
      safe[key] = listing[key];
    }
  }
  return safe;
}
