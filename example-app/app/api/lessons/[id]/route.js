import sampleLessonActivity from '@/data/sample-lesson-activity.json';

export async function GET(request, { params }) {
  const { id } = params;

  // For now, we'll serve the sample data
  // In a real app, this would query a database
  if (id === 'fill-in-the-morph-an') {
    return Response.json(sampleLessonActivity);
  }

  return Response.json(
    { error: 'Lesson not found' },
    { status: 404 }
  );
}
