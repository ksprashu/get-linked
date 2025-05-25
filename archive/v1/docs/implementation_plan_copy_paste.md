# Implementation Plan: Copy/Paste Approach for AI Research Extractor

## Overview

Due to Google's ExtensionsSettings policy preventing direct scripting of Gemini pages, we need to switch from an automated extraction approach to a user-initiated copy/paste workflow. This document outlines the specific implementation changes required across the extension's components.

## 1. Manifest.json Modifications

### Current State

```json
{
  "manifest_version": 3,
  "name": "AI Research Extractor",
  "version": "0.1.0",
  "description": "Extracts research content and sources from AI tools like Google Gemini Deep Research.",
  "host_permissions": [
    "https://gemini.google.com/app/*"
  ],
  "permissions": [
    "scripting"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://gemini.google.com/app/*"],
      "js": ["content-scripts/gemini.js"]
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Required Changes

```json
{
  "manifest_version": 3,
  "name": "AI Research Extractor",
  "version": "0.1.0",
  "description": "Extracts research content and sources from AI tools like Google Gemini Deep Research.",
  "permissions": [
    "scripting"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

Key changes:
- Removed `host_permissions` array entirely
- Removed `content_scripts` section entirely
- Kept `scripting` permission for potential future needs
- All other elements remain unchanged

## 2. Popup UI Redesign

### Current State
The current popup UI (`popup/popup.html` and `popup/popup.css`) is designed for automated extraction with:
- "Extract Content" button
- "Save Locally" button
- Status messages
- No input fields

### Required Changes

#### HTML Updates (`popup/popup.html`)

```html
<!DOCTYPE html>
<html>
<head>
  <title>AI Research Extractor</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>AI Research Extractor</h1>

    <div class="instructions">
      <h2>Instructions</h2>
      <ol>
        <li>Copy the <strong>main content</strong> from the Gemini page</li>
        <li>Paste it in the "Content" field below</li>
        <li>Copy the <strong>sources/references</strong> separately</li>
        <li>Paste them in the "Sources" field below</li>
        <li>Provide a title for your research</li>
        <li>Click "Process" to extract and format</li>
      </ol>
    </div>

    <div class="form-group">
      <label for="research-title">Research Title:</label>
      <input type="text" id="research-title" placeholder="Enter a title for your research">
    </div>

    <div class="form-group">
      <label for="content-area">Main Content:</label>
      <textarea id="content-area" placeholder="Paste the main research content here..."></textarea>
    </div>

    <div class="form-group">
      <label for="sources-area">Sources/References:</label>
      <textarea id="sources-area" placeholder="Paste the sources/references here..."></textarea>
    </div>

    <div class="parsing-options">
      <label>Parsing Method:</label>
      <div class="radio-group">
        <input type="radio" id="basic-parsing" name="parsing-method" value="basic" checked>
        <label for="basic-parsing">Basic (Fast, Works Offline)</label>

        <input type="radio" id="enhanced-parsing" name="parsing-method" value="enhanced" disabled>
        <label for="enhanced-parsing">Enhanced (AI-Assisted, Coming Soon)</label>
      </div>
    </div>

    <div class="buttons">
      <button id="process-button">Process Content</button>
      <button id="save-button" disabled>Save as Markdown</button>
    </div>

    <div id="status-container">
      <p id="status-message"></p>
      <p id="extraction-details"></p>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

#### CSS Updates (`popup/popup.css`)

We'll need to add styles for the new form elements:

```css
/* Add these to the existing popup.css file */

textarea {
  width: 100%;
  min-height: 120px;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  resize: vertical;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.instructions {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.instructions h2 {
  margin-top: 0;
  font-size: 16px;
}

.instructions ol {
  padding-left: 20px;
  margin-bottom: 0;
}

.parsing-options {
  margin-bottom: 15px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 5px;
}

.radio-group label {
  font-weight: normal;
  margin-left: 5px;
}
```

## 3. JavaScript Updates

### Popup JS Updates (`popup/popup.js`)

```javascript
// Global variables to store extracted data
let extractedData = null;

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const titleInput = document.getElementById('research-title');
  const contentArea = document.getElementById('content-area');
  const sourcesArea = document.getElementById('sources-area');
  const processButton = document.getElementById('process-button');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');
  const extractionDetails = document.getElementById('extraction-details');
  const basicParsingRadio = document.getElementById('basic-parsing');
  const enhancedParsingRadio = document.getElementById('enhanced-parsing');

  // Setup event listeners
  processButton.addEventListener('click', () => processContent(
    titleInput.value,
    contentArea.value,
    sourcesArea.value,
    basicParsingRadio.checked ? 'basic' : 'enhanced'
  ));

  saveButton.addEventListener('click', saveContent);

  // Disable process button if both text areas are empty
  function updateButtonState() {
    const hasContent = contentArea.value.trim().length > 0;
    processButton.disabled = !hasContent;
  }

  contentArea.addEventListener('input', updateButtonState);
  sourcesArea.addEventListener('input', updateButtonState);

  // Initial button state
  updateButtonState();
});

// Function to process the pasted content
async function processContent(title, contentText, sourcesText, parsingMethod) {
  try {
    // Validate inputs
    if (!contentText.trim()) {
      handleError('Main content is required. Please paste the research content.');
      return;
    }

    // Use title or fallback
    const researchTitle = title.trim() || 'Untitled Research';

    // Update UI
    statusMessage.textContent = 'Processing content...';
    statusMessage.style.color = '#1a73e8';
    processButton.disabled = true;

    // Send message to background script for processing
    chrome.runtime.sendMessage(
      {
        action: 'process',
        data: {
          title: researchTitle,
          content: contentText,
          sources: sourcesText,
          method: parsingMethod,
          date: new Date().toISOString(),
          aiTool: 'Google Gemini'
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          handleError(`Error: ${chrome.runtime.lastError.message}`);
          processButton.disabled = false;
          return;
        }

        if (response.success) {
          extractedData = response.data;
          handleSuccessfulProcessing(extractedData);
        } else {
          handleError(`Error: ${response.error}`);
          processButton.disabled = false;
        }
      }
    );
  } catch (error) {
    handleError(`Error: ${error.message}`);
    processButton.disabled = false;
  }
}

// Function to save content locally
function saveContent() {
  // Reuse the existing save functionality
  // ... (keep the existing save functionality)
}

// Function to handle successful processing
function handleSuccessfulProcessing(data) {
  statusMessage.textContent = 'Processing complete!';
  statusMessage.style.color = '#188038';

  processButton.disabled = false;
  saveButton.disabled = false;

  // Display processing details
  const sourceCount = data.sources ? data.sources.length : 0;
  extractionDetails.textContent = `Extracted ${sourceCount} sources from research on "${data.title}"`;

  // Preview could be added here if desired
}

// Function to handle errors
function handleError(errorMessage) {
  console.error(errorMessage);
  statusMessage.textContent = errorMessage;
  statusMessage.style.color = '#d93025';
}
```

### Background Script Updates (`background.js`)

```javascript
// Import TurndownJS library
importScripts('lib/turndown.js');

// Initialize TurndownJS service
let turndownService;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Research Extractor extension installed');

  // Initialize TurndownJS on install
  initializeTurndown();
});

