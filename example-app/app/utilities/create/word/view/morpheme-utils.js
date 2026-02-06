/**
 * Finds the best matching morpheme variant from a word's constructor string
 * @param {string} constructor - The word constructor string (e.g., "inter- + con- + tine + -al")
 * @param {Object} baseMorpheme - The base morpheme object { id, name, variants: [...] }
 * @returns {string} The best matching variant, or the base morpheme name if no match found
 */
export function findBestMorphemeVariant(constructor, baseMorpheme) {
  if (!constructor || !baseMorpheme) {
    return baseMorpheme?.name || '';
  }

  // Normalize constructor: split by " + " and extract morpheme components
  const components = constructor
    .split('+')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  // Normalize for comparison (remove leading/trailing hyphens, convert to lowercase)
  const normalizedComponents = components.map(c => 
    c.replace(/^-+|-+$/g, '').toLowerCase()
  );

  // If no variants, return the base morpheme name
  if (!baseMorpheme.variants || baseMorpheme.variants.length === 0) {
    return baseMorpheme.name;
  }

  // Check each variant against the constructor components
  for (const variant of baseMorpheme.variants) {
    const normalizedVariant = variant.toLowerCase();
    if (normalizedComponents.includes(normalizedVariant)) {
      return variant; // Found matching variant
    }
  }

  // If no variant matches, also check the base morpheme name itself
  const baseName = baseMorpheme.name.toLowerCase();
  if (normalizedComponents.includes(baseName)) {
    return baseMorpheme.name;
  }

  // Default: return the first variant if it exists, otherwise the base name
  return baseMorpheme.variants[0] || baseMorpheme.name;
}
