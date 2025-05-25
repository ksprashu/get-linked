# Implementation Plan: HTML Formatting & Preview Feature

This document outlines the implementation plan for enhancing the AI Research Extractor Chrome extension to handle HTML formatting and add a preview feature.

## Overview

We will enhance the current side panel-based extension to:
1. Preserve HTML formatting when content is pasted
2. Add a preview feature to show how the content will look after processing
3. Support multiple export formats (Markdown, HTML, plain text)

## Technical Components

### 1. HTML-Formatted Content Handling

#### Current Limitations
The current implementation treats pasted content as plain text, losing all formatting. When users copy from Gemini, browsers actually capture the HTML format in the clipboard, but our application doesn't preserve it.

#### Implementation Approach

1. **Capture HTML on Paste**
   - Modify the content textarea to capture HTML when content is pasted
   - Use the Clipboard API to access formatted content
   - Store both plain text and HTML versions of the content

2. **Update Background Processing**
   - Modify the background script to process HTML content
   - Enhance TurndownJS configuration to handle complex formatting (tables, code blocks)
   - Add support for exporting the original HTML directly

### 2. Preview Feature

#### Implementation Approach

1. **Add UI Components**
   - Create tab-based interface with "Editor" and "Preview" tabs
   - Add toggle buttons for switching between views
   - Style the preview pane to render the formatted content

2. **Live Preview Logic**
   - Implement real-time preview generation
   - For Markdown preview: Use a library like marked.js
   - For HTML preview: Display sanitized HTML directly
   - Update preview when content changes

3. **Preview Styling**
   - Add CSS for proper rendering of markdown/HTML elements
   - Match styling to common blog/documentation platforms
   - Ensure proper rendering of tables, code blocks, headings, etc.

### 3. Multiple Export Formats

1. **Format Selection UI**
   - Add radio buttons for selecting output format
   - Support Markdown, HTML, and plain text formats

2. **Export Logic**
   - Implement format conversion in the background script
   - Add appropriate file extensions for each format
   - Ensure proper content type in the save dialog

## Implementation Steps

### Phase 1: HTML Formatting Preservation

1. **Update `popup.html` to handle formatted paste**

```html
<div class="form-group">
  <label for="content-area">Main Content:</label>
  <div id="content-container" class="content-editable-container">
    <div id="content-area" contenteditable="true" class="content-editable"
         placeholder="Paste the main research content here..."></div>
  </div>
</div>
```

2. **Add event handlers in `popup.js` to capture HTML**

```javascript
// Replace textarea with contenteditable div
const contentArea = document.getElementById('content-area');

// Handle paste event to capture HTML
contentArea.addEventListener('paste', (e) => {
  // Prevent default paste behavior
  e.preventDefault();

  // Get clipboard data
  const clipboardData = e.clipboardData || window.clipboardData;

  // Get HTML content if available
  let htmlContent = clipboardData.getData('text/html');

  // Fallback to plain text if HTML is not available
  if (!htmlContent) {
    htmlContent = clipboardData.getData('text/plain');
    // Convert plain text to HTML (basic formatting)
    htmlContent = htmlContent.replace(/\n/g, '<br>');
  }

  // Insert content at cursor position
  document.execCommand('insertHTML', false, htmlContent);

  // Update preview if visible
  updatePreview();
});
```

3. **Modify content processing in `background.js`**

```javascript
// Function to process pasted content
async function processContent(data, sendResponse) {
  try {
    // Make sure TurndownJS is initialized
    if (!turndownService) {
      initializeTurndown();
    }

    // Extract content based on format
    let { processedContent, extractedSources } = processContentByFormat(
      data.content,
      data.contentFormat || 'html', // Default to HTML
      data.sources
    );

    // Create appropriate output based on desired format
    let outputContent;
    switch (data.outputFormat) {
      case 'html':
        outputContent = processedContent; // Already HTML
        break;
      case 'text':
        // Strip HTML tags for plain text
        outputContent = processedContent.replace(/<[^>]*>/g, '');
        break;
      case 'markdown':
      default:
        // Convert HTML to Markdown
        outputContent = turndownService.turndown(processedContent);
        break;
    }

    // Combine all data
    const processedData = {
      title: data.title,
      content: outputContent,
      sources: extractedSources,
      date: data.date,
      aiTool: data.aiTool,
      sourceUrl: 'Manual extraction',
      format: data.outputFormat || 'markdown'
    };

    // Send the processed data back to the popup
    sendResponse({ success: true, data: processedData });
  } catch (error) {
    console.error('Error processing content:', error);
    sendResponse({ success: false, error: error.message });
  }
}
```

