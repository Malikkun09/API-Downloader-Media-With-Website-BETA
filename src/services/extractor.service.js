export const extractorService = {
  extractMetadata: (info) => {
    if (!info) return null;
    
    return {
      title: info.title || 'Unknown',
      description: info.description || null,
      duration: info.duration || info.length || null,
      uploader: info.uploader || info.channel || info.artist || 'Unknown',
      upload_date: info.upload_date || null,
      view_count: info.view_count || info.views || null,
      like_count: info.like_count || info.likes || null,
      comment_count: info.comment_count || info.comments || null,
      tags: info.tags || [],
      categories: info.categories || [],
      age_limit: info.age_limit || info.age_required || null,
      thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || null,
      url: info.url || null,
      display_id: info.display_id || null,
      id: info.id || null,
      ext: info.ext || null,
      format: info.format || null,
      format_note: info.format_note || null,
      resolution: info.resolution || null,
      filesize: info.filesize || info.filesize_approx || null,
      codec: info.codec || null
    };
  },
  
  formatDuration: (seconds) => {
    if (!seconds) return '00:00';
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  formatFilesize: (bytes) => {
    if (!bytes) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },
  
  sanitizeFilename: (filename) => {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200);
  }
};

export default extractorService;
