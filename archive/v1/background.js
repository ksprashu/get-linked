// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Research Extractor extension installed');
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel
  chrome.sidePanel.open({ tabId: tab.id });

  // Set the side panel to our extension's panel
  chrome.sidePanel.setOptions({
    tabId: tab.id,
    path: 'popup/popup.html',
    enabled: true
  });
});


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
    // Content is now already Markdown (converted in popup.js)
    const markdownContent = data.content;
    const sourcesText = data.sources;

    // Extract sources from the dedicated sources text
    const extractedSources = extractSources(sourcesText);

    // Debug the content
    console.log("Content received from popup:", markdownContent);
    console.log("Content type:", typeof markdownContent);
    console.log("Content length:", markdownContent ? markdownContent.length : 0);

    // Combine all data
    const processedData = {
      title: data.title,
      content: markdownContent, // Already in Markdown format
      sources: extractedSources,
      date: data.date,
      aiTool: data.aiTool,
      sourceUrl: 'Manual extraction'
    };

    // Debug the combined data
    console.log("Combined data:", processedData);

    // Send the processed data back to the popup
    sendResponse({ success: true, data: processedData });
  } catch (error) {
    console.error('Error processing content:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to parse pasted content (no longer needed for main content processing)
// Keeping extractSources as it's still used
// function parseContent(content, sourcesText) {
//   try {
//     // Clean up the content
//     const cleanedContent = cleanupContent(content);

//     // Extract sources from the dedicated sources text
//     const extractedSources = extractSources(sourcesText);

//     return {
//       processedContent: cleanedContent,
//       extractedSources: extractedSources
//     };
//   } catch (error) {
//     console.error('Error parsing content:', error);
//     throw error;
//   }
// }

// Function to clean up content (no longer needed for main content processing)
// function cleanupContent(rawContent) {
//   // Remove extra whitespace
//   let cleaned = rawContent.replace(/\n{3,}/g, '\n\n').trim();

//   // Handle potential HTML in copied content
//   if (cleaned.includes('<div>') || cleaned.includes('<p>') || cleaned.includes('<span>')) {
//     // Basic HTML cleanup for common tags
//     cleaned = cleaned
//       .replace(/<div>/g, '\n')
//       .replace(/<\/div>/g, '')
//       .replace(/<p>/g, '\n')
//       .replace(/<\/p>/g, '\n')
//       .replace(/<br\s*\/?>/g, '\n')
//       .replace(/<span[^>]*>/g, '')
//       .replace(/<\/span>/g, '');
//   }

//   return cleaned;
// }

// Function to extract sources using RegEx to avoid DOM manipulation in service worker
function extractSources(sourcesHtml) {
  if (!sourcesHtml || !sourcesHtml.trim() || sourcesHtml === '<br>') {
    return [];
  }

  console.log("Source HTML to parse:", sourcesHtml);
  const sources = [];

  // Improved regex patterns to handle different link formats
  const patterns = [
    // Standard <a href="URL">TITLE</a> pattern
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:\s+[^>]*?)?>([^<]*)<\/a>/g,

    // Pattern with single quotes
    /<a\s+(?:[^>]*?\s+)?href='([^']*)'(?:\s+[^>]*?)?>([^<]*)<\/a>/g,

    // More permissive pattern for malformed HTML
    /<a[^>]*href=["']?([^"'\s>]+)["']?[^>]*>([^<]+)<\/a>/g
  ];

  let foundLinks = false;

  try {
    // Try each pattern until we find matches
    for (const pattern of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset the regex state

      while ((match = pattern.exec(sourcesHtml)) !== null) {
        foundLinks = true;
        const url = match[1];
        let title = match[2].trim();

        // Skip "Opens in a new window" text
        if (title === "Opens in a new window") {
          continue;
        }

        // If no title, extract from URL
        if (!title) {
          try {
            title = new URL(url).hostname;
          } catch (e) {
            title = "Unknown Source";
          }
        }

        // Add to sources if not a duplicate and it's a valid URL
        const isDuplicate = sources.some(source => source.url === url);
        if (!isDuplicate && url.startsWith('http')) {
          console.log(`Extracted source: ${title} - ${url}`);
          sources.push({
            title: title,
            url: url
          });
        }
      }

      // If we found links with this pattern, we're done
      if (foundLinks) {
        break;
      }
    }
  } catch (error) {
    console.error("Error extracting links:", error);
  }

  // If no sources found with regex or there was an error, try fallback method
  if (sources.length === 0) {
    console.log("No sources found via HTML parsing, trying fallback extraction");

    // Try to extract links using the raw sourcesHtml
    // This is an extremely aggressive pattern to find anything URL-like
    const rawUrlPattern = /https?:\/\/[^\s<>"\{\}\|\\\^~\[\]`]+/g;
    const rawUrls = sourcesHtml.match(rawUrlPattern);

    console.log("Raw URLs found:", rawUrls);

    if (rawUrls && rawUrls.length > 0) {
      // Filter out unwanted URLs like favicons, analytics, etc.
      const filteredUrls = rawUrls.filter(url => {
        // Skip favicon URLs
        if (url.includes('faviconV2') ||
            url.includes('favicon.ico') ||
            url.includes('favicon.png')) {
          return false;
        }

        // Skip gstatic.com URLs (Google's static content servers)
        if (url.includes('gstatic.com')) {
          return false;
        }

        // Skip tracking/analytics URLs
        if (url.includes('tracking') ||
            url.includes('analytics') ||
            url.includes('/pixel/') ||
            url.includes('amp;') ||
            url.includes('&amp;')) {
          return false;
        }

        // Skip image URLs
        if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)($|\?)/i)) {
          return false;
        }

        // Skip resource URLs with many query parameters
        if (url.split('&').length > 3 || url.split('?').length > 2) {
          return false;
        }

        return true;
      });

      console.log("Filtered URLs:", filteredUrls);

      // Process each filtered URL
      filteredUrls.forEach(url => {
        // Clean up the URL
        const cleanUrl = url.replace(/[.,)]$/, '');

        // Try to get a meaningful title from the URL
        let title;
        try {
          const urlObj = new URL(cleanUrl);
          // Use domain or last part of path as title
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          if (pathParts.length > 0) {
            // Use last path segment as title
            title = pathParts[pathParts.length - 1]
              .replace(/[-_]/g, ' ')
              .replace(/\.\w+$/, '') // Remove file extension
              .trim();
          } else {
            // Use hostname as title
            title = urlObj.hostname;
          }
        } catch (e) {
          title = "Unknown Source";
        }

        // Add to sources if not a duplicate
        const isDuplicate = sources.some(source => source.url === cleanUrl);
        if (!isDuplicate) {
          console.log(`Extracted source (filtered): ${title} - ${cleanUrl}`);
          sources.push({
            title: title,
            url: cleanUrl
          });
        }
      });
    } else {
      // Ultimate fallback: process line by line
      const lines = sourcesHtml.split('\n').filter(line => line.trim());

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace(/<[^>]*>/g, ' '); // Strip HTML tags

        // Skip lines that just say "Opens in a new window"
        if (line.includes("Opens in a new window")) {
          continue;
        }

        // Look for URLs in the line
        const urlMatches = line.match(/https?:\/\/[^\s)]+/g);

        if (urlMatches) {
          // Process the URL(s)
          urlMatches.forEach(url => {
            // Clean up the URL
            const cleanUrl = url.replace(/[.,)]$/, '');

            // Extract a title from the same line, if any
            let title = line.replace(cleanUrl, '').trim();

            // Remove common prefixes/formatting
            title = title
              .replace(/^\d+\.\s*/, '') // Remove numbered list markers
              .replace(/^\[\d+\]\s*/, '') // Remove reference markers
              .replace(/^[-•*]\s*/, '') // Remove bullet points
              .trim();

            // If still no title, extract from URL
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
              console.log(`Extracted source (line fallback): ${title} - ${cleanUrl}`);
              sources.push({
                title: title,
                url: cleanUrl
              });
            }
          });
        }
      }
    }
  }

  console.log(`Extracted ${sources.length} sources total`);
  return sources;
}

