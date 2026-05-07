'use client';

import EntityListPage from '../components/EntityListPage';

export default function ViewWordListsPage() {
  return (
    <EntityListPage
      title="View Word Lists"
      entityLabel="word lists"
      endpoint="/api/word-lists"
      createPath="/utilities/create/word-list"
      searchPlaceholder="Search by name, description, source, or notes..."
      instructions="Below is a list of all word lists in the TMK-API database. Use the search box to filter by key fields and click Refresh to reload the list."
      searchFields={['name', 'description', 'source', 'notes']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'source', label: 'Source' },
        { key: 'description', label: 'Description' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
