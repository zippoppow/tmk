'use client';

import EntityListPage from '../components/EntityListPage';

export default function ViewPartsOfSpeechPage() {
  return (
    <EntityListPage
      title="View Parts of Speech"
      entityLabel="parts of speech"
      endpoint="/api/parts-of-speech"
      createPath="/utilities/create/part-of-speech"
      searchPlaceholder="Search by name, abbreviation, description, or notes..."
      instructions="Below is a list of all parts of speech in the TMK-API database. Use the search box to filter by key fields and click Refresh to reload the list."
      searchFields={['name', 'abbreviation', 'description', 'notes']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'abbreviation', label: 'Abbreviation' },
        { key: 'description', label: 'Description' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