// Initialize TurndownJS service with custom options
function initializeTurndown() {
  turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  // Add rule to preserve links
  turndownService.addRule('links', {
    filter: 'a',
    replacement: function(content, node) {
      const href = node.getAttribute('href');
      return '[' + content + '](' + href + ')';
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle different message actions
  switch (message.action) {
    case 'process':
      processContent(message.data, sendResponse);
      return true; // Keep the message channel open for asynchronous response

    case 'save':
      saveAsMarkdown(message.data, sendResponse);
      return true; // Keep the message channel open for asynchronous response

    default:
      console.error('Unknown action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Function to process pasted content
async function processContent(data, sendResponse) {
  try {
    // Make sure TurndownJS is initialized
    if (!turndownService) {
      initializeTurndown();
    }

    // Process the main content using custom parsing
    const { processedContent, extractedSources } = parseContent(
      data.content,
      data.sources
    );

    // Convert HTML to Markdown if needed
    let markdownContent = processedContent;
    if (processedContent.includes('<') && processedContent.includes('>')) {
      // It likely contains HTML, convert to markdown
      markdownContent = turndownService.turndown(processedContent);
    }

    // Combine all data
    const processedData = {
      title: data.title,
      content: markdownContent,
      sources: extractedSources,
      date: data.date,
      aiTool: data.aiTool,
      sourceUrl: 'Manual extraction'
    };

    // Send the processed data back to the popup
    sendResponse({ success: true, data: processedData });
  } catch (error) {
    console.error('Error processing content:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to parse pasted content
function parseContent(content, sourcesText) {
  try {
    // Clean up the content
    const cleanedContent = cleanupContent(content);

    // Extract sources from the dedicated sources text
    const extractedSources = extractSources(sourcesText);

    return {
      processedContent: cleanedContent,
      extractedSources: extractedSources
    };
  } catch (error) {
    console.error('Error parsing content:', error);
    throw error;
  }
}

// Function to clean up content
function cleanupContent(rawContent) {
  // Remove extra whitespace
  let cleaned = rawContent.replace(/\n{3,}/g, '\n\n').trim();

  // Handle potential HTML in copied content
  if (cleaned.includes('<div>') || cleaned.includes('<p>') || cleaned.includes('<span>')) {
    // Basic HTML cleanup for common tags
    cleaned = cleaned
      .replace(/<div>/g, '\n')
      .replace(/<\/div>/g, '')
      .replace(/<p>/g, '\n')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<span[^>]*>/g, '')
      .replace(/<\/span>/g, '');
  }

  return cleaned;
}

// Function to extract sources
function extractSources(sourcesText) {
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

// Keep the existing saveAsMarkdown function
// ... (keep the existing save functionality unchanged)
```

## 4. Implementation Steps

1. **Update Manifest.json**
   - Remove content_scripts and host_permissions
   - Test that the extension can still be loaded

2. **Update Popup UI**
   - Implement the new HTML design
   - Add required CSS styles
   - Test the UI layout and responsiveness

3. **Update Popup.js**
   - Implement the new event handlers
   - Add the content processing logic
   - Test form submission and validation

4. **Update Background.js**
   - Add the content parsing functions
   - Ensure TurndownJS integration works
   - Test the complete processing pipeline

5. **Testing**
   - Test with a variety of Gemini content formats
   - Verify source extraction from different citation styles
   - Test Markdown conversion accuracy
   - Verify the save functionality

6. **Phase 2: Enhanced Parsing (Future)**
   - Implement LLM-assisted parsing as described in the parsing_approaches.md document
   - Add API integration with appropriate security
   - Enable the "Enhanced" parsing option in the UI

## 5. Migration Considerations

When updating from the automated approach to the manual copy/paste approach:

1. Users will need to be informed of the change
2. Extension description and Chrome Web Store listing should be updated
3. Consider adding a notification on first use after update to explain the new workflow
4. Maintain backward compatibility with previously saved data

## 6. Validation Criteria

The implementation will be considered successful when:

1. Users can copy and paste content from Gemini pages
2. The extension correctly processes and formats the content
3. The extension correctly extracts sources from pasted sources text
4. The extension generates valid Markdown with Jekyll front matter
5. The save functionality works correctly
6. The extension passes all Chrome Web Store review requirements
