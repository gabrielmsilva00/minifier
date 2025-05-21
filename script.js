// script.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('Available global objects:', Object.keys(window).filter(k => 
    k.toLowerCase().includes('css') || 
    k.toLowerCase().includes('terser')
  ));

  const input   = document.getElementById('input');
  const output  = document.getElementById('output');
  const stats   = document.getElementById('stats');
  const fileInput = document.getElementById('fileInput');

  // Theme handler
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }
  
  // Load saved theme or default to white
  const savedTheme = localStorage.getItem('theme') || 'white';
  setTheme(savedTheme);
  
  // Theme carousel click handler
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });
  
  // File handling with automatic minification
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      input.value = e.target.result;
      await processMinification(); // Renamed to avoid conflict
    };
    reader.readAsText(file);
  });
  
  // Drag and drop handling
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.classList.add('dragging');
  });
  
  document.body.addEventListener('dragleave', () => {
    document.body.classList.remove('dragging');
  });
  
  document.body.addEventListener('drop', async (e) => {
    e.preventDefault();
    document.body.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      input.value = e.target.result;
      await processMinification(); // Renamed to avoid conflict
    };
    reader.readAsText(file);
  });
  
  /**
   * Basic HTML minifier function that handles common minification tasks
   * without triggering recursive calls or relying on external libraries
   */
  function minifyHTML(html) {
    if (!html) return '';
    
    return html
      // Remove HTML comments
      .replace(/<!--(?!<!)[^$>][\s\S]*?-->/g, '')
      
      // Remove whitespace between HTML tags
      .replace(/>\s+</g, '><')
      
      // Remove unnecessary whitespace
      .replace(/\s{2,}/g, ' ')
      
      // Remove whitespace at the beginning and end of each line
      .replace(/^\s+|\s+$/gm, '')
      
      // Collapse boolean attributes
      .replace(/(\s)([a-zA-Z-]+)=['"]([a-zA-Z-]+)['"]/g, function(match, space, name, value) {
        if (name === value) return space + name;
        return match;
      })
      
      // Remove optional quotes from attributes
      .replace(/(\s)([a-zA-Z-]+)=["']([^"'<>]+)["']/g, '\$1$2=$3')
      
      // Minify inline CSS
      .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, function(match, css) {
        if (typeof csso !== 'undefined') {
          try {
            return match.replace(css, csso.minify(css).css);
          } catch (e) {
            console.warn('CSS minification failed:', e);
            return match;
          }
        }
        return match;
      });
  }
  
  async function processMinification() {
    const code = input.value.trim();
    if (!code) return;

    try {
      const type = detectFileType(code);
      let result;

      switch (type) {
        case 'js':
          if (typeof Terser === 'undefined') {
            throw new Error('JS Minifier (Terser) not loaded. Check your connection.');
          }
          result = (await Terser.minify(code)).code;
          break;
          
        case 'css':
          if (typeof csso === 'undefined') {
            throw new Error('CSS Minifier (CSSO) not loaded. Check your connection.');
          }
          result = csso.minify(code, {
            restructure: true,
            comments: false
          }).css;
          break;
          
        case 'html':
          // Use our custom HTML minifier
          result = minifyHTML(code);
          break;
      }

      output.value = result || 'No output generated';
      updateStats(code, result);
    } catch (err) {
      console.error('Minification error:', err);
      output.value = `Error: ${err.message}\nTry refreshing the page.`;
    }
  }
              
  function detectFileType(code) {
    code = code.trim().toLowerCase();
    if (code.startsWith('<!doctype html') || code.startsWith('<html')) return 'html';
    if (code.includes('{') && /[.#][\w-]+\s*{/.test(code)) return 'css';
    return 'js';
  }
  
  function updateStats(original, minified) {
    const originalSize = new Blob([original]).size;
    const minifiedSize = new Blob([minified]).size;
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
    stats.textContent = `Original: ${formatBytes(originalSize)} | Minified: ${formatBytes(minifiedSize)} | Saved: ${savings}%`;
  }
  
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  
  window.copyToClipboard = () => {
    output.select();
    document.execCommand('copy');
  };
  
  // Expose the minification function for the button click
  // but with a different name to avoid conflicts
  window.minify = processMinification;
});