### Phase 2: Preview Feature

1. **Add preview tab structure to `popup.html`**

```html
<div class="tab-container">
  <div class="tab-buttons">
    <button id="editor-tab-btn" class="tab-btn active">Editor</button>
    <button id="preview-tab-btn" class="tab-btn">Preview</button>
  </div>

  <div id="editor-tab" class="tab-content active">
    <!-- Existing editor content -->
    <div class="form-group">
      <label for="research-title">Research Title:</label>
      <input type="text" id="research-title" placeholder="Enter a title for your research">
    </div>

    <div class="form-group">
      <label for="content-area">Main Content:</label>
      <div id="content-container" class="content-editable-container">
        <div id="content-area" contenteditable="true" class="content-editable"
             placeholder="Paste the main research content here..."></div>
      </div>
    </div>

    <div class="form-group">
      <label for="sources-area">Sources/References:</label>
      <textarea id="sources-area" placeholder="Paste the sources/references here..."></textarea>
    </div>
  </div>

  <div id="preview-tab" class="tab-content">
    <h1 id="preview-title">Title Preview</h1>
    <div id="preview-content" class="preview-container"></div>
    <h2>Sources</h2>
    <div id="preview-sources" class="preview-container"></div>
  </div>
</div>

<div class="format-selection">
  <label>Output Format:</label>
  <div class="radio-group">
    <input type="radio" id="format-markdown" name="output-format" value="markdown" checked>
    <label for="format-markdown">Markdown</label>

    <input type="radio" id="format-html" name="output-format" value="html">
    <label for="format-html">HTML</label>

    <input type="radio" id="format-text" name="output-format" value="text">
    <label for="format-text">Plain Text</label>
  </div>
</div>
```

2. **Add tab switching logic and preview generation to `popup.js`**