// Function to prepare markdown content to send back to the popup for saving
function saveAsMarkdown(data, sendResponse) {
  try {
    // Debug the content
    console.log("Content to save:", data.content);
    console.log("Content data type:", typeof data.content);
    console.log("Content length:", data.content ? data.content.length : 0);

    // Create Jekyll front matter
    const frontMatter = `---
title: "${data.title}"
date: ${data.date}
ai_tool: "${data.aiTool}"
source_url: "${data.sourceUrl}"
---

`;

    // Ensure content is properly formatted
    let contentMarkdown = '';
    if (data.content && data.content.trim()) {
      contentMarkdown = data.content + '\n\n';
    } else {
      console.warn("Warning: Content is empty or whitespace only!");
      contentMarkdown = "<!-- No content was provided -->\n\n";
    }

    // Format sources as markdown
    let sourcesMarkdown = '';
    if (data.sources && data.sources.length > 0) {
      sourcesMarkdown = '## Sources\n\n';
      data.sources.forEach(source => {
        sourcesMarkdown += `- [${source.title}](${source.url})\n`;
      });
    }

    // Combine front matter with markdown content and sources
    const fullMarkdown = frontMatter + contentMarkdown + sourcesMarkdown;

    // Debug the full markdown content to be saved
    console.log("FULL MARKDOWN TO SAVE:", fullMarkdown);
    console.log("CONTENT PORTION:", contentMarkdown);
    console.log("SOURCES PORTION:", sourcesMarkdown);

    // Create a safe filename from the title
    const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;

    // Send the prepared markdown back to the popup for saving
    sendResponse({
      success: true,
      markdown: fullMarkdown,
      suggestedFilename: filename
    });
  } catch (error) {
    console.error('Error preparing markdown:', error);
    sendResponse({ success: false, error: error.message });
  }
}
