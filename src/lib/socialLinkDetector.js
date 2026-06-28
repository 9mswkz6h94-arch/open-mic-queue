export function detectSocialPlatform(url) {
  if (!url) return null

  const urlLower = url.toLowerCase()

  if (urlLower.includes('instagram.com')) return 'instagram'
  if (urlLower.includes('tiktok.com')) return 'tiktok'
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube'
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) return 'facebook'
  if (urlLower.includes('spotify.com')) return 'spotify'
  if (urlLower.includes('bandcamp.com')) return 'bandcamp'
  if (urlLower.includes('soundcloud.com')) return 'soundcloud'
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter'
  if (urlLower.includes('linkedin.com')) return 'linkedin'

  return 'website'
}

export function getPlatformIcon(platform) {
  const icons = {
    instagram: '📸',
    tiktok: '🎵',
    youtube: '🔴',
    facebook: '👥',
    spotify: '🎧',
    bandcamp: '🎸',
    soundcloud: '☁️',
    twitter: '𝕏',
    linkedin: '💼',
    website: '🔗',
  }
  return icons[platform] || '🔗'
}

export function parseSocialLinks(urlString) {
  if (!urlString || !urlString.trim()) return {}

  const urls = urlString.split('\n').map(u => u.trim()).filter(u => u.length > 0)
  const links = {}

  urls.forEach(url => {
    const platform = detectSocialPlatform(url)
    if (platform) {
      // Ensure all URLs have https:// protocol if missing
      let finalUrl = url
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url
      }
      links[platform] = finalUrl
    }
  })

  return links
}
