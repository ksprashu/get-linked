# Implementation Plan: AI Research Extractor Chrome Extension

## 1. Introduction

This document outlines the plan for implementing the AI Research Extractor Chrome Extension, based on the Requirements Document (`docs/requirements.md`) and the Design Document (`docs/design_document.md`). It breaks down the work into phases and tasks.

## 2. Development Phases & Milestones

The implementation will proceed in logical phases to deliver core functionality early and build upon it.

### Phase 1: Core Extraction & Local Markdown Saving (MVP)

*   **Goal:** Implement basic extraction for one AI tool (e.g., Gemini) and save the content as a Markdown file locally.
*   **Milestone:** User can extract research from Gemini and save a formatted Markdown file with Jekyll front matter to their local machine.

### Phase 2: Multi-Tool Extraction & CSV Link Saving

*   **Goal:** Extend extraction to support OpenAI and Grok. Implement saving of source links to a persistent local CSV file.
*   **Milestone:** User can extract from all three supported AI tools. Extracted links are correctly appended to a user-chosen CSV file on subsequent saves.

### Phase 3: NotebookLM Integration (Manual Flow)

*   **Goal:** Implement the user flow for preparing links for manual addition to NotebookLM.
*   **Milestone:** User can click a button after extraction to get a formatted list of source links (including the article link) ready to be copied and pasted into NotebookLM.

### Phase 4: Refinements & Testing

*   **Goal:** Improve error handling, refine UI/UX based on testing, add link selection for NotebookLM (optional, based on FR-17), and conduct thorough testing across all tools.
*   **Milestone:** A stable, well-tested extension meeting all core requirements.

## 3. Task Breakdown

*(Note: Estimates are rough and assume a single developer)*

### Phase 1 Tasks:

*   **T1.1:** Setup Chrome Extension project structure (manifest.json v3, background script, popup files). (0.5 days)
*   **T1.2:** Implement basic Popup UI (HTML, CSS, JS) with "Extract" button and status area. (0.5 days)
*   **T1.3:** Implement Background Script listener for popup messages. (0.5 days)
*   **T1.4:** Develop Content Script for **Gemini**: DOM parsing logic to extract HTML content, links, and title. (1.5 days)
*   **T1.5:** Implement messaging: Popup -> Background -> Content -> Background. (0.5 days)
*   **T1.6:** Integrate HTML-to-Markdown library (e.g., Turndown) in Background Script. (0.5 days)
*   **T1.7:** Implement File System Access API logic in Background Script for saving Markdown file (including front matter generation). (1 day)
*   **T1.8:** Connect "Save Locally" button in Popup to trigger Markdown save logic. (0.5 days)
*   **T1.9:** Basic testing of Phase 1 functionality. (0.5 days)
    *   *Phase 1 Estimated Total: ~6 days*

### Phase 2 Tasks:

*   **T2.1:** Develop Content Script logic for **OpenAI Deep Research**: DOM parsing. (1 day)
*   **T2.2:** Develop Content Script logic for **Grok Deep Research**: DOM parsing. (1 day)
*   **T2.3:** Refactor Content Script to handle logic for all three tools based on URL. (0.5 days)
*   **T2.4:** Implement File System Access API logic for selecting and persistently storing the CSV file handle (`chrome.storage.local`). (1 day)
*   **T2.5:** Implement CSV formatting and appending logic in Background Script. (1 day)
*   **T2.6:** Update "Save Locally" flow to also trigger CSV link appending. (0.5 days)
*   **T2.7:** Testing extraction and saving for all three tools. (1 day)
    *   *Phase 2 Estimated Total: ~6 days*

### Phase 3 Tasks:

*   **T3.1:** Add "Prepare Links for NotebookLM" button and display area to Popup UI. (0.5 days)
*   **T3.2:** Implement logic in Background Script to format the list of links (including source article URL) upon request from Popup. (0.5 days)
*   **T3.3:** Implement messaging for NotebookLM link preparation flow. (0.5 days)
*   **T3.4:** Testing NotebookLM link preparation flow. (0.5 days)
    *   *Phase 3 Estimated Total: ~2 days*

### Phase 4 Tasks:

*   **T4.1:** Implement robust error handling for DOM parsing failures, file saving issues, etc., providing clear feedback to the user via the popup. (1 day)
*   **T4.2:** (Optional) Implement UI for selecting specific links to include in NotebookLM export. (1-2 days)
*   **T4.3:** Refine Popup UI/UX based on usage testing (e.g., clearer status messages, better layout). (1 day)
*   **T4.4:** Comprehensive end-to-end testing across Chrome versions, different AI tool result pages, edge cases (no links, large content, etc.). (2 days)
*   **T4.5:** Code cleanup, commenting, and final documentation review. (1 day)
    *   *Phase 4 Estimated Total: ~5-6 days*

*   **Overall Estimated Total: ~19-20 days**

## 4. Technology Choices

*   **Language:** JavaScript (ES6+)
*   **Extension Manifest:** Version 3
*   **Core APIs:** Chrome Extension APIs (`runtime`, `tabs`, `storage`, `action`, `scripting`), File System Access API
*   **HTML-to-Markdown:** Turndown.js (or similar robust library)
*   **DOM Parsing:** Standard Web APIs (`document.querySelector`, etc.)
*   **Development Environment:** VS Code, standard web development tools.
*   **Version Control:** Git (Repository setup not included in tasks, assumed external)

## 5. Testing Strategy

*   **Manual Testing:** Primary method. Test extraction on various real-world result pages from each supported AI tool. Test saving functionality (Markdown format, front matter, CSV appending). Test NotebookLM link preparation. Test UI responsiveness and error messages.
*   **Cross-Browser Testing:** Focus solely on the latest stable Google Chrome version as per requirements.
*   **Edge Case Testing:** Test with pages having no links, very large content, unusual formatting, failed extractions, file permission denials.
*   **Regression Testing:** After implementing Phases 2 and 3, re-test core functionality from Phase 1. After Phase 4 refinements, test all major features.
*   **(Optional) Unit Testing:** Consider unit tests for specific pure functions (e.g., CSV formatting, front matter generation) if complexity warrants it.

## 6. Deployment / Publishing

*   Publishing to the Chrome Web Store is out of scope for this plan but would involve creating a developer account, packaging the extension, and submitting it for review.
*   For personal use, the extension can be loaded unpacked via Chrome's `chrome://extensions` page.
