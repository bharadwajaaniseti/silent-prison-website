import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Configure PDF.js worker
const pdfWorkerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.js',
  import.meta.url
).toString();
GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export interface PaginatedContent {
  pages: string[];
  source: 'pdf' | 'content';
  updatedAt: number;
}

/**
 * Extracts text from a PDF data URL and returns an array of page texts
 */
export async function extractTextFromPdf(
  pdfDataUrl: string
): Promise<{ pages: string[]; updatedAt: number }> {
  try {
    // Load the PDF document
    const loadingTask = getDocument({ url: pdfDataUrl });
    const pdf = await loadingTask.promise;

    // Extract text from each page
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Process text items to reconstruct paragraphs and normalize whitespace
      let pageText = '';
      let lastY = -1;
      
      for (const item of textContent.items as TextItem[]) {
        const text = item.str;
        if (text.trim() === '') continue;
        
        // Check if we need to add a paragraph break
        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n\n';
        }
        
        pageText += text + ' ';
        lastY = item.transform[5];
      }
      
      // Clean up the text (remove extra spaces, normalize line breaks, etc.)
      pageText = pageText
        .replace(/\s+/g, ' ') // Replace multiple spaces with one
        .replace(/\s+\n\s+/g, '\n\n') // Normalize paragraph breaks
        .trim();
        
      pages.push(pageText);
    }

    return {
      pages,
      updatedAt: Date.now()
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Paginates plain text content into pages of roughly equal length,
 * respecting paragraph and sentence boundaries when possible.
 */
export function paginateContent(
  content: string,
  targetCharsPerPage: number = 1800
): { pages: string[]; updatedAt: number } {
  if (!content.trim()) {
    return { pages: [''], updatedAt: Date.now() };
  }

  // First split into paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  const pages: string[] = [];
  let currentPage: string[] = [];
  let currentLength = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // If paragraph is very long, split it into sentences
    if (trimmedPara.length > targetCharsPerPage * 1.5) {
      const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
      
      for (const sentence of sentences) {
        const sentenceWithPara = sentence + '\n\n';
        
        if (currentLength + sentenceWithPara.length > targetCharsPerPage && currentPage.length > 0) {
          pages.push(currentPage.join('\n\n'));
          currentPage = [sentence];
          currentLength = sentence.length;
        } else {
          currentPage.push(sentence);
          currentLength += sentenceWithPara.length;
        }
      }
    } else {
      const paraWithBreaks = trimmedPara + '\n\n';
      
      // If adding this paragraph would exceed the target, start a new page
      if (currentLength + paraWithBreaks.length > targetCharsPerPage && currentPage.length > 0) {
        pages.push(currentPage.join('\n\n'));
        currentPage = [trimmedPara];
        currentLength = trimmedPara.length;
      } else {
        currentPage.push(trimmedPara);
        currentLength += paraWithBreaks.length;
      }
    }
  }

  // Add the last page if it has content
  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n\n'));
  }

  return {
    pages: pages.map(p => p.trim()).filter(p => p.length > 0),
    updatedAt: Date.now()
  };
}

/**
 * Gets paginated content for a chapter, either from cache or by generating it
 */
export async function getPaginatedContent(
  chapterId: number,
  content: string,
  forceRefresh: boolean = false
): Promise<PaginatedContent> {
  const cacheKey = `chapterTextPages:${chapterId}`;
  const pdfKey = `chapterPdf:${chapterId}`;
  
  try {
    // Check if we have a cached version that's still valid
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed: PaginatedContent = JSON.parse(cached);
        
        // If this is PDF content, check if the PDF has been updated
        if (parsed.source === 'pdf') {
          const pdfData = localStorage.getItem(pdfKey);
          if (pdfData) {
            const pdfInfo = JSON.parse(pdfData);
            if (pdfInfo.updatedAt <= parsed.updatedAt) {
              return parsed; // Cache is still valid
            }
          }
        } else if (parsed.source === 'content') {
          // For content, we can use the cache if it exists
          return parsed;
        }
      }
    }
    
    // If we get here, we need to generate the paginated content
    let paginated: Omit<PaginatedContent, 'source'>;
    let source: 'pdf' | 'content';
    
    // Check if there's a PDF for this chapter
    const pdfData = localStorage.getItem(pdfKey);
    if (pdfData) {
      const { data, updatedAt } = JSON.parse(pdfData);
      const dataUrl = `data:application/pdf;base64,${data}`;
      const result = await extractTextFromPdf(dataUrl);
      paginated = { ...result };
      source = 'pdf';
    } else {
      // No PDF, paginate the content
      paginated = paginateContent(content);
      source = 'content';
    }
    
    // Cache the result
    const result: PaginatedContent = {
      ...paginated,
      source
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
    
  } catch (error) {
    console.error('Error getting paginated content:', error);
    
    // Fallback to simple pagination if anything goes wrong
    const fallback = {
      pages: [content],
      source: 'content' as const,
      updatedAt: Date.now()
    };
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(fallback));
    } catch (e) {
      console.error('Failed to cache fallback content:', e);
    }
    
    return fallback;
  }
}

/**
 * Clears the cached paginated content for a chapter
 */
export function clearPaginatedContentCache(chapterId: number): void {
  localStorage.removeItem(`chapterTextPages:${chapterId}`);
}

/**
 * Gets the last viewed page for a chapter
 */
export function getLastViewedPage(chapterId: number): number {
  const key = `reader:page:${chapterId}`;
  const page = localStorage.getItem(key);
  return page ? Math.max(1, parseInt(page, 10)) : 1;
}

/**
 * Saves the last viewed page for a chapter
 */
export function saveLastViewedPage(chapterId: number, page: number): void {
  try {
    localStorage.setItem(`reader:page:${chapterId}`, page.toString());
  } catch (error) {
    console.error('Failed to save last viewed page:', error);
  }
}
