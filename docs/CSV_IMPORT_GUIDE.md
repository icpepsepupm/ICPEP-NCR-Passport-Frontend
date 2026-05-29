# CSV Import Documentation

## Overview

The CSV Import feature allows administrators to bulk import members into the ICPEP NCR Passport system. The system validates all data, auto-generates passwords, and provides detailed error reporting.

---

## CSV Format

### Required Columns
```
firstName, lastName, email, role, schoolId
```

### Optional Columns
```
age, certificateUrl
```

### Complete Header Example
```csv
firstName,lastName,email,role,schoolId,age,certificateUrl
```

---

## Column Specifications

| Column | Type | Required | Rules | Example |
|--------|------|----------|-------|---------|
| `firstName` | String | ✅ | Min 2 chars, max 100 | John |
| `lastName` | String | ✅ | Min 2 chars, max 100 | Doe |
| `email` | String | ✅ | Valid email format | john.doe@example.com |
| `role` | String | ✅ | ADMIN, SCANNER, or MEMBER | MEMBER |
| `schoolId` | Number | ✅ | Positive integer | 1 |
| `age` | Number | ❌ | 1-120 | 25 |
| `certificateUrl` | String | ❌ | Valid HTTP(S) URL | https://example.com/cert.pdf |

---

## Supported Roles

- **ADMIN** - Full system access, can manage users and events
- **SCANNER** - Can scan QR codes and create stamps
- **MEMBER** - Regular member access, can view passport

---

## Password Policy

All imported members receive a **temporary password**:
```
Aysipep.se@2026
```

⚠️ **Important:** Members must change this password on first login.

---

## CSV Examples

### Minimal Import (Required Fields Only)
```csv
firstName,lastName,email,role,schoolId
John,Doe,john.doe@example.com,MEMBER,1
Jane,Smith,jane.smith@example.com,SCANNER,2
Bob,Johnson,bob.johnson@example.com,ADMIN,1
```

### Complete Import (All Fields)
```csv
firstName,lastName,email,role,schoolId,age,certificateUrl
John,Doe,john.doe@example.com,MEMBER,1,25,https://example.com/cert1.pdf
Jane,Smith,jane.smith@example.com,SCANNER,2,28,https://example.com/cert2.pdf
Bob,Johnson,bob.johnson@example.com,ADMIN,1,35,https://example.com/cert3.pdf
Maria,Garcia,maria.garcia@example.com,MEMBER,3,22,
Carlos,Rodriguez,carlos.rodriguez@example.com,MEMBER,2,26,https://example.com/cert4.pdf
```

---

## Validation Rules

### All Imports
- ✅ Header row must match required columns
- ✅ Email format must be valid (contains @ and .)
- ✅ Role must be ADMIN, SCANNER, or MEMBER
- ✅ schoolId must exist in the system
- ✅ No duplicate emails in CSV

### First Name & Last Name
- ✅ Must be at least 2 characters
- ✅ Cannot be empty
- ✅ Maximum 100 characters

### Age (Optional)
- ✅ If provided, must be between 1 and 120
- ✅ Must be a valid number

