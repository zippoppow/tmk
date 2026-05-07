'use client';

import EntityListPage from '../components/EntityListPage';

export default function ViewVocabularyTiersPage() {
  return (
    <EntityListPage
      title="View Vocabulary Tiers"
      entityLabel="vocabulary tiers"
      endpoint="/api/vocabulary-tiers"
      createPath="/utilities/create/vocabulary-tier"
      searchPlaceholder="Search by name, description, tier number, or notes..."
      instructions="Below is a list of all vocabulary tiers in the TMK-API database. Use the search box to filter by key fields and click Refresh to reload the list."
      searchFields={['name', 'description', 'tierNumber', 'notes']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'tierNumber', label: 'Tier Number' },
        { key: 'description', label: 'Description' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
