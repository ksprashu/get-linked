/**
 * AI Research Extractor - Google Gemini Content Script
 *
 * This script extracts research content and sources from Google Gemini Deep Research pages.
 */

// Execute on page load
(function() {
  console.log('AI Research Extractor: Gemini content script loaded');
  // Define the extraction function globally so it can be called via executeScript
  window.extractGeminiResearch = extractGeminiResearch;
})();

/**
 * Main function to extract research content from Google Gemini Deep Research
 * @returns {Object} Object containing title, content, and sources
 */
function extractGeminiResearch() {
  try {
    // Extract the research title/query
    const title = extractTitle();

    // Extract the main content
    const content = extractContent();

    // Extract source links
    const sources = extractSources();

    return {
      title,
      content,
      sources
    };
  } catch (error) {
    console.error('Error extracting Gemini research:', error);
    return null;
  }
}

/**
 * Extract the title/query from the page
 * @returns {string} The research title or query
 */
function extractTitle() {
  // Try different possible selectors for the title
  // First check if we can find the prompt input
  const promptElement = document.querySelector('[aria-label="Prompt input"]');
  if (promptElement) {
    return promptElement.textContent.trim();
  }

  // Try to get the first query message in the conversation
  const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
  if (userMessages && userMessages.length > 0) {
    return userMessages[0].textContent.trim();
  }

  // Fallback to the page title if we can't find a better title
  return document.title.replace(' - Google Gemini', '').trim();
}

/**
 * Extract the main content of the research
 * @returns {string} HTML content of the research
 */
function extractContent() {
  // Find the model response container
  const responseContainer = document.querySelector('[data-message-author-role="model"]');

  if (!responseContainer) {
    throw new Error('Could not find model response container');
  }

  // Clone the response to avoid modifying the original page
  const contentClone = responseContainer.cloneNode(true);

  // Process the content (remove unnecessary elements, format, etc.)
  cleanupContent(contentClone);

  // Return the HTML content as a string
  return contentClone.innerHTML;
}

/**
 * Clean up the extracted content
 * @param {HTMLElement} contentElement - The content element to clean up
 */
function cleanupContent(contentElement) {
  // Remove any interaction elements (buttons, etc.)
  const interactionElements = contentElement.querySelectorAll('button, [role="button"]');
  interactionElements.forEach(element => element.remove());

  // Remove any empty paragraphs or divs
  const emptyElements = contentElement.querySelectorAll('p:empty, div:empty');
  emptyElements.forEach(element => element.remove());

  // Ensure proper code formatting
  const codeBlocks = contentElement.querySelectorAll('pre, code');
  codeBlocks.forEach(codeBlock => {
    // Add specific class for Markdown conversion
    codeBlock.classList.add('code-block');

    // Clean up code formatting
    codeBlock.innerHTML = codeBlock.innerHTML
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+$/gm, ''); // Remove trailing whitespace
  });
}

/**
 * Extract sources from the research
 * @returns {Array} Array of source objects with title and url
 */
function extractSources() {
  const sources = [];

  // Find source links - they might be in a dedicated sources section or inline
  const allLinks = document.querySelectorAll('a[href^="http"]');

  allLinks.forEach(link => {
    // Check if it's a citation link (might have specific attributes or classes)
    // For Google Gemini, links that are citations often have specific patterns
    const isSourceLink =
      // Check for common source link patterns
      link.href.includes('scholar.google.com') ||
      link.href.includes('doi.org') ||
      link.href.match(/\.(pdf|edu|gov|org)($|\/)/) ||
      // Check if the link has a citation number
      link.textContent.match(/^\[\d+\]$/) ||
      link.getAttribute('data-citation-link') === 'true' ||
      link.closest('[data-research-source]');

    if (isSourceLink) {
      // Extract source info
      sources.push({
        title: link.textContent.trim() || new URL(link.href).hostname,
        url: link.href
      });
    }
  });

  // Try to find a dedicated sources section (Gemini often shows a "Sources" heading)
  const sourcesHeading = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .find(heading => heading.textContent.trim().match(/^sources$/i));

  if (sourcesHeading) {
    // Get links that appear after the sources heading
    let nextElement = sourcesHeading.nextElementSibling;

    while (nextElement && !nextElement.matches('h1, h2, h3, h4, h5, h6')) {
      const sourceLinks = nextElement.querySelectorAll('a[href^="http"]');

      sourceLinks.forEach(link => {
        // Check if we already have this source
        const isDuplicate = sources.some(source => source.url === link.href);

        if (!isDuplicate) {
          sources.push({
            title: link.textContent.trim() || new URL(link.href).hostname,
            url: link.href
          });
        }
      });

      nextElement = nextElement.nextElementSibling;
    }
  }

  return sources;
}
