interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
  siteUrl?: string;
}

export const MetadataSeo: React.FC<SEOProps> = ({
  title,
  description,
  image = '/logo_dark.png',
  type = 'website',
  siteName = 'Neusgen',
  siteUrl = window.location.origin,
}) => {
  const canonicalURL = window.location.href;
  const imageURL = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" type="image/png" href="/favicon_blue.png" />
      <link rel="sitemap" href="/sitemap.xml" />
      <link rel="alternate" type="application/rss+xml" title={title} href={`${siteUrl}/rss.xml`} />

      <link rel="canonical" href={canonicalURL} />

      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalURL} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageURL} />
      <meta property="og:site_name" content={siteName} />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalURL} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageURL} />
    </>
  );
};