### Certificate URL (Optional)
- ✅ If provided, must be a valid HTTP or HTTPS URL
- ✅ Schema (http:// or https://) is required

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "firstName is required" | Missing firstName column or empty value | Add firstName column and ensure all rows have values |
| "Invalid email format" | Email doesn't contain @ and . | Check email format (e.g., user@domain.com) |
| "role must be ADMIN, SCANNER, or MEMBER" | Invalid role value | Use exactly ADMIN, SCANNER, or MEMBER (case-sensitive) |
| "schoolId must be a valid positive number" | Invalid school ID | Verify schoolId exists and is a positive integer |
| "certificateUrl must be a valid URL" | Malformed URL | Include http:// or https:// prefix |
| "Invalid school ID provided" | School doesn't exist | Ensure schoolId exists in the system |
| "age must be between 1 and 120" | Age out of range | Provide age between 1 and 120 |

### Partial Import Behavior

If some rows fail validation:
- ✅ Valid rows are imported successfully
- ❌ Invalid rows are skipped with detailed error messages
- 📊 Import report shows imported count and failed count

---

## Import Process

### Step 1: Access Import Feature
1. Go to **Admin Dashboard**
2. Navigate to **Members** tab
3. Click **Import Members** button

### Step 2: Select CSV File
1. Click the upload area or drag & drop a CSV file
2. File must be `.csv` format
3. Maximum file size: **10MB**

### Step 3: Download Template (Optional)
- Click **Download CSV Template** for a sample file
- Use as reference for your import

### Step 4: Review Results
- **Success**: Shows imported count
- **Errors**: Lists all validation errors with row numbers
- **Warnings**: Displays temporary password and other notes

### Step 5: Complete Import
- On success, click **Import Another File** or **Close**
- On failure, click **Try Again** to modify and retry

---

## API Details

### Server Action: `importMembersFromCSV(csvContent: string)`

**Input:**
```typescript
csvContent: string // Raw CSV file content
```

**Output:**
```typescript
{
  success: boolean;           // Overall import success
  imported: number;           // Count of successfully imported members
  failed: number;             // Count of failed imports
  errors: Array<{
    row: number;              // Row number (1-indexed)
    error: string;            // Error message
    data?: Record<string, unknown>; // Row data
  }>;
  warnings?: string[];        // Additional info messages
}
```

### Response Example
```json
{
  "success": true,
  "imported": 45,
  "failed": 2,
  "errors": [
    {
      "row": 23,
      "error": "Invalid email format",
      "data": {"firstName": "John", "lastName": "Doe", "email": "invalid-email"}
    },
    {
      "row": 45,
      "error": "schoolId must be a valid positive number",
      "data": {"schoolId": "abc"}
    }
  ],
  "warnings": [
    "45 member(s) imported successfully",
    "Temporary password set to: Aysipep.se@2026"
  ]
}
```

---

## Auto-Generated Fields

### Member ID
Format: `ICPEPSE-NCR-{SCHOOL_CODE}-{PADDED_COUNTER}`

Example: `ICPEPSE-NCR-ABC-0001`

Generated automatically during import based on:
- School code from schoolId
- Auto-incrementing counter per school

### Username
Same as Member ID initially. Defaults to first name + last name if collision.

Example: `john.doe` or `ICPEPSE-NCR-ABC-0001`

### Password
All members receive: `Aysipep.se@2026`

---

## Best Practices

### Before Import
1. ✅ Validate your CSV file in a text editor or Excel
2. ✅ Verify all required columns are present
3. ✅ Check that schoolId values exist in the system
4. ✅ Ensure emails are unique and valid
5. ✅ Use UTF-8 encoding for the CSV file

### CSV Preparation Tips
- **Excel to CSV**: File → Save As → CSV (Comma delimited)
- **Google Sheets to CSV**: File → Download → Comma separated values (.csv)
- **Encoding**: Always use UTF-8 to avoid character issues
- **Line Endings**: Use LF (Unix) line endings, not CRLF (Windows)

### After Import
1. ✅ Review the import report carefully
2. ✅ Notify members of their temporary password
3. ✅ Request password change on first login
4. ✅ Verify member count in dashboard

---

## Troubleshooting

### File Won't Upload
- **Issue**: "Only CSV files are allowed"
- **Solution**: Ensure file extension is `.csv`

### File Too Large
- **Issue**: "File size must not exceed 10MB"
- **Solution**: Split into multiple smaller files (< 10MB each)

### All Rows Failed
- **Issue**: CSV header validation failed
- **Solution**: Download template and match header format exactly

### Some Rows Failed
- **Issue**: Individual row validation errors
- **Solution**: Review error messages, fix data, and retry

### Members Not Appearing
- **Issue**: Import showed success but members not visible
- **Solution**: Refresh the page or check filter settings

---

## Security Considerations

✅ **What's Validated:**
- Email format (prevents malformed data)
- Role values (only allowed roles)
- School IDs (must exist)
- Password requirements (enforced server-side)

✅ **What's Secure:**
- Passwords are hashed before storage
- Data is validated server-side
- Only admins can import
- All operations are logged

⚠️ **Remember:**
- Don't share temporary passwords via email
- Use secure channels for credential distribution
- Change default password on first login

---

## FAQ

**Q: Can I import without an email?**
A: No, email is required. It's used for authentication.

**Q: What happens if I import duplicate emails?**
A: The system will reject the duplicate and show an error message.

**Q: Can I update existing members via CSV?**
A: No, CSV import is for new members only. Use the edit function for updates.

**Q: Are imported members active immediately?**
A: Yes, all imported members are active and can log in with the temporary password.

**Q: Can I bulk delete imported members?**
A: No, but you can deactivate them individually from the members list.

**Q: What if my school ID doesn't exist?**
A: The import will fail for that row. Create the school first, then retry.

**Q: How long does import take?**
A: Typically < 2 seconds for 1000 members, depending on file size.

---

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in import report
3. Contact system administrator
4. Check the template for format reference
