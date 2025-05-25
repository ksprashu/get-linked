# Testing Guide: AI Research Extractor Chrome Extension (Phase 1)

This guide provides comprehensive instructions for testing Phase 1 of the AI Research Extractor Chrome extension, which focuses on processing copied content from Google Gemini Deep Research pages and saving it as Markdown files with Jekyll front matter.

## 1. Setup Instructions

### 1.1 Generate Icon PNG Files

The extension requires icon files in PNG format. Follow these steps to generate them:

1. **Open the icon HTML files in Chrome**:
   - Navigate to the `icons` directory in your project
   - Open each of the following files in Chrome:
     - `icon16.html`
     - `icon48.html`
     - `icon128.html`

2. **Save the icons as PNG files**:
   - For each open HTML file, right-click on the canvas element
   - Select "Save Image As..."
   - Save with the corresponding filename (`icon16.png`, `icon48.png`, `icon128.png`) in the `icons` directory
   - Ensure the files are saved with the exact names specified in the `manifest.json` file

Alternatively, you can use the provided script to generate all icons at once:

1. Create a simple HTML file in the project root (e.g., `generate_icons.html`):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Generate Icons</title>
   </head>
   <body>
     <h1>Generating Icons...</h1>
     <script src="icons/generate_icons.js"></script>
   </body>
   </html>
   ```

2. Open this file in Chrome, and it will automatically generate and download all three icon files
3. Move the downloaded files to the `icons` directory in your project

### 1.2 Load the Extension in Chrome Developer Mode

1. **Open Chrome Extensions page**:
   - Type `chrome://extensions` in the Chrome address bar
   - Press Enter

2. **Enable Developer Mode**:
   - Toggle on the "Developer mode" switch in the top-right corner

3. **Load the extension**:
   - Click the "Load unpacked" button
   - Navigate to the root directory of the AI Research Extractor project
   - Select the directory and click "Open"