```javascript
// Tab switching functionality
const editorTabBtn = document.getElementById('editor-tab-btn');
const previewTabBtn = document.getElementById('preview-tab-btn');
const editorTab = document.getElementById('editor-tab');
const previewTab = document.getElementById('preview-tab');

// Preview elements
const previewTitle = document.getElementById('preview-title');
const previewContent = document.getElementById('preview-content');
const previewSources = document.getElementById('preview-sources');

// Format selection
const formatMarkdown = document.getElementById('format-markdown');
const formatHtml = document.getElementById('format-html');
const formatText = document.getElementById('format-text');

// Switch to editor tab
editorTabBtn.addEventListener('click', () => {
  editorTabBtn.classList.add('active');
  previewTabBtn.classList.remove('active');
  editorTab.classList.add('active');
  previewTab.classList.remove('active');
});

// Switch to preview tab
previewTabBtn.addEventListener('click', () => {
  previewTabBtn.classList.add('active');
  editorTabBtn.classList.remove('active');
  previewTab.classList.add('active');
  editorTab.classList.remove('active');

  // Update preview content
  updatePreview();
});

// Function to update preview
function updatePreview() {
  // Get content and format
  const title = document.getElementById('research-title').value || 'Untitled Research';
  const content = document.getElementById('content-area').innerHTML;
  const sources = document.getElementById('sources-area').value;
  const outputFormat = document.querySelector('input[name="output-format"]:checked').value;

  // Update preview title
  previewTitle.textContent = title;

  // Generate preview based on format
  generatePreview(content, sources, outputFormat);
}

// Function to generate preview
function generatePreview(content, sources, format) {
  // Process content based on format
  let processedContent;

  switch (format) {
    case 'html':
      // Sanitize HTML for security
      processedContent = sanitizeHtml(content);
      previewContent.innerHTML = processedContent;
      break;

    case 'text':
      // Strip HTML for plain text
      processedContent = content.replace(/<[^>]*>/g, '');
      previewContent.textContent = processedContent;
      break;

    case 'markdown':
    default:
      // For markdown preview, we can:
      // 1. Convert HTML to Markdown first (server-side/background)
      // 2. Convert Markdown back to HTML for preview (client-side)
      // Here we'll use a simplified approach for the mockup
      if (window.marked) {
        // First convert HTML to Markdown using TurndownService
        const markdown = turndownService.turndown(content);
        // Then render markdown as HTML using marked
        previewContent.innerHTML = marked(markdown);
      } else {
        // Fallback if marked is not available
        previewContent.innerHTML = content;
      }
      break;
  }

  // Extract and display sources
  const extractedSources = extractSourcesForPreview(sources);
  previewSources.innerHTML = '';

  if (extractedSources.length > 0) {
    const sourcesList = document.createElement('ul');
    extractedSources.forEach(source => {
      const sourceItem = document.createElement('li');
      sourceItem.innerHTML = `<a href="${source.url}" target="_blank">${source.title}</a>`;
      sourcesList.appendChild(sourceItem);
    });
    previewSources.appendChild(sourcesList);
  } else {
    previewSources.textContent = 'No sources found.';
  }
}

// Function to extract sources for preview
function extractSourcesForPreview(sourcesText) {
  if (!sourcesText || !sourcesText.trim()) {
    return [];
  }

  const sources = [];
  const lines = sourcesText.split('\n').filter(line => line.trim());

  lines.forEach(line => {
    // Look for URLs in the line
    const urlMatches = line.match(/https?:\/\/[^\s)]+/g);

    if (urlMatches) {
      urlMatches.forEach(url => {
        // Clean up the URL
        const cleanUrl = url.replace(/[.,)]$/, '');

        // Extract a title
        let title = line.replace(cleanUrl, '').trim();

        // Remove common prefixes/formatting
        title = title
          .replace(/^\d+\.\s*/, '') // Remove numbered list markers
          .replace(/^\[\d+\]\s*/, '') // Remove reference markers
          .replace(/^[-•*]\s*/, '') // Remove bullet points
          .trim();

        // If no title could be extracted, use domain
        if (!title) {
          try {
            title = new URL(cleanUrl).hostname;
          } catch (e) {
            title = "Unknown Source";
          }
        }

        // Add to sources if not a duplicate
        const isDuplicate = sources.some(source => source.url === cleanUrl);
        if (!isDuplicate) {
          sources.push({
            title: title,
            url: cleanUrl
          });
        }
      });
    }
  });

  return sources;
}

// Monitor format changes to update preview if needed
document.querySelectorAll('input[name="output-format"]').forEach(radio => {
  radio.addEventListener('change', () => {
    if (previewTab.classList.contains('active')) {
      updatePreview();
    }
  });
});

// Monitor content changes to update preview if visible
const contentArea = document.getElementById('content-area');
const sourcesArea = document.getElementById('sources-area');
const titleInput = document.getElementById('research-title');

contentArea.addEventListener('input', () => {
  if (previewTab.classList.contains('active')) {
    updatePreview();
  }
});

sourcesArea.addEventListener('input', () => {
  if (previewTab.classList.contains('active')) {
    updatePreview();
  }
});

titleInput.addEventListener('input', () => {
  if (previewTab.classList.contains('active')) {
    updatePreview();
  }
});
```

3. **Add CSS for the new UI components in `popup.css`**

