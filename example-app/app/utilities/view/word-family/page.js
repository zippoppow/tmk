'use client';

import EntityListPage from '../components/EntityListPage';

export default function ViewWordFamiliesPage() {
  return (
    <EntityListPage
      title="View Word Families"
      entityLabel="word families"
      endpoint="/api/word-families"
      createPath="/utilities/create/word-family"
      searchPlaceholder="Search by name, description, or notes..."
      instructions="Below is a list of all word families in the TMK-API database. Use the search box to filter by key fields and click Refresh to reload the list."
      searchFields={['name', 'description', 'notes']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
