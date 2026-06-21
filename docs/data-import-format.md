# User Import Data Format

Brainwave EduSys supports bulk importing users via **CSV** or **XLSX** (Excel) files.

## Required Format

To successfully import users, your spreadsheet must contain a header row with specific column names. 

### Columns

| Column Name | Required | Description | Example |
|-------------|----------|-------------|---------|
| `name` | **Yes** | Full name of the user | `John Doe` |
| `email` | **Yes** | Valid, unique email address | `john.doe@example.com` |
| `phone` | No | Contact phone number | `+1234567890` |
| `whatsappNumber` | No | Phone number registered on WhatsApp | `+1234567890` |
| `rollNumber` | No | Student roll number or ID | `CS24-001` |
| `department` | No | Department or Faculty name | `Computer Science` |
| `className` | No | specific class or section | `Batch A` |

> [!NOTE]
> If a user with the provided `email` already exists, the system will **skip** creating that user to avoid duplicates.

## Example CSV

```csv
name,email,phone,whatsappNumber,rollNumber,department,className
John Doe,john@example.com,+1234567890,,CS24-001,Computer Science,Batch A
Jane Smith,jane@example.com,,+1987654321,EE24-002,Electrical,Batch B
Alice Jones,alice@example.com,,,,,
```

## Troubleshooting

- **File Size**: Max file size is 10MB.
- **Missing Required Fields**: Any row missing a `name` or `email` will be skipped, and an error will be logged in the batch summary.
- **Invalid Emails**: Ensure all emails are valid formats.
