# AI Research Extractor: Design Reconsideration

## Current Challenges & User Needs

1. **Formatting Preservation**: The current implementation loses formatting when copying content, but users want to preserve headings, links, tables, etc.

2. **Implementation Constraints**: Google's ExtensionsSettings policy blocks direct page scripting, forcing us to use side panel copy/paste.

3. **User Experience**: The process should be simple, requiring minimal effort to extract and download research content with formatting intact.

## Technical Approaches: Feasibility Analysis

### 1. Enhanced Browser Extension (Current Path)

**Capabilities:**
- Can accept HTML-formatted content when pasted (browsers preserve formatting in clipboard)
- Can process and convert to various formats (Markdown, HTML)
- Works within browser security constraints

**Limitations:**
- Cannot directly interact with page content due to Google's restrictions
- Requires manual copy/paste steps
- Limited to browser capabilities

**Feasibility:** High - We've already implemented most of this

### 2. UI Automation (Selenium/Puppeteer)

**Capabilities:**
- Can automate browser interaction outside browser security constraints
- Could directly extract content from pages
- Could handle formatted content extraction

**Limitations:**
- Requires separate desktop application installation
- Complex setup and dependencies
- Not user-friendly for non-technical users
- Breaks with any Gemini UI changes

**Feasibility:** Medium - More complex implementation, distribution challenges

### 3. Standalone Web Application

**Capabilities:**
- Simple paste interface (similar to our side panel)
- No installation required
- Can process HTML-formatted content

**Limitations:**
- Requires switching between Gemini and the web app
- Still requires manual copy/paste

**Feasibility:** High - Simple to implement and distribute

## UX Considerations

### Ideal User Flow

1. **Minimal Steps**: User should complete the task in as few steps as possible
2. **Context Preservation**: Minimize switching between applications/windows
3. **Format Fidelity**: Maintain the original formatting of the research
4. **Preview & Control**: Let users see what they're getting before finalizing

### Practical UX Implementation

For the browser extension approach:

1. **HTML-Aware Paste Handling**:
   - Capture HTML formatting when content is pasted
   - Preview formatted content as it will appear after processing

2. **Output Format Options**:
   - Markdown (for blogs, GitHub)
   - HTML (for web pages)
   - Plain text (for simple needs)

3. **Visual Feedback**:
   - Show formatted preview of content
   - Clear success/error messages
   - Progress indicators for processing

## Recommended Approach: Enhanced Side Panel Extension

I recommend enhancing our current side panel approach with these improvements:

1. **HTML Formatting Preservation**:
   - Modify the extension to accept and process HTML when pasted
   - Use TurndownJS (already in the project) to convert HTML to well-formatted Markdown
   - Preserve headings, links, tables, and other formatting

2. **Content Preview**:
   - Add a preview tab to show how the formatted content will look
   - Allow switching between raw and processed views

3. **Multiple Export Formats**:
   - Markdown export (current implementation)
   - HTML export (for web publishing)
   - Plain text export (simplified option)

4. **Streamlined UI**:
   - Simplify the form to focus on the essential steps
   - Add clear visual cues for the copy-paste workflow
   - Improve error handling and feedback

This approach:
- Builds on our existing implementation
- Addresses the formatting preservation needs
- Provides a relatively simple user experience
- Works within browser security constraints

## Alternative Approaches

If the browser extension continues to face limitations, we could consider:

1. **Bookmarklet**: A simple JavaScript bookmarklet that users can click when on Gemini pages. This approach avoids Chrome extension restrictions but has limited functionality.

2. **Desktop Application**: A standalone application using Electron with Puppeteer integration for automated extraction. This would provide more power but requires additional installation steps.

3. **Web Service**: A web-based tool where users paste Gemini content (similar to the extension's side panel but hosted on a website). This eliminates installation but requires window switching.

## Design Mockup

```
┌─────────────────────────────────────────────┐
│  AI Research Extractor                      │
├─────────────────────────────────────────────┤
│  [Instructions]                             │
│  1. Copy content from Gemini                │
│  2. Paste below (formatting preserved)      │
│                                             │
├─────────────────────────────────────────────┤
│  Research Title: [___________________]      │
│                                             │
│  Content:                                   │
│  ┌───────────────────────────────────┐      │
│  │                                   │      │
│  │ [HTML-aware paste area]           │      │
│  │                                   │      │
│  └───────────────────────────────────┘      │
│                                             │
│  Sources:                                   │
│  ┌───────────────────────────────────┐      │
│  │                                   │      │
│  │ [Paste sources here]              │      │
│  │                                   │      │
│  └───────────────────────────────────┘      │
│                                             │
│  [Raw] [Preview] <-- Toggle tabs            │
│                                             │
│  Format: (●) Markdown ( ) HTML ( ) Text     │
│                                             │
│  [Process & Preview] [Save As...]           │
│                                             │
└─────────────────────────────────────────────┘
```

## Next Steps

1. **Explore HTML content preservation** in the paste operation
2. **Implement a preview feature** to show formatted content
3. **Add support for multiple export formats**
4. **Refine the UI** to make the workflow more intuitive
5. **Test with real Gemini content** to verify formatting preservation
