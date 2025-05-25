# Content Parsing Approaches for AI Research Extractor

## Background

Due to Google's ExtensionsSettings policy preventing direct scripting of Gemini pages, we need to adopt a user-initiated copy/paste approach where users manually copy content and our extension processes it afterwards.

This document explores two main approaches to parsing the pasted content:

1. Custom Parsing Logic
2. LLM-Assisted Parsing
3. Hybrid Approach (combining both methods)

## 1. Custom Parsing Logic

The custom parsing approach involves writing specialized code to process the pasted content from Gemini and extract structured information.

### Implementation Details

#### HTML Cleanup and Conversion
- Handle cases where users paste content with HTML formatting
- Use regex or DOM parsing to clean up HTML tags
- Leverage TurndownJS (already in the project) to convert HTML to Markdown

#### Content Structure Recognition
- Implement pattern recognition for common Gemini output structures:
  - Headings (various levels)
  - Paragraphs and text formatting
  - Lists (ordered and unordered)
  - Code blocks and inline code
  - Blockquotes
- Use regex patterns to identify these elements
- Special handling for academic formatting (citations, footnotes)

#### Source Extraction
- Specialized logic to recognize URLs and source citations
- Parse numbered references (e.g., [1], [2]) and match with source entries
- Extract source metadata (titles, authors) when available

#### Sample Code

```javascript
function parseGeminiContent(rawContent) {
  // Clean up potential HTML formatting
  let content = cleanupHtml(rawContent);

  // Identify and format structural elements
  content = formatStructuralElements(content);

  // Extract inline citations
  const {formattedContent, citations} = extractInlineCitations(content);

  return {
    content: formattedContent,
    citations: citations
  };
}

function parseSourcesList(sourcesText) {
  const sources = [];
  const lines = sourcesText.split('\n').filter(line => line.trim());

  // Try multiple patterns for source references
  const patterns = [
    // [1] Author, Title, URL
    /\[(\d+)\]\s*(.+?)(https?:\/\/[^\s]+)/,
    // 1. Title - URL
    /\d+\.\s+(.+?)\s*[-–—]\s*(https?:\/\/[^\s]+)/,
    // Plain URL with optional text
    /(.*?)(https?:\/\/[^\s]+)/
  ];

  // Process each line to extract sources
  lines.forEach(line => {
    // Implementation details for matching patterns
    // and extracting URLs and titles
  });

  return sources;
}
```

### Pros
- No external dependencies or API requirements
- Works offline completely
- Faster processing with immediate results
- No API costs
- Complete control over parsing logic
- Higher user privacy (no data sent to external services)

### Cons
- Less adaptable to variations in content format
- Requires regular updating if Gemini changes output format
- May miss content structures it wasn't specifically designed to recognize
- More complex code to maintain over time
- Limited by developer's ability to anticipate all possible formats

## 2. LLM-Assisted Parsing

LLM-assisted parsing leverages an AI language model API (like OpenAI's GPT or Anthropic's Claude) to intelligently extract structured content from pasted text.

### Implementation Details

#### API Integration
- Set up connections to an LLM API (OpenAI, Anthropic, Google AI, etc.)
- Implement proper API key management and security
- Handle rate limiting and fallback mechanisms

#### Prompt Engineering
- Create carefully engineered prompts that instruct the LLM to extract information
- Include examples and clear output format requirements
- Design system messages that explain the task clearly

#### Response Processing
- Parse JSON responses from the LLM
- Validate the structure and content of responses
- Implement error handling for malformed responses

#### Sample Code

```javascript
async function parseContentWithLLM(rawContent, sourcesText) {
  // Combine the content and sources for context
  const combinedInput = `MAIN CONTENT:\n${rawContent}\n\nSOURCES LIST:\n${sourcesText}`;

  // Create the LLM API request
  const apiRequest = {
    model: "gpt-4", // or similar model
    messages: [
      {
        role: "system",
        content: `Extract structured information from Gemini research content.