```css
/* Tab styling */
.tab-container {
  width: 100%;
  margin-bottom: 16px;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-weight: bold;
  color: #5f6368;
}

.tab-btn:hover {
  background-color: #f1f3f4;
}

.tab-btn.active {
  color: #1a73e8;
  border-bottom: 2px solid #1a73e8;
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}

/* Content editable styling */
.content-editable-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: auto;
}

.content-editable {
  min-height: 180px;
  padding: 8px;
  outline: none;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
}

[contenteditable=true]:empty:before {
  content: attr(placeholder);
  color: #999;
  font-style: italic;
}

/* Preview styling */
.preview-container {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: white;
  min-height: 100px;
  overflow: auto;
}

#preview-title {
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 16px;
}

/* Format selection */
.format-selection {
  margin-bottom: 16px;
}

.format-selection label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}
```

### Phase 3: Multiple Export Formats

1. **Modify the processing and save functionality in background.js**

```javascript
// Modify the saveAsMarkdown function to handle different formats
async function saveContent(data, sendResponse) {
  try {
    // Determine file extension based on format
    let fileExtension, fileType, mimeType;

    switch (data.format) {
      case 'html':
        fileExtension = '.html';
        fileType = 'HTML Files';
        mimeType = 'text/html';
        break;
      case 'text':
        fileExtension = '.txt';
        fileType = 'Text Files';
        mimeType = 'text/plain';
        break;
      case 'markdown':
      default:
        fileExtension = '.md';
        fileType = 'Markdown Files';
        mimeType = 'text/markdown';
        break;
    }

    // Create front matter only for markdown
    let contentToSave = data.content;

    if (data.format === 'markdown') {
      // Add Jekyll front matter
      const frontMatter = `---
title: "${data.title}"
date: ${data.date}
ai_tool: "${data.aiTool}"
source_url: "${data.sourceUrl}"
---

`;
      contentToSave = frontMatter + contentToSave;
    } else if (data.format === 'html') {
      // Add basic HTML structure
      contentToSave = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <meta name="generator" content="AI Research Extractor">
  <meta name="date" content="${data.date}">
  <meta name="ai-tool" content="${data.aiTool}">
</head>
<body>
  <h1>${data.title}</h1>
  ${data.content}

  <h2>Sources</h2>
  <ul>
    ${data.sources.map(source => `<li><a href="${source.url}">${source.title}</a></li>`).join('\n    ')}
  </ul>
</body>
</html>`;
    }

    // Create a safe filename from the title
    const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}${fileExtension}`;

    // Use the File System Access API to save the file
    try {
      const options = {
        types: [
          {
            description: fileType,
            accept: { [mimeType]: [fileExtension] },
          },
        ],
        suggestedName: filename
      };

      const fileHandle = await window.showSaveFilePicker(options);
      const writable = await fileHandle.createWritable();
      await writable.write(contentToSave);
      await writable.close();

      sendResponse({
        success: true,
        filename: fileHandle.name
      });
    } catch (error) {
      // User might have canceled the file picker
      if (error.name === 'AbortError') {
        sendResponse({ success: false, error: 'File save was canceled.' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error saving content:', error);
    sendResponse({ success: false, error: error.message });
  }
}
```

## Required Libraries

1. **turndown.js** (already included) - For HTML to Markdown conversion
2. **marked.js** (need to add) - For Markdown to HTML conversion in preview
3. **DOMPurify** (need to add) - For sanitizing HTML content

## Testing Plan

1. **HTML Paste Testing**
   - Copy various content types from Gemini (text, headings, lists, code, tables)
   - Verify formatting is preserved in the editor
   - Check preview rendering

2. **Format Conversion Testing**
   - Test HTML → Markdown conversion quality
   - Verify export in different formats

3. **Preview Accuracy Testing**
   - Compare preview with final saved output
   - Test with complex formatting

## Success Criteria

1. Users can paste HTML-formatted content from Gemini and retain formatting
2. Preview feature accurately shows how content will appear after processing
3. Users can export in their preferred format (Markdown, HTML, plain text)
4. The UI is intuitive and the workflow is smooth

## Nice-to-Have Features (Future Enhancements)

1. **Custom styling options** - Allow users to customize the appearance of exported content
2. **Template support** - Predefined templates for different use cases
3. **Image handling** - Support for including images from Gemini
4. **Cloud storage integration** - Option to save directly to services like Google Drive
