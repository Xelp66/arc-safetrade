const DIRECT_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const IBB_HOSTS = new Set(["ibb.co", "www.ibb.co"]);

function hasDirectImageExtension(url: URL) {
  const pathname = url.pathname.toLowerCase();

  return DIRECT_IMAGE_EXTENSIONS.some((extension) => pathname.endsWith(extension));
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractMetaImageUrl(html: string) {
  const metaTagPattern =
    /<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;

  for (const match of html.matchAll(metaTagPattern)) {
    const content = match[1]?.trim();

    if (content) {
      return decodeHtmlEntities(content);
    }
  }

  return null;
}

function isIbbPageUrl(url: URL) {
  return IBB_HOSTS.has(url.hostname.toLowerCase());
}

export async function normalizeImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (hasDirectImageExtension(parsedUrl)) {
      return url;
    }

    if (!isIbbPageUrl(parsedUrl)) {
      return url;
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "user-agent": "SafeTradeBot/1.0",
      },
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return url;
    }

    const html = await response.text();
    const extractedUrl = extractMetaImageUrl(html);

    if (!extractedUrl) {
      return url;
    }

    const normalizedUrl = new URL(extractedUrl, parsedUrl).toString();
    return normalizedUrl;
  } catch {
    return url;
  }
}
