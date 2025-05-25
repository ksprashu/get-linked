# AI Research Extractor - Implementation Notes

## Overview

This document provides a comprehensive record of our implementation process for the AI Research Extractor Chrome extension, focusing on the challenges encountered and solutions implemented.

## Latest Update: Side Panel Implementation

To address the issue of the popup closing when users switch back to the webpage to copy content, we've implemented a Chrome Side Panel approach:

- Modified the extension to use Chrome's Side Panel API instead of a popup
- The side panel remains open while users browse and copy content from Gemini
- Users can now copy content from the webpage and paste it into the side panel without losing their progress

This implementation provides a much better user experience for the copy/paste workflow, as the interface stays visible and accessible while browsing.

### Side Panel Implementation Details

1. **Manifest Changes**:
   - Added the `"sidePanel"` permission
   - Added the `"side_panel"` key with `"default_path": "popup/popup.html"`
   - Removed the `"default_popup"` property from the `"action"` key

2. **Background Script Changes**:
   - Added a listener for `chrome.action.onClicked` to open the side panel
   - Used `chrome.sidePanel.open()` and `chrome.sidePanel.setOptions()` to display the panel

3. **UI Adjustments**:
   - Modified CSS to better utilize the side panel's dimensions
   - Increased textarea heights to make better use of vertical space
   - Updated instructions to explain the side panel workflow

4. **Benefits**:
   - The side panel remains open while users navigate between pages
   - Users can copy content from Gemini and paste it into the extension without losing their progress
   - The side panel provides more vertical space for content and sources

## Initial Approach and Challenges

### Original Implementation

The original implementation used a direct scripting approach:
- Used `host_permissions` to access Gemini pages
- Injected content scripts via `content_scripts` in manifest.json
- Used `chrome.scripting.executeScript` to extract content directly from the page

### Primary Challenge

The extension encountered an "Error: This page cannot be scripted due to an ExtensionsSettings policy" when trying to execute scripts on `https://gemini.google.com/app/*` pages. This error persisted despite having the appropriate permissions in the manifest:

```json
"permissions": ["activeTab", "scripting"],
"content_scripts": [
  {
    "matches": ["https://gemini.google.com/app/*"],
    "js": ["content-scripts/gemini.js"]
  }
]
```

### Failed Attempts

1. **Explicit Host Permissions**:
   - We tried replacing `activeTab` with explicit `host_permissions` for the Gemini domain
   - This approach still resulted in the same policy error
   - The error appears to be enforced at a deeper level than manifest permissions

2. **Different Scripting Methods**:
   - Attempted using different methods to inject scripts
   - Tried both content scripts and background script injection
   - All methods were blocked by the same policy restriction

## Successful Solution: Copy/Paste Approach

To bypass the ExtensionsSettings policy restriction, we implemented a user-initiated copy/paste workflow:

### 1. Manifest Changes

Removed the problematic permissions and content scripts:

```json
// Removed these sections
"host_permissions": [
  "https://gemini.google.com/app/*"
],
"content_scripts": [
  {
    "matches": ["https://gemini.google.com/app/*"],
    "js": ["content-scripts/gemini.js"]
  }
]
```

Kept only the necessary permissions:

```json
"permissions": [
  "scripting"
]
```

### 2. UI Redesign

Created a new user interface that:
- Provides clear instructions for users
- Includes separate areas for pasting main content and sources
- Offers a field for entering the research title
- Includes options for different parsing methods (basic/enhanced)

### 3. Content Parsing Implementation

Implemented custom parsing logic that:
- Cleans up pasted content (handling HTML if present)
- Extracts URLs and titles from the sources text
- Converts content to properly formatted Markdown
- Preserves the original save functionality

### 4. Parsing Approaches

We documented two main parsing approaches:

1. **Custom Parsing** (Implemented):
   - Uses regex and string manipulation to clean content and extract sources
   - Works offline and doesn't require external services
   - Faster processing with immediate results
   - May be less adaptable to variations in content format