4. **Verify the extension is loaded**:
   - The extension should appear in your extensions list
   - The icon should be visible in the Chrome toolbar
   - Note the extension ID (you'll need this for debugging)

### 1.3 Prerequisite Setup

1. **Ensure TurndownJS is properly included**:
   - Verify that `lib/turndown.js` exists in your project directory
   - This library is essential for HTML-to-Markdown conversion

2. **Check Chrome permissions**:
   - Ensure Chrome has permission to download files to your desired location
   - For testing, it's recommended to set Chrome to ask where to save files each time

## 2. Testing Procedure

### 2.1 Navigate to a Google Gemini Deep Research Page

1. **Access Google Gemini**:
   - Go to https://gemini.google.com/
   - Sign in with your Google account if prompted

2. **Start a Deep Research session**:
   - Click on "Research" in the Gemini interface
   - Alternatively, go directly to https://gemini.google.com/app/research/

3. **Enter a research query**:
   - Type a research query that will generate substantial content with citations
   - Example: "What are the latest advancements in quantum computing? Provide detailed information with academic sources."
   - Click "Submit" or press Enter

4. **Wait for complete response**:
   - Allow Gemini to fully generate its response
   - Ensure the response includes citations/sources (usually displayed as links)

### 2.2 Copy Content from the Gemini Page

1. **Copy the main research content**:
   - Select all the main content from the Gemini response
   - Right-click and select "Copy" or press Ctrl+C (Cmd+C on Mac)
   - Make sure to include all text, headings, and paragraphs

2. **Copy the sources/references separately**:
   - Scroll to the sources section at the bottom of the response
   - Select all the sources/references
   - Right-click and select "Copy" or press Ctrl+C (Cmd+C on Mac)
   - If sources are inline, you may need to copy them along with the main content or manually identify them

### 2.3 Use the Extension to Process the Content

1. **Click the extension icon**:
   - Click on the AI Research Extractor icon in the Chrome toolbar
   - The side panel should open on the right side of the browser window
   - The side panel will remain open while you browse

2. **Enter research title**:
   - Type a title for your research in the "Research Title" field
   - This can be based on your original query

3. **Paste the main content**:
   - Click in the "Main Content" textarea
   - Paste the copied content using Ctrl+V (Cmd+V on Mac)

4. **Paste the sources/references**:
   - Click in the "Sources/References" textarea
   - Paste the copied sources using Ctrl+V (Cmd+V on Mac)

5. **Process the content**:
   - Click the "Process Content" button in the popup
   - The status should change to "Processing content..."
   - After a moment, it should show "Processing complete!"
   - The "Save as Markdown" button should become enabled

6. **Verify processing details**:
   - Check the processing details shown in the popup
   - It should display the number of sources extracted and the title of the research

### 2.4 Save the Processed Content as a Markdown File

1. **Save the content**:
   - Click the "Save as Markdown" button in the popup
   - A file save dialog should appear
   - The suggested filename should be derived from the research title

2. **Choose save location**:
   - Select a location to save the file
   - Click "Save"

3. **Verify save confirmation**:
   - The popup should show "Research saved successfully!"
   - It should display the filename where the content was saved

### 2.5 Verify Proper Processing and Conversion

1. **Open the saved Markdown file**:
   - Navigate to the location where you saved the file
   - Open it with a text editor or Markdown viewer

2. **Check the file structure**:
   - The file should begin with Jekyll front matter (between `---` delimiters)
   - The main content should follow, properly formatted in Markdown
   - Citations and links should be preserved

## 3. Validation Checklist

### 3.1 Verify Processed Content Correctness

- [ ] The title matches the title entered in the form
- [ ] All paragraphs from the pasted content are present
- [ ] Headings are preserved with proper Markdown syntax (# for h1, ## for h2, etc.)
- [ ] Lists (ordered and unordered) are correctly formatted
- [ ] Emphasis (bold, italic) is preserved if present in the pasted content
- [ ] Code blocks are properly formatted with backticks or indentation
- [ ] HTML tags from the pasted content are properly converted to Markdown

### 3.2 Check Markdown Formatting

- [ ] Headers use the ATX style (# Header) rather than underlines
- [ ] Lists use proper Markdown syntax (*, -, or numbers)
- [ ] Links use the correct Markdown format: `[text](url)`
- [ ] Code blocks use fenced style with backticks
- [ ] No HTML tags remain (unless they're intentionally preserved)
- [ ] No broken or malformed Markdown syntax

### 3.3 Confirm Jekyll Front Matter

- [ ] Front matter is enclosed in triple dashes (`---`)
- [ ] `title` field contains the title entered in the form
- [ ] `date` field contains a valid ISO timestamp
- [ ] `ai_tool` field is set to "Google Gemini"
- [ ] `source_url` field contains "Manual extraction" instead of a URL
- [ ] No syntax errors in the front matter (quotes around strings, etc.)

### 3.4 Validate Source Links

- [ ] All URLs from the pasted sources text are extracted
- [ ] Links are properly formatted in Markdown syntax
- [ ] No duplicate links are present
- [ ] Links are functional (can be clicked and lead to the correct destinations)
- [ ] Link titles are extracted or generated appropriately

## 4. Troubleshooting Guide

### 4.1 Common Issues

#### Extension Not Appearing in Toolbar
- **Solution**: Click the puzzle piece icon in Chrome toolbar, find the extension, and pin it

#### Side Panel Not Opening
- **Solution**: Make sure you've enabled the Side Panel API in Chrome (chrome://flags/#side-panel)
- **Solution**: Try reloading the extension from the chrome://extensions page
- **Solution**: Check the console for any errors related to the side panel

#### Content Not Processing Correctly
- **Solution**: Make sure you've copied the complete content without missing sections
- **Solution**: If HTML formatting is included in the copied content, try using a plain text editor to remove formatting before pasting
- **Solution**: Try copying smaller sections if the content is very large

#### Source Links Not Extracted
- **Solution**: Ensure sources are properly formatted with URLs
- **Solution**: Copy sources with complete URLs rather than truncated versions
- **Solution**: Try copying sources separately from the main content

#### Save Dialog Doesn't Appear
- **Solution**: Check Chrome permissions for downloads
- **Solution**: Try saving to a different location

#### Markdown Formatting Issues
- **Solution**: Check if TurndownJS is properly loaded
- **Solution**: Complex formatting might not convert perfectly; manual fixes may be needed

### 4.2 Debugging Tips

#### Using Chrome Developer Tools for the Extension

1. **Access extension's background page**:
   - Go to `chrome://extensions`
   - Find the AI Research Extractor extension
   - Click "service worker" under "Inspect views"
   - This opens DevTools for the background script

2. **Debug the side panel**:
   - With the side panel open, right-click inside it
   - Select "Inspect" from the context menu
   - This opens DevTools for the side panel
   - This is particularly useful for debugging form interactions and processing issues

### 4.3 Viewing Extension Logs

1. **Background script logs**:
   - Open the background script DevTools as described above
   - Check the "Console" tab for logs
   - Look for processing and parsing related messages
   - Check for errors related to content processing or Markdown conversion

2. **Popup logs**:
   - Open the popup DevTools as described above
   - Check the "Console" tab for form validation errors
   - Look for messages related to input processing

3. **Side panel logs**:
   - Open the side panel DevTools as described above
   - Check the "Console" tab for any error messages
   - Look for messages related to form submission and content processing

4. **Enable verbose logging** (for development):
   - Add more `console.log()` statements to the code for debugging
   - Reload the extension after making changes

## 5. Example Test Case

### 5.1 Gemini Deep Research Query

**Query**: "Explain the environmental impact of microplastics in oceans, including recent research findings and potential solutions. Cite scientific sources."

### 5.2 Expected Output

The saved Markdown file should:

1. **Have Jekyll front matter**:
   ```yaml
   ---
   title: "Explain the environmental impact of microplastics in oceans, including recent research findings and potential solutions. Cite scientific sources."
   date: 2025-03-05T17:04:23.000Z
   ai_tool: "Google Gemini"
   source_url: "Manual extraction"
   ---
   ```

2. **Contain properly formatted content**:
   - Headers for different sections (e.g., "## Environmental Impact of Microplastics")
   - Paragraphs explaining the impacts, research findings, and solutions
   - Properly formatted lists of impacts or solutions
   - Properly formatted citations and links to scientific sources

3. **Include extracted sources**:
   - Links to scientific papers, journals, or reputable websites
   - Properly formatted as Markdown links

### 5.3 Validation Steps

1. Open the saved Markdown file in a Markdown previewer
2. Verify that the content matches what you pasted into the extension
3. Check that all formatting is properly converted to Markdown
4. Verify that URLs from the sources section were correctly extracted and formatted
5. Ensure that source titles were properly detected or generated from URLs
6. Test the file with a Jekyll site (optional) to ensure it renders correctly

## 6. Next Steps After Testing

After successfully testing Phase 1:

1. Document any issues or bugs encountered
2. Note any suggestions for improvements
3. Verify all Phase 1 requirements have been met
4. Prepare for Phase 2 implementation (multi-tool extraction & CSV link saving)

---

This testing guide covers the essential aspects of validating Phase 1 of the AI Research Extractor Chrome extension. Following these steps will ensure that the core functionality works as expected before proceeding to subsequent phases.
