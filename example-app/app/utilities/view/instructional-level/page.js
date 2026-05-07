'use client';

import EntityListPage from '../components/EntityListPage';

export default function ViewInstructionalLevelsPage() {
  return (
    <EntityListPage
      title="View Instructional Levels"
      entityLabel="instructional levels"
      endpoint="/api/instructional-levels"
      createPath="/utilities/create/instructional-level"
      searchPlaceholder="Search by name, description, abbreviation, or level number..."
      instructions="Below is a list of all instructional levels in the TMK-API database. Use the search box to filter by key fields and click Refresh to reload the list."
      searchFields={['name', 'description', 'abbreviation', 'levelNumber', 'notes']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'levelNumber', label: 'Level Number' },
        { key: 'abbreviation', label: 'Abbreviation' },
        { key: 'description', label: 'Description' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