2. **LLM-Assisted Parsing** (Future Enhancement):
   - Would leverage AI models to intelligently extract content
   - More adaptable to different content formats
   - Better at understanding context and relationships
   - Requires API integration and has associated costs

## Alternative Approaches Considered

### 1. Bookmarklet Approach

A JavaScript bookmarklet could be used instead of a Chrome extension:
- Would run in the user's context, potentially bypassing some restrictions
- Limited functionality compared to an extension
- No persistent storage or background processing
- Would require manual installation by users

### 2. Standalone Application

A separate desktop application could be developed:
- Would use browser automation (Selenium/Puppeteer) to extract content
- Runs outside Chrome's extension system
- Not subject to the same policy restrictions
- More complex to develop and distribute
- Requires installation outside the Chrome Web Store

### 3. Official API Integration

If Google provides an official API for Gemini:
- Could restructure as an API client rather than a scraper
- Would be officially supported and less likely to break
- May have rate limits or costs associated
- Currently no public API available for this purpose

## Implementation Details

### Files Modified

1. **manifest.json**:
   - Removed `host_permissions` and `content_scripts` sections
   - Kept `scripting` permission for potential future needs

2. **popup.html**:
   - Completely redesigned for the copy/paste workflow
   - Added instructions, form fields, and parsing options

3. **popup.css**:
   - Added styles for the new UI elements
   - Increased container width to accommodate the larger UI

4. **popup.js**:
   - Removed the check for being on a Gemini page
   - Added event listeners for the new UI elements
   - Implemented content processing functionality

5. **background.js**:
   - Added content parsing functionality
   - Implemented source extraction logic
   - Kept the existing save functionality

### New Files Created

1. **docs/parsing_approaches.md**:
   - Detailed analysis of different parsing approaches
   - Comparison of custom vs. LLM-assisted parsing
   - Implementation recommendations

2. **docs/implementation_plan_copy_paste.md**:
   - Step-by-step plan for implementing the copy/paste approach
   - Code samples for each component
   - Testing and validation criteria

3. **docs/implementation_notes.md** (this file):
   - Documentation of implementation process
   - Record of challenges and solutions
   - Alternative approaches considered

## Future Enhancements

1. **Enhanced Parsing**:
   - Implement LLM-assisted parsing as an optional feature
   - Add API integration with appropriate security
   - Enable the "Enhanced" parsing option in the UI

2. **Improved Source Extraction**:
   - Enhance the source extraction logic to handle more formats
   - Add support for academic citation formats
   - Implement better title extraction from source lines

3. **User Experience Improvements**:
   - Add a preview of the processed content
   - Implement drag-and-drop for content pasting
   - Add keyboard shortcuts for common actions

4. **NotebookLM Integration**:
   - Implement the NotebookLM integration as specified in requirements
   - Add source deduplication against existing notebook sources
   - Handle the 100-source limit gracefully

## Lessons Learned

1. **Google's Policy Restrictions**:
   - Google has implemented strict policy restrictions on scripting certain pages
   - These restrictions cannot be bypassed with manifest permissions alone
   - User-initiated workflows are more likely to be allowed

2. **Content Extraction Approaches**:
   - Direct scripting is powerful but subject to platform restrictions
   - Copy/paste approaches are more reliable but require user interaction
   - Parsing complexity increases with varied content formats

3. **Extension Design Considerations**:
   - Clear user instructions are essential for manual workflows
   - Feedback on processing status helps user confidence
   - Fallback mechanisms ensure functionality despite limitations

## Conclusion

The copy/paste approach successfully bypasses Google's ExtensionsSettings policy restriction while still providing the core functionality required. While it requires more user interaction than the original automated approach, it offers a reliable solution that should continue to work regardless of policy changes.

This implementation maintains all the key requirements:
- Extraction of research content and sources
- Markdown formatting with Jekyll front matter
- Local saving of extracted content
- Foundation for future enhancements

By thoroughly documenting our implementation process, challenges, and alternatives, we've created a valuable reference for future development and troubleshooting.
