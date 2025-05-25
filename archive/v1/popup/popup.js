// Global variables to store extracted data
let extractedData = null;
let turndownService;

// DOM elements
let titleInput;
let contentArea;
let sourcesArea;
let processButton;
let saveButton;
let statusMessage;
let extractionDetails;
let basicParsingRadio;
let enhancedParsingRadio;

// Initialize TurndownJS service
function initializeTurndown() {
  console.log('Attempting to initialize TurndownService...');
  try {
    if (typeof TurndownService === 'undefined') {
      console.error('TurndownService is UNDEFINED. Check if turndown.js is loaded correctly.');
      statusMessage.textContent = 'Error: Markdown library failed to load.';
      statusMessage.style.color = '#d93025';
      processButton.disabled = true; // Disable processing if library fails
      saveButton.disabled = true;
      return;
    }
    // Initialize with default options and NO custom rules for this test
    turndownService = new TurndownService();
    console.log('TurndownService instantiated (with default options):', turndownService);

    // // Add rule to preserve links (Temporarily REMOVED for testing)
    // console.log('Attempting to add "links" rule...');
    // turndownService.addRule('links', {
    //   filter: 'a',
    //   replacement: function(content, node) {
    //     const href = node.getAttribute('href');
    //     // Ensure content is a string, sometimes it might not be if 'a' tag is empty or contains complex children
    //     const textContent = typeof content === 'string' ? content : node.textContent || '';
    //     return '[' + textContent.trim() + '](' + href + ')';
    //   }
    // });
    // console.log('"links" rule added successfully.');

  } catch (error) {
    console.error('Error during TurndownJS initialization or rule adding:', error);
    statusMessage.textContent = 'Error initializing Markdown converter: ' + error.message;
    statusMessage.style.color = '#d93025';
    if(processButton) processButton.disabled = true;
    if(saveButton) saveButton.disabled = true;
    turndownService = null; // Ensure service is null if init fails
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  titleInput = document.getElementById('research-title');
  contentArea = document.getElementById('content-area');
  sourcesArea = document.getElementById('sources-area');
  processButton = document.getElementById('process-button');
  saveButton = document.getElementById('save-button');
  statusMessage = document.getElementById('status-message');
  extractionDetails = document.getElementById('extraction-details');
  basicParsingRadio = document.getElementById('basic-parsing');
  enhancedParsingRadio = document.getElementById('enhanced-parsing');

  // Initialize TurndownJS
  initializeTurndown();

  // Test TurndownJS immediately after initialization
  if (turndownService) {
    try {
      // Even simpler test: just plain text
      const testMarkdownPlainText = turndownService.turndown('Plain text test');
      console.log('Post-initialization Turndown plain text test:', testMarkdownPlainText);
      if (testMarkdownPlainText !== 'Plain text test') {
          console.error('Post-initialization Turndown plain text test FAILED. Expected "Plain text test", got:', testMarkdownPlainText);
          statusMessage.textContent = 'Markdown converter plain text test failed.';
          statusMessage.style.color = '#d93025';
      } else {
          console.log('Post-initialization Turndown plain text test SUCCEEDED.');
      }

      // Original simple HTML test
      const testMarkdownHTML = turndownService.turndown('<h3>Simple HTML Test</h3><p>Works!</p>');
      console.log('Post-initialization Turndown HTML test:', testMarkdownHTML);
      if (!testMarkdownHTML || testMarkdownHTML.trim() === '') {
          console.error('Post-initialization Turndown HTML test FAILED to produce output.');
          if (statusMessage.textContent === '') { // Don't overwrite a more specific error
            statusMessage.textContent = 'Markdown converter HTML test failed post-init.';
            statusMessage.style.color = '#d93025';
          }
      } else {
        console.log('Post-initialization Turndown HTML test SUCCEEDED.');
      }
    } catch (e) {
      console.error('Error during post-initialization Turndown test:', e);
      statusMessage.textContent = 'Markdown converter error post-init: ' + e.message;
      statusMessage.style.color = '#d93025';
    }
  } else {
    console.error('TurndownService is null after initialization attempt.');
  }

  // Setup event listeners
  processButton.addEventListener('click', () => processContent(
    titleInput.value,
    basicParsingRadio.checked ? 'basic' : 'enhanced'
  ));

  saveButton.addEventListener('click', saveContent);

  // Disable process button if content area is empty
  function updateButtonState() {
    // For contenteditable divs, use innerHTML instead of value
    const hasContent = contentArea.innerHTML &&
                      contentArea.innerHTML.trim() !== '' &&
                      contentArea.innerHTML.trim() !== '<br>';
    processButton.disabled = !hasContent;
  }

  // Handle paste event for content area
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

    // Update button state after paste
    updateButtonState();
  });

  // Handle paste event for sources area - special handling to match Gemini format
  sourcesArea.addEventListener('paste', (e) => {
    // Prevent default paste behavior
    e.preventDefault();

    // Get clipboard data
    const clipboardData = e.clipboardData || window.clipboardData;

    // Get HTML content if available
    let htmlContent = clipboardData.getData('text/html');

    // Process the HTML to better match Gemini format
    if (htmlContent) {
      // Clean up Gemini's complex HTML structure but preserve links and images
      htmlContent = cleanGeminiHTML(htmlContent);
    } else {
      // Fallback to plain text if HTML is not available
      htmlContent = clipboardData.getData('text/plain');
      // Convert plain text to HTML (basic formatting)
      htmlContent = htmlContent.replace(/\n/g, '<br>');
    }

    // Insert content at cursor position
    document.execCommand('insertHTML', false, htmlContent);

    // Update button state after paste
    updateButtonState();
  });

  // Helper function to clean up Gemini HTML but preserve important elements
  function cleanGeminiHTML(html) {
    // First, remove any scripts that might be in the pasted content
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Find the source list container if it exists
    const sourceListMatch = html.match(/<deep-research-source-lists[^>]*>([\s\S]*?)<\/deep-research-source-lists>/i);

    if (sourceListMatch && sourceListMatch[1]) {
      // We found the source list container, extract just the browse-web-item elements
      let sourceListHtml = sourceListMatch[1];

      // Extract all browse-web-item elements
      const browseWebItems = [];
      const browseWebItemPattern = /<browse-web-item[^>]*>[\s\S]*?<\/browse-web-item>/gi;
      let browseMatch;

      while ((browseMatch = browseWebItemPattern.exec(sourceListHtml)) !== null) {
        browseWebItems.push(browseMatch[0]);
      }

      if (browseWebItems.length > 0) {
        // Process each browse-web-item to extract the link and icon
        let cleanHTML = '';

        browseWebItems.forEach(item => {
          // Extract the link
          const linkMatch = item.match(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);

          if (linkMatch) {
            const url = linkMatch[1];

            // Extract the icon if present
            const iconMatch = item.match(/<img[^>]*src=["']([^"']*)["'][^>]*class=["']favicon["'][^>]*>/i);
            const iconSrc = iconMatch ? iconMatch[1] : null;

            // Extract the title (domain name and sub-title)
            const domainMatch = item.match(/data-test-id=["']domain-name["'][^>]*>([\s\S]*?)<\/div>/i);
            const subtitleMatch = item.match(/data-test-id=["']sub-title["'][^>]*>([\s\S]*?)<\/div>/i);

            const domain = domainMatch ? domainMatch[1].trim() : '';
            const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';

            // Create a clean item that mimics Gemini's format
            cleanHTML += `<div class="source-item">`;

            // Add icon if found and not a favicon
            if (iconSrc && !iconSrc.includes('faviconV2')) {
              cleanHTML += `<img src="${iconSrc}" alt="Icon" class="source-icon">`;
            }

            // Add link with domain and subtitle
            cleanHTML += `<a href="${url}" target="_blank" class="source-link">`;
            if (domain) {
              cleanHTML += `<div class="source-domain">${domain}</div>`;
            }
            if (subtitle && subtitle !== domain) {
              cleanHTML += `<div class="source-title">${subtitle}</div>`;
            }
            cleanHTML += `</a>`;

            cleanHTML += `</div>`;
          }
        });

        return cleanHTML;
      }
    }

    // If we couldn't find or process the source list, fall back to extracting links
    const linkPattern = /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let fallbackHTML = '';

    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1];
      let title = match[2].replace(/<[^>]*>/g, '').trim();

      // Skip if it's just "Opens in a new window"
      if (title === "Opens in a new window" || !url.startsWith('http')) continue;

      // Create a simple link
      fallbackHTML += `<div class="source-item">`;
      fallbackHTML += `<a href="${url}" target="_blank" class="source-link">${title || url}</a>`;
      fallbackHTML += `</div>`;
    }

    return fallbackHTML;
  }

  contentArea.addEventListener('input', updateButtonState);
  sourcesArea.addEventListener('input', updateButtonState);

  // Initial button state
  updateButtonState();
});

// Function to process the pasted content
async function processContent(title, parsingMethod) {
  try {
    // Get content from the contenteditable divs
    const contentHTML = contentArea.innerHTML;
    const sourcesHTML = sourcesArea.innerHTML;

    // Validate inputs
    if (!contentHTML.trim() || contentHTML === '<br>') { // Check for empty or just a line break
      handleError('Main content is required. Please paste the research content.');
      return;
    }

    // Use title or fallback
    const researchTitle = title.trim() || 'Untitled Research';

    // Update UI
    statusMessage.textContent = 'Processing content...';
    statusMessage.style.color = '#1a73e8';
    document.getElementById('process-button').disabled = true;

    // Debug content
    console.log("Original contentHTML (from contentArea.innerHTML):", contentHTML);
    console.log("Original contentHTML length:", contentHTML.length);

    // --- Drastic Simplification Test ---
    // For this test, we are IGNORING the actual contentHTML and using a very simple hardcoded string.
    let simplifiedHTML = `
<h2>Test Heading</h2>
<p>This is a simple paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<ul><li>Item 1</li><li>Item 2</li></ul>
`;
    console.log("Simplified HTML (Hardcoded for Test):", simplifiedHTML);
    console.log("Simplified HTML length (Hardcoded for Test):", simplifiedHTML.length);
    // --- End Drastic Simplification Test ---

    // Convert the hardcoded simplified HTML to Markdown
    const markdownContent = turndownService.turndown(simplifiedHTML);

    // Debug the markdown conversion
    console.log("Markdown content after conversion:", markdownContent);
    console.log("Markdown content length:", markdownContent.length);

    // Send message to background script for processing
    chrome.runtime.sendMessage(
      {
        action: 'process',
        data: {
          title: researchTitle,
          content: markdownContent, // Send Markdown content instead of HTML
          sources: sourcesHTML, // Send the HTML sources to preserve links
          method: parsingMethod,
          date: new Date().toISOString(),
          aiTool: 'Google Gemini'
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          handleError(`Error: ${chrome.runtime.lastError.message}`);
          document.getElementById('process-button').disabled = false;
          return;
        }

        if (response.success) {
          extractedData = response.data;
          handleSuccessfulProcessing(extractedData);
        } else {
          handleError(`Error: ${response.error}`);
          document.getElementById('process-button').disabled = false;
        }
      }
    );
  } catch (error) {
    handleError(`Error: ${error.message}`);
    document.getElementById('process-button').disabled = false;
  }
}

// Function to save content locally
async function saveContent() {
  if (!extractedData) {
    handleError('No data to save. Please process content first.');
    return;
  }

  try {
    // Debug extractedData
    console.log("extractedData being sent to save:", extractedData);
    console.log("extractedData.content type:", typeof extractedData.content);
    console.log("extractedData.content length:", extractedData.content ? extractedData.content.length : 0);

    // Update UI
    statusMessage.textContent = 'Saving research content...';
    document.getElementById('save-button').disabled = true;

    // First get the prepared markdown from the background script
    chrome.runtime.sendMessage(
      { action: 'save', data: extractedData },
      async (response) => {
        if (chrome.runtime.lastError) {
          handleError(`Error saving: ${chrome.runtime.lastError.message}`);
          document.getElementById('save-button').disabled = false;
          return;
        }

        if (response.success) {
          try {
            // Handle the file saving in the popup, where window is available
            const options = {
              types: [
                {
                  description: 'Markdown Files',
                  accept: { 'text/markdown': ['.md'] },
                },
              ],
              suggestedName: response.suggestedFilename
            };

            // Use the File System Access API to save the file
            const fileHandle = await window.showSaveFilePicker(options);
            const writable = await fileHandle.createWritable();
            await writable.write(response.markdown);
            await writable.close();

            // Update UI for success
            statusMessage.textContent = 'Research saved successfully!';
            statusMessage.style.color = '#188038';
            document.getElementById('extraction-details').textContent = `Saved to: ${fileHandle.name}`;
          } catch (error) {
            // Handle file picking errors
            if (error.name === 'AbortError') {
              statusMessage.textContent = 'Save operation was canceled.';
              statusMessage.style.color = '#5f6368';  // Grey color for cancel
            } else {
              handleError(`Error saving file: ${error.message}`);
            }
            document.getElementById('save-button').disabled = false;
          }
        } else {
          handleError(`Error preparing markdown: ${response.error}`);
          document.getElementById('save-button').disabled = false;
        }
      }
    );
  } catch (error) {
    handleError(`Error saving: ${error.message}`);
    document.getElementById('save-button').disabled = false;
  }
}

// Function to handle successful processing
function handleSuccessfulProcessing(data) {
  statusMessage.textContent = 'Processing complete!';
  statusMessage.style.color = '#188038';

  document.getElementById('process-button').disabled = false;
  document.getElementById('save-button').disabled = false;

  // Display processing details
  const sourceCount = data.sources ? data.sources.length : 0;
  document.getElementById('extraction-details').textContent =
    `Extracted ${sourceCount} sources from research on "${data.title}"`;
}

// Function to handle errors
function handleError(errorMessage) {
  console.error(errorMessage);
  statusMessage.textContent = errorMessage;
  statusMessage.style.color = '#d93025';
}
