'use strict';

const cookieService = require('./cookie.service');

const PLATFORMS = [
  {
    platform: 'youtube',
    name: 'YouTube',
    requiresCookie: false,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=[\w-]+/i,
      /(?:https?:\/\/)?youtu\.be\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/[\w-]+/i
    ],
    cookieFile: 'youtube.txt'
  },
  {
    platform: 'youtubemusic',
    name: 'YouTube Music',
    requiresCookie: true,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?music\.youtube\.com\/watch\?v=[\w-]+/i,
      /(?:https?:\/\/)?music\.youtube\.com\/playlist\?list=[\w-]+/i
    ],
    cookieFile: 'youtubemusic.txt'
  },
  {
    platform: 'spotify',
    name: 'Spotify',
    requiresCookie: true,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?open\.spotify\.com\/track\/[\w]+/i,
      /(?:https?:\/\/)?open\.spotify\.com\/album\/[\w]+/i,
      /(?:https?:\/\/)?open\.spotify\.com\/playlist\/[\w]+/i
    ],
    cookieFile: 'spotify.txt'
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    requiresCookie: true,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/reel\/[\w-]+/i,
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/stories\/[\w.]+\/\d+/i
    ],
    cookieFile: 'instagram.txt'
  },
  {
    platform: 'threads',
    name: 'Threads',
    requiresCookie: true,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?threads\.net\/@[\w.]+\/post\/[\w-]+/i
    ],
    cookieFile: 'threads.txt'
  },
  {
    platform: 'tiktok',
    name: 'TikTok',
    requiresCookie: true,
    supportsMultiMedia: false,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/i,
      /(?:https?:\/\/)?vm\.tiktok\.com\/[\w]+/i,
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/[\w]+/i
    ],
    cookieFile: 'tiktok.txt'
  },
  {
    platform: 'twitter',
    name: 'Twitter/X',
    requiresCookie: true,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[\w]+\/status\/\d+/i
    ],
    cookieFile: 'twitter.txt'
  },
  {
    platform: 'facebook',
    name: 'Facebook',
    requiresCookie: true,
    supportsMultiMedia: true,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[\w.]+\/videos\/\d+/i,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/watch\/?\?v=\d+/i,
      /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/\d+/i,
      /(?:https?:\/\/)?fb\.watch\/[\w]+/i
    ],
    cookieFile: 'facebook.txt'
  },
  {
    platform: 'pixiv',
    name: 'Pixiv',
    requiresCookie: true,
    supportsMultiMedia: false,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?pixiv\.net\/(?:en\/)?artworks\/\d+/i
    ],
    cookieFile: 'pixiv.txt'
  },
  {
    platform: 'pinterest',
    name: 'Pinterest',
    requiresCookie: false,
    supportsMultiMedia: false,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\/[\w-]+/i,
      /(?:https?:\/\/)?pin\.it\/[\w]+/i
    ],
    cookieFile: 'pinterest.txt'
  },
  {
    platform: 'reddit',
    name: 'Reddit',
    requiresCookie: false,
    supportsMultiMedia: false,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?reddit\.com\/r\/[\w]+\/comments\/[\w]+/i,
      /(?:https?:\/\/)?(?:old\.)?reddit\.com\/r\/[\w]+\/comments\/[\w]+/i
    ],
    cookieFile: 'reddit.txt'
  },
  {
    platform: 'fandom',
    name: 'Fandom',
    requiresCookie: false,
    supportsMultiMedia: false,
    patterns: [
      /(?:https?:\/\/)?[\w-]+\.fandom\.com\/wiki\/[\w%()-]+/i
    ],
    cookieFile: 'fandom.txt'
  }
];

function detectPlatform(url) {
  for (const platform of PLATFORMS) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) {
        return {
          platform: platform.platform,
          name: platform.name,
          requiresCookie: platform.requiresCookie,
          supportsMultiMedia: platform.supportsMultiMedia,
          cookieFile: platform.cookieFile
        };
      }
    }
  }
  return null;
}

function getAllPlatforms() {
  return PLATFORMS.map(p => ({
    platform: p.platform,
    name: p.name,
    requiresCookie: p.requiresCookie,
    supportsMultiMedia: p.supportsMultiMedia,
    cookieAvailable: cookieService.hasCookie(p.cookieFile)
  }));
}

module.exports = { detectPlatform, getAllPlatforms, PLATFORMS };
