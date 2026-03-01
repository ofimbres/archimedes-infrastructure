# Easy Email Setup for Miniquizzes

## Quick Setup (3 ways to configure email)

### Method 1: Meta Tags (Recommended)
Add these lines to your HTML `<head>` section:
```html
<meta name="teacher-email" content="your-email@school.edu">
<meta name="subject" content="Your Custom Subject">
```

### Method 2: URL Parameters
Access your miniquiz with email in URL:
```
https://your-domain.com/miniquiz.html?email=teacher@school.edu
```

### Method 3: Email Input Field
Add an email input field anywhere on your page:
```html
<input type="email" value="teacher@school.edu" style="display:none;">
```

## Advanced Configuration

If you need more control, add this to your HTML:
```javascript
window.M4UConfig = {
    submissionMethod: 'email',
    email: {
        to: 'teacher@school.edu',
        subject: 'Custom Subject Line',
        body: 'Custom email body text'
    }
};
```

## Features

- ✅ **Auto-detection**: Finds teacher email automatically
- ✅ **Smart subjects**: Uses page title if no subject specified  
- ✅ **Student info**: Includes student name in email subject
- ✅ **Grade included**: Shows final grade in email
- ✅ **Full miniquiz**: Complete miniquiz copy attached
- ✅ **Professional UI**: Clean loading and success messages
- ✅ **Fallback**: Falls back to postMessage if email fails

## Email Content

The email will include:
- **Subject**: "Miniquiz: [Page Title] - [Student Name]"
- **Grade**: Student's final grade percentage
- **Miniquiz**: Complete copy of answered miniquiz
- **Timestamp**: When submission was made

## Browser Compatibility

Works in all modern browsers that support `mailto:` links. On mobile devices, opens the default email app with pre-filled content.
