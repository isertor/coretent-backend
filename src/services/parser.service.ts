// src/services/parser.service.ts
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { EmailParsingError } from '../utils/errors';
import { logger } from '../config/logger';

export interface ParsedEmailContent {
  title: string;
  author: string | null;
  cleanContent: string;
  textContent: string;
  excerpt: string | null;
  estimatedReadTime: number;
  publication: string | null;
}

/**
 * Parse newsletter email HTML content
 */
export async function parseNewsletterEmail(html: string, fromEmail: string): Promise<ParsedEmailContent> {
  try {
    // 1. Create DOM from HTML
    const dom = new JSDOM(html, { url: 'https://example.com' });
    const DOMPurify = createDOMPurify(dom.window as any);

    // 2. Sanitize HTML (remove scripts, tracking pixels)
    const cleanHTML = DOMPurify.sanitize(html, {
      FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'applet'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });

    // 3. Extract article content with Readability
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new EmailParsingError('Failed to parse email content with Readability');
    }

    // 4. Calculate read time (200 words per minute)
    const textContent = article.textContent || '';
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

    // 5. Extract metadata
    const publication = extractPublicationName(html, fromEmail);
    const author = article.byline || extractAuthorFromHTML(html);

    return {
      title: article.title || 'Untitled Newsletter',
      author,
      cleanContent: article.content || cleanHTML,
      textContent: textContent,
      excerpt: article.excerpt || generateExcerpt(textContent),
      estimatedReadTime,
      publication
    };
  } catch (error) {
    logger.error({ error, fromEmail }, 'Email parsing failed');
    throw new EmailParsingError(
      error instanceof Error ? error.message : 'Unknown parsing error'
    );
  }
}

/**
 * Extract publication name from email
 */
function extractPublicationName(html: string, fromEmail: string): string | null {
  // Try to extract from sender domain
  const domain = fromEmail.split('@')[1];
  if (domain) {
    // Remove TLD and return capitalized name
    const name = domain.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Try to extract from HTML meta tags
  const publisherMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"/i);
  if (publisherMatch) {
    return publisherMatch[1];
  }

  return null;
}

/**
 * Extract author from HTML
 */
function extractAuthorFromHTML(html: string): string | null {
  // Try various meta tags
  const patterns = [
    /<meta[^>]*property="article:author"[^>]*content="([^"]+)"/i,
    /<meta[^>]*name="author"[^>]*content="([^"]+)"/i,
    /<meta[^>]*property="og:author"[^>]*content="([^"]+)"/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Generate excerpt from text content
 */
function generateExcerpt(textContent: string, maxLength: number = 200): string {
  const cleaned = textContent.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.slice(0, maxLength).trim() + '...';
}

/**
 * Detect newsletter platform for platform-specific parsing
 */
export function detectNewsletterPlatform(html: string, fromEmail: string): string {
  if (fromEmail.includes('substack.com')) return 'substack';
  if (html.includes('beehiiv')) return 'beehiiv';
  if (html.includes('ghost.io') || html.includes('ghost.org')) return 'ghost';
  if (html.includes('convertkit')) return 'convertkit';
  if (html.includes('mailchimp')) return 'mailchimp';
  if (fromEmail.includes('buttondown.email')) return 'buttondown';
  return 'unknown';
}

/**
 * Extract email content from multipart email
 */
export function extractEmailContent(emailData: any): { html: string; text: string; hasHTML: boolean } {
  const htmlContent = emailData['body-html'] || emailData.html || '';
  const textContent = emailData['body-plain'] || emailData.text || '';

  return {
    html: htmlContent,
    text: textContent,
    hasHTML: !!htmlContent
  };
}
