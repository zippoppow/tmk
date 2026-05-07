'use client';

import EntityListPage from '../components/EntityListPage';

export default function ViewLessonActivityTypesPage() {
  return (
    <EntityListPage
      title="View Lesson Activity Types"
      entityLabel="lesson activity types"
      endpoint="/api/lesson-types"
      createPath="/utilities/create/lesson-activity-type"
      searchPlaceholder="Search by name, description, category, or notes..."
      instructions="Below is a list of all lesson activity types in the TMK-API database. Use the search box to filter by key fields and click Refresh to reload the list."
      searchFields={['name', 'description', 'category', 'notes']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'description', label: 'Description' },
        { key: 'notes', label: 'Notes' },
      ]}
    />
  );
}
