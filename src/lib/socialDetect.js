/**
 * Auto-detect social platform from URL
 * Returns { platform, icon, url } or null
 */
export function detectSocialPlatform(url) {
  if (!url || url.trim() === '') return null

  const urlLower = url.toLowerCase()

  const platforms = {
    instagram: {
      pattern: /instagram\.com|insta\.com/i,
      icon: '📸',
      name: 'Instagram',
    },
    tiktok: {
      pattern: /tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i,
      icon: '🎵',
      name: 'TikTok',
    },
    youtube: {
      pattern: /youtube\.com|youtu\.be/i,
      icon: '🔴',
      name: 'YouTube',
    },
    facebook: {
      pattern: /facebook\.com|fb\.com/i,
      icon: 'f️',
      name: 'Facebook',
    },
    spotify: {
      pattern: /spotify\.com/i,
      icon: '🎧',
      name: 'Spotify',
    },
  }

  for (const [key, config] of Object.entries(platforms)) {
    if (config.pattern.test(urlLower)) {
      return {
        platform: key,
        icon: config.icon,
        name: config.name,
        url: url,
      }
    }
  }

  // Default to website
  return {
    platform: 'website',
    icon: '🔗',
    name: 'Website',
    url: url,
  }
}

/**
 * Parse social links from array of URLs
 * Returns { instagram, tiktok, youtube, facebook, spotify, website }
 */
export function parseSocialLinks(urls) {
  const links = {}

  urls.forEach(url => {
    if (url && url.trim()) {
      const detected = detectSocialPlatform(url)
      if (detected) {
        links[detected.platform] = detected.url
      }
    }
  })

  return links
}

/**
 * Get icons for social links object
 * Returns array of { icon, name, url }
 */
export function getSocialIcons(socialLinks) {
  if (!socialLinks || typeof socialLinks !== 'object') return []

  const iconMap = {
    instagram: { icon: '📸', name: 'Instagram' },
    tiktok: { icon: '🎵', name: 'TikTok' },
    youtube: { icon: '🔴', name: 'YouTube' },
    facebook: { icon: 'f️', name: 'Facebook' },
    spotify: { icon: '🎧', name: 'Spotify' },
    website: { icon: '🔗', name: 'Website' },
  }

  return Object.entries(socialLinks)
    .map(([platform, url]) => ({
      platform,
      icon: iconMap[platform]?.icon || '🔗',
      name: iconMap[platform]?.name || 'Link',
      url,
    }))
    .filter(link => link.url)
}
