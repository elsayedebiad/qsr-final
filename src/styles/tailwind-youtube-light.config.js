/**
 * YouTube Light Mode - Tailwind CSS Configuration Extension
 * 
 * This file extends your existing Tailwind config with YouTube Light Mode colors.
 * Import this into your main tailwind.config.js or use these values directly.
 */

module.exports = {
  theme: {
    extend: {
      colors: {
        // YouTube Light Mode Color System
        youtube: {
          light: {
            // Backgrounds
            'bg-primary': '#FFFFFF',
            'bg-secondary': '#F8F8F8',
            'bg-hover': '#F0F0F0',
            'bg-active': '#E5E5E5',
            
            // Text
            'text-primary': '#111111',
            'text-secondary': '#555555',
            'text-muted': '#777777',
            
            // Borders
            'border': '#E5E5E5',
            'border-light': '#F0F0F0',
            'border-input': '#D0D0D0',
            
            // Brand
            'brand': '#065FD4',
            'brand-hover': '#0556C1',
            
            // Status
            'success': '#0F9D58',
            'success-hover': '#0D8A4F',
            'warning': '#F9AB00',
            'warning-hover': '#E09600',
            'error': '#CC0000',
            'error-hover': '#B30000',
            'info': '#065FD4',
            'info-hover': '#0556C1',
          }
        },
        
        // Alternative: Direct color mapping for easier use
        light: {
          background: '#FFFFFF',
          sidebar: '#F8F8F8',
          card: '#FFFFFF',
          hover: '#F0F0F0',
          active: '#E5E5E5',
          border: '#E5E5E5',
          primary: '#111111',
          secondary: '#555555',
          muted: '#777777',
          brand: '#065FD4',
        }
      },
      
      // YouTube-style shadows
      boxShadow: {
        'youtube-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'youtube-md': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'youtube-lg': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'youtube-xl': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'youtube-card': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'youtube-card-hover': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      
      // Border radius matching YouTube
      borderRadius: {
        'youtube-sm': '4px',
        'youtube-md': '8px',
        'youtube-lg': '12px',
      },
      
      // Transitions
      transitionTimingFunction: {
        'youtube': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      transitionDuration: {
        'youtube-fast': '150ms',
        'youtube-base': '200ms',
        'youtube-slow': '300ms',
      },
    }
  }
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Using YouTube color system:
 *    className="bg-youtube-light-bg-primary text-youtube-light-text-primary"
 * 
 * 2. Using simplified light colors:
 *    className="bg-light-background text-light-primary"
 * 
 * 3. Using YouTube shadows:
 *    className="shadow-youtube-card hover:shadow-youtube-card-hover"
 * 
 * 4. Using YouTube border radius:
 *    className="rounded-youtube-md"
 * 
 * 5. Combining with transitions:
 *    className="transition-youtube-base ease-youtube"
 * 
 * INTEGRATION WITH EXISTING CONFIG:
 * 
 * In your tailwind.config.js, you can merge this:
 * 
 * const youtubeLightConfig = require('./src/styles/tailwind-youtube-light.config.js')
 * 
 * module.exports = {
 *   // ... your existing config
 *   theme: {
 *     extend: {
 *       ...youtubeLightConfig.theme.extend,
 *       // ... rest of your extensions
 *     }
 *   }
 * }
 */