Extract:
1. The main content (preserving markdown formatting)
2. All sources mentioned (with titles and URLs)
3. Ensure inline citations are properly formatted

Return a JSON object with these keys:
- content: The main content as valid markdown
- sources: Array of source objects with title and url properties`
      },
      {
        role: "user",
        content: combinedInput
      }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  };

  // Make API request and process response
  // Implementation details for API call and response handling
}
```

### Pros
- Much more adaptable to different content formats and variations
- Better at understanding context and relationships in the content
- Can handle unforeseen patterns and formats
- Potentially better at extracting embedded sources
- Minimal code maintenance as Gemini formats change
- More intelligent processing of complex academic content

### Cons
- Requires API integration and key management
- Costs associated with API calls
- Requires network connectivity
- Potential privacy concerns with sending content to external APIs
- Higher latency due to API calls
- Subject to API rate limits and potential outages

## 3. Hybrid Approach

A hybrid approach combines the strengths of both methods while mitigating their weaknesses.

### Implementation Details

#### Initial Custom Processing
- Use custom parsing for initial processing
- Extract obvious sources and clean up formatting
- Use direct results if custom parsing is confident

#### LLM Integration
- Fall back to LLM processing if:
  - Custom parsing has low confidence
  - User explicitly requests "intelligent extraction"
  - Content appears complex or non-standard
- Selectively send challenging sections rather than entire content

#### User Choice
- Allow users to choose between:
  - Local processing (faster, works offline)
  - LLM-assisted (more accurate but requires internet)
- Make LLM processing optional and configurable

#### Sample Code

```javascript
async function parseContent(rawContent, sourcesText, options = {}) {
  // Start with custom parsing
  const { content, sources, confidence } = customParse(rawContent, sourcesText);

  // If custom parsing has high confidence or user disabled LLM, return results
  if (confidence > 0.8 || options.disableLlm) {
    return { content, sources };
  }

  // If LLM is enabled and custom parsing has low confidence
  if (options.enableLlm && navigator.onLine) {
    try {
      // Attempt LLM parsing
      const llmResults = await parseContentWithLLM(rawContent, sourcesText);

      // Combine results from both methods
      return {
        content: llmResults.content,
        sources: mergeAndDedupeSources([...sources, ...llmResults.sources])
      };
    } catch (error) {
      console.warn("LLM parsing failed, using custom parsing results:", error);
      return { content, sources };
    }
  }

  // Default fallback to custom parsing
  return { content, sources };
}
```

### Pros
- Works offline with custom parsing
- Enhanced accuracy with optional LLM assistance
- Fallback mechanisms ensure reliability
- Users can choose based on their needs and context
- Cost-effective by only using LLM when necessary

### Cons
- More complex implementation
- Two systems to maintain
- More UI options may confuse users
- Potentially inconsistent results depending on which method is used

## Recommendations

Based on the requirements and considerations for the AI Research Extractor:

1. **Start with a robust custom parsing implementation**
   - Implement core functionality that works offline
   - Focus on handling common Gemini output patterns
   - Use TurndownJS for HTML to Markdown conversion

2. **Add optional LLM-assisted parsing as a premium feature**
   - Implement as an opt-in enhancement
   - Provide clear user control and transparency
   - Offer as a "Pro" or "Enhanced" parsing option

3. **User Experience Considerations**
   - Clearly indicate which parsing method is being used
   - Provide feedback mechanisms for parsing errors
   - Allow easy switching between methods
   - Set appropriate expectations about accuracy

4. **Implementation Phasing**
   - Phase 1: Basic custom parsing with core functionality
   - Phase 2: Enhanced custom parsing with more pattern recognition
   - Phase 3: Optional LLM integration for premium features
   - Phase 4: Full hybrid approach with intelligent switching

This approach provides the best balance of reliability, privacy, cost-effectiveness, and accuracy, while allowing for future enhancements as the project matures.
