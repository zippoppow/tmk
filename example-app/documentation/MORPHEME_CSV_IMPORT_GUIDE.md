# Morpheme CSV Import Guide

## Overview
The morpheme import page allows you to batch import morphemes from a CSV file. The system automatically maps human-readable text values (like "Prefix" or "Latin") to their corresponding database IDs.

## CSV Format

### Required Columns
- **name**: The morpheme name (e.g., "aud", "script", "tion")
- **senseOfMeaning**: The semantic meaning (e.g., "hear", "write", "act or process")

### Optional Columns
- **variants**: Comma or pipe-separated alternative forms (e.g., "ambo" or "scrib|scribe")
- **pronunciations**: Comma or pipe-separated pronunciations (e.g., "SCRIP|SCRIBE")
- **wordRole**: Text value for morpheme role - must match database values:
  - "Prefix"
  - "Base Element"
  - "Suffix"
- **wordOrigin**: Text value for origin language - must match database values:
  - "Latin"
  - "Greek"
  - etc.
- **wordFormationConvention**: Text value for formation convention - must match database values:
  - "Root"
  - "Combining form"
  - "Affix"
  - etc.

## Example CSV File

```csv
name,senseOfMeaning,variants,pronunciations,wordRole,wordOrigin,wordFormationConvention
ambi,both,ambo,,Prefix,Latin,Combining form
aud,hear,,,Base Element,Latin,Root
ible,able to be,able,,Suffix,Latin,
script,write,scrib,SCRIP|SCRIBE,Base Element,Latin,Root
graph,write or draw,graf,,Base Element,Greek,Root
tion,act or process,sion,,Suffix,Latin,
pre,before,,,Prefix,Latin,Combining form
post,after,,,Prefix,Latin,Combining form
sub,under,,,Prefix,Latin,Combining form
trans,across,,,Prefix,Latin,Combining form
```

## How to Use

1. **Navigate to Import Page**: Go to `/utilities/create/morpheme/import`

2. **Download Sample CSV** (optional): Click "Download Sample CSV" to get a template

3. **Prepare Your CSV File**:
   - Follow the format described above
   - Separate multiple variants/pronunciations with commas (`,`) or pipes (`|`)
   - Leave optional fields empty if not applicable
   - Use CSV format with proper quoting for fields containing commas

4. **Upload File**:
   - Click the file upload area
   - Select your CSV file
   - The page will parse the file and map text values to database IDs

5. **Review Data**:
   - The page displays a preview table of all parsed morphemes
   - Check the summary cards for counts by role type
   - Review any parsing errors displayed

6. **Confirm & Import**:
   - Click "Import X Morphemes" button
   - Confirm in the dialog
   - Monitor the import progress and results

## Field Value Mapping

The import system automatically looks up text values in the database:

### Word Role Mapping
- "Prefix" → ID 13
- "Base Element" → ID 14
- "Suffix" → ID 15

### Error Handling
- If a text value doesn't exist in the database, the import will fail for that row
- The system shows detailed error messages for each failed row
- Use the error messages to correct your CSV and try again

## Tips

- **Case-insensitive matching**: "prefix", "Prefix", and "PREFIX" all work
- **Empty optional fields**: Leave columns blank if not needed - don't delete the column
- **Array parsing**: Use commas or pipes to separate multiple values
  - `ambo` or `ambo,ambi` or `ambo|ambi` all work
- **Sample file**: Click "Download Sample CSV" to see a working example
- **Validation**: The system validates all required fields before import

## Troubleshooting

### "CSV must contain at least a header row and one data row"
- Ensure your CSV has a header row and at least one data row

### "Missing required columns: name, senseofmeaning"
- Check that your CSV headers exactly match the format shown above
- Column names are case-insensitive but must be spelled correctly

### "Word role 'XXX' not found in database"
- The word role value doesn't exist in the database
- Check available roles using the create form dropdown
- Common values: "Prefix", "Base Element", "Suffix"

### "Word origin 'XXX' not found in database"
- The origin language doesn't exist in the database
- Check available origins in the create form dropdown

### Failed imports during batch operation
- Some morphemes may fail while others succeed
- Check the error summary for which specific rows failed
- The system continues importing even when individual rows fail (unless stopOnError is enabled)

## API Integration

The import process:
1. Parses CSV text into rows
2. Maps each row to a morpheme object with database IDs
3. Calls `/api/morphemes` endpoint for each morpheme
4. Returns summary of successes and failures

All API calls use the `morphemesAPI.create()` function, which handles proper request formatting and error handling.
