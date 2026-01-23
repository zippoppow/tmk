import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GET /api/morphemes/import
 * Load morphemes from the JSON file
 */
export async function GET() {
  try {
    const filePath = path.join(__dirname, '../../../../data/morphemes to import.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    if (!data.morphemes || !Array.isArray(data.morphemes)) {
      return Response.json(
        { error: 'JSON file must contain a "morphemes" array' },
        { status: 400 }
      );
    }

    return Response.json({ morphemes: data.morphemes });
  } catch (error) {
    console.error('Failed to load morphemes:', error);
    return Response.json(
      { error: `Failed to load morphemes: ${error.message}` },
      { status: 500 }
    );
  }
}
