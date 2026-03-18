import fs from 'fs-extra';
import path from 'path';

const PLATFORMS = [
  {
    platform: 'youtube',
    name: 'YouTube',
    requiresCookie: false,
    supportsMultiMedia: true,
    domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
    patterns: [/youtube\.com\/watch/, /youtu\.be\//, /youtube\.com\/shorts\//, /youtube\.com\/playlist\//]
  },
  {
    platform: 'youtubemusic',
    name: 'YouTube Music',
    requiresCookie: true,
    supportsMultiMedia: true,
    domains: ['music.youtube.com'],
    patterns: [/music\.youtube\.com\/browse/]
  },
  {
    platform: 'spotify',
    name: 'Spotify',
    requiresCookie: true,
    supportsMultiMedia: true,
    domains: ['spotify.com', 'open.spotify.com'],
    patterns: [/spotify\.com\/track/, /spotify\.com\/album/, /spotify\.com\/playlist/]
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    requiresCookie: true,
    supportsMultiMedia: true,
    domains: ['instagram.com'],
    patterns: [/instagram\.com\/(p|reel|stories|tv)\//]
  },
  {
    platform: 'threads',
    name: 'Threads',
    requiresCookie: true,
    supportsMultiMedia: true,
    domains: ['threads.net', 'threadsapp.com'],
    patterns: [/@[\w]+\/[\w-]+/]
  },
  {
    platform: 'tiktok',
    name: 'TikTok',
    requiresCookie: true,
    supportsMultiMedia: false,
    domains: ['tiktok.com'],
    patterns: [/tiktok\.com\/@[\w]+\/video\//]
  },
  {
    platform: 'twitter',
    name: 'Twitter/X',
    requiresCookie: true,
    supportsMultiMedia: true,
    domains: ['twitter.com', 'x.com'],
    patterns: [/twitter\.com\/[\w]+\/status\//, /x\.com\/[\w]+\/status\//]
  },
  {
    platform: 'facebook',
    name: 'Facebook',
    requiresCookie: true,
    supportsMultiMedia: true,
    domains: ['facebook.com', 'fb.watch'],
    patterns: [/facebook\.com\/[\w\.]+\/videos\//, /facebook\.com\/watch\//]
  },
  {
    platform: 'pixiv',
    name: 'Pixiv',
    requiresCookie: true,
    supportsMultiMedia: false,
    domains: ['pixiv.net'],
    patterns: [/pixiv\.net\/[\w]+\/artworks\//, /pixiv\.net\/illust\//]
  },
  {
    platform: 'pinterest',
    name: 'Pinterest',
    requiresCookie: false,
    supportsMultiMedia: false,
    domains: ['pinterest.com', 'pin.it'],
    patterns: [/pinterest\.com\/[\w]+\/[\w-]+\//, /pin\.it\//]
  },
  {
    platform: 'reddit',
    name: 'Reddit',
    requiresCookie: false,
    supportsMultiMedia: false,
    domains: ['reddit.com', 'redd.it'],
    patterns: [/reddit\.com\/r\/[\w]+\/comments\//, /redd\.it\//]
  },
  {
    platform: 'fandom',
    name: 'Fandom',
    requiresCookie: false,
    supportsMultiMedia: false,
    domains: ['fandom.com', 'wikia.org'],
    patterns: [/fandom\.com\/wiki\//]
  }
];

export const platformService = {
  detectPlatform: (url) => {
    if (!url) return 'unknown';
    
    const lowerUrl = url.toLowerCase();
    
    for (const platform of PLATFORMS) {
      for (const domain of platform.domains) {
        if (lowerUrl.includes(domain)) {
          if (platform.platform === 'twitter' && (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com'))) {
            return 'twitter';
          }
          return platform.platform;
        }
      }
      
      for (const pattern of platform.patterns) {
        if (pattern.test(lowerUrl)) {
          return platform.platform;
        }
      }
    }
    
    return 'unknown';
  },
  
  getPlatformInfo: (platformName) => {
    return PLATFORMS.find(p => p.platform === platformName);
  },
  
  getPlatforms: async () => {
    const cookiesDir = process.env.COOKIES_DIR || 'cookies';
    const platforms = [];
    
    for (const platform of PLATFORMS) {
      const cookieFile = path.join(cookiesDir, `${platform.platform}.txt`);
      const cookieExists = await fs.pathExists(cookieFile);
      
      platforms.push({
        platform: platform.platform,
        name: platform.name,
        requiresCookie: platform.requiresCookie,
        supportsMultiMedia: platform.supportsMultiMedia,
        cookieAvailable: cookieExists,
        domains: platform.domains
      });
    }
    
    return platforms;
  },
  
  getCookieRequiredPlatforms: () => {
    return PLATFORMS.filter(p => p.requiresCookie).map(p => p.platform);
  },
  
  isCookieRequired: (platform) => {
    const platformInfo = PLATFORMS.find(p => p.platform === platform);
    return platformInfo?.requiresCookie || false;
  }
};

export default platformService;
