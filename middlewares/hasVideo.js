const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
// Recherche de vidéo : <video>, iframe YouTube, Vimeo, etc.

 async function hasVideo (href){
        try {
        const response = await fetch(href, { timeout: 5000 });
        if (!response.ok) {
          throw new Error('Lien inaccessible');
        };

        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;
        console.log(document)
        const video =  document.querySelector('video') ||
                document.querySelector('iframe[src*="youtube"]') ||
                document.querySelector('iframe[src*="vimeo"]');
        if (video) return true

      } catch {
        return false;
      }
      return false
    }

module.exports = {hasVideo}