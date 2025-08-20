'use client'

import {useEffect} from 'react'

export default function GlobalStyles() {
  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'map-global-styles'
    s.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      :root {
        /* Spacing Scale */
        --space-1: 4px;
        --space-2: 8px;
        --space-3: 12px;
        --space-4: 16px;
        --space-5: 24px;
        --space-6: 32px;
        --space-7: 48px;
        --space-8: 64px;
        
        /* Typography Scale */
        --font-xs: 11px;
        --font-sm: 12px;
        --font-base: 14px;
        --font-lg: 16px;
        --font-xl: 20px;
        --font-2xl: 24px;
        
        /* Modern Color System */
        --bg-base: #0a0e1a;
        --bg-surface: rgba(15, 23, 42, 0.8);
        --bg-overlay: rgba(20, 27, 45, 0.95);
        --bg-elevated: rgba(30, 41, 59, 0.9);
        
        /* Glass effects */
        --glass-bg: rgba(148, 163, 184, 0.03);
        --glass-border: rgba(148, 163, 184, 0.1);
        
        /* Text colors with better contrast */
        --text-primary: rgba(248, 250, 252, 0.95);
        --text-secondary: rgba(203, 213, 225, 0.8);
        --text-muted: rgba(148, 163, 184, 0.6);
        
        /* Accent colors - Purple gradient system */
        --accent-primary: #8b5cf6;
        --accent-light: #a78bfa;
        --accent-dark: #7c3aed;
        --accent-glow: #8b5cf640;
        
        /* Status colors */
        --success: #10b981;
        --warning: #f59e0b;
        --error: #ef4444;
        --info: #3b82f6;
        
        /* Shadows */
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
        --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
        --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.7);
        
        /* Animations */
        --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
        --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        --duration-fast: 150ms;
        --duration-base: 250ms;
        --duration-slow: 350ms;
      }
      
      * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* Modern Glass Panel */
      .glass {
        background: var(--glass-bg);
        backdrop-filter: blur(20px) saturate(140%);
        border: 1px solid var(--glass-border);
        border-radius: var(--space-4);
        box-shadow: var(--shadow-lg);
        position: relative;
        overflow: hidden;
      }
      
      .glass::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.03) 0%,
          transparent 100%
        );
        pointer-events: none;
      }

      .glass-pro {
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(24px) saturate(150%);
        border: 1px solid rgba(148, 163, 184, 0.1);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
      }

      /* Map Toolbar Container */
      .map-toolbar-container {
        position: sticky;
        top: 0;
        z-index: 900;
        padding: 0;
      }

      .map-toolbar {
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(24px) saturate(150%);
        border: 1px solid rgba(148, 163, 184, 0.12);
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .toolbar-row {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .forecast-row {
        padding-top: 12px;
        border-top: 1px solid rgba(148, 163, 184, 0.08);
      }

      /* Field Group */
      .field-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .toolbar-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(148, 163, 184, 0.7);
        font-weight: 500;
      }

      /* Chip Group */
      .chip-group {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      /* Enhanced Chips */
      .chip {
        height: 32px;
        padding: 0 var(--space-3);
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-secondary);
        font-size: var(--font-sm);
        font-weight: 500;
        transition: all var(--duration-fast) var(--ease-out);
        cursor: pointer;
        position: relative;
        overflow: hidden;
        white-space: nowrap;
      }
      
      .chip:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
        border-color: rgba(139, 92, 246, 0.3);
        color: var(--text-primary);
      }
      
      .chip[aria-pressed="true"], .chip.active {
        background: linear-gradient(
          135deg,
          rgba(139, 92, 246, 0.15) 0%,
          rgba(139, 92, 246, 0.1) 100%
        );
        border-color: rgba(139, 92, 246, 0.4);
        color: var(--accent-light);
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
      }

      .chip-enhanced {
        height: 32px;
        padding: 0 14px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(148, 163, 184, 0.04);
        border: 1px solid rgba(148, 163, 184, 0.12);
        color: rgba(203, 213, 225, 0.9);
        font-size: 12px;
        font-weight: 500;
        transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }

      .chip-enhanced:hover {
        transform: translateY(-1px);
        background: rgba(139, 92, 246, 0.08);
        border-color: rgba(139, 92, 246, 0.25);
        color: rgba(248, 250, 252, 0.95);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
      }

      .chip-enhanced.active {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(139, 92, 246, 0.12) 100%);
        border-color: rgba(139, 92, 246, 0.45);
        color: #a78bfa;
        box-shadow: 0 0 16px rgba(139, 92, 246, 0.25);
      }

      .chip-icon {
        font-size: 14px;
        opacity: 0.7;
      }

      .chip-label {
        font-size: 12px;
      }

      /* Toolbar Actions */
      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: auto;
      }

      /* Palette Toggle */
      .palette-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 12px;
        color: rgba(203, 213, 225, 0.8);
        transition: color 200ms ease;
      }

      .palette-toggle:hover {
        color: rgba(248, 250, 252, 0.95);
      }

      .palette-toggle-track {
        width: 36px;
        height: 20px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.15);
        border: 1px solid rgba(148, 163, 184, 0.2);
        position: relative;
        transition: all 200ms ease;
      }

      .palette-toggle-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .palette-toggle input:checked + .palette-toggle-track {
        background: rgba(139, 92, 246, 0.25);
        border-color: rgba(139, 92, 246, 0.4);
      }

      .palette-toggle input:checked + .palette-toggle-track .palette-toggle-thumb {
        left: 18px;
      }

      /* Lasso Button */
      .lasso-btn {
        height: 36px;
        padding: 0 16px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(148, 163, 184, 0.06);
        border: 1px solid rgba(148, 163, 184, 0.15);
        color: rgba(203, 213, 225, 0.9);
        font-size: 13px;
        font-weight: 500;
        transition: all 200ms ease;
        cursor: pointer;
      }

      .lasso-btn:hover {
        background: rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.3);
        color: rgba(248, 250, 252, 0.95);
        transform: translateY(-1px);
      }

      .lasso-btn.active {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.5);
        color: #a78bfa;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
      }

      .lasso-icon {
        transition: transform 200ms ease;
      }

      .lasso-btn:hover .lasso-icon {
        transform: scale(1.1);
      }

      .lasso-kbd {
        margin-left: 4px;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(148, 163, 184, 0.1);
        font-size: 10px;
        font-family: monospace;
      }

      /* Apply Button */
      .apply-btn-pro {
        height: 36px;
        padding: 0 24px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 13px;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 200ms ease;
        position: relative;
        overflow: hidden;
      }

      .apply-btn-pro:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
      }

      .apply-btn-pro:active {
        transform: translateY(0);
      }

      .apply-btn-shine {
        position: absolute;
        top: -2px;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
        transition: left 600ms ease;
      }

      .apply-btn-pro:hover .apply-btn-shine {
        left: 100%;
      }

      /* Forecast Controls */
      .forecast-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.25);
        color: #a78bfa;
        font-size: 12px;
        font-weight: 500;
      }

      .forecast-badge-icon {
        font-size: 14px;
        animation: spin 3s linear infinite;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Aggregate Toggle */
      .agg-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .agg-btn {
        height: 28px;
        padding: 0 12px;
        border-radius: 6px;
        background: rgba(148, 163, 184, 0.05);
        border: 1px solid rgba(148, 163, 184, 0.1);
        color: rgba(203, 213, 225, 0.8);
        font-size: 12px;
        font-weight: 500;
        transition: all 150ms ease;
        cursor: pointer;
      }

      .agg-btn:hover {
        background: rgba(148, 163, 184, 0.08);
        border-color: rgba(148, 163, 184, 0.2);
        color: rgba(248, 250, 252, 0.95);
      }

      .agg-btn.active {
        background: rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.35);
        color: #a78bfa;
      }

      /* Per-day Controls */
      .perday-controls {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .day-slider-container {
        position: relative;
        width: 220px;
      }

      .day-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.15);
        outline: none;
        transition: all 200ms ease;
      }

      .day-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: white;
        border: 3px solid #8b5cf6;
        cursor: pointer;
        transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .day-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
        box-shadow: 0 0 16px rgba(139, 92, 246, 0.5);
      }

      .day-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: white;
        border: 3px solid #8b5cf6;
        cursor: pointer;
        transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .day-bubble {
        position: absolute;
        bottom: calc(100% + 8px);
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(20, 27, 45, 0.95);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: rgba(248, 250, 252, 0.95);
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transform: translateY(4px);
        transition: all 200ms ease;
      }

      .day-slider-container:hover .day-bubble {
        opacity: 1;
        transform: translateY(0);
      }

      /* Advanced Toggle */
      .advanced-toggle {
        height: 28px;
        padding: 0 12px;
        border-radius: 6px;
        background: rgba(148, 163, 184, 0.05);
        border: 1px solid rgba(148, 163, 184, 0.1);
        color: rgba(203, 213, 225, 0.8);
        font-size: 12px;
        font-weight: 500;
        transition: all 150ms ease;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .advanced-toggle:hover {
        background: rgba(148, 163, 184, 0.08);
        border-color: rgba(148, 163, 184, 0.2);
        color: rgba(248, 250, 252, 0.95);
      }

      .advanced-toggle.active {
        background: rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.35);
        color: #a78bfa;
      }

      .advanced-icon {
        transition: transform 200ms ease;
      }

      .advanced-icon.rotate {
        transform: rotate(180deg);
      }

      /* Advanced Popover */
      .advanced-popover {
        position: absolute;
        left: 0;
        top: calc(100% + 8px);
        min-width: 520px;
        padding: 20px;
        z-index: 910;
        animation: slideDown 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .advanced-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(148, 163, 184, 0.08);
        border: 1px solid rgba(148, 163, 184, 0.15);
        color: rgba(203, 213, 225, 0.8);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .advanced-close:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: #f87171;
      }

      /* Stats Bar */
      .stats-bar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        border-radius: 12px;
        font-size: 13px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .stat-icon {
        font-size: 14px;
        color: rgba(139, 92, 246, 0.8);
      }

      .stat-label {
        color: rgba(148, 163, 184, 0.8);
      }

      .stat-value {
        color: rgba(248, 250, 252, 0.95);
        font-weight: 600;
      }

      .stat-suffix {
        color: rgba(203, 213, 225, 0.7);
        font-weight: 400;
        margin-left: 4px;
      }

      .stat-divider {
        width: 1px;
        height: 16px;
        background: rgba(148, 163, 184, 0.2);
      }

      /* Map Wrapper */
      .map-wrapper {
        position: relative;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.12);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
      }

      /* Map Progress */
      .map-progress {
        position: absolute;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
        z-index: 1000;
        transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1);
        opacity: 0;
      }

      .map-progress.active {
        opacity: 1;
      }

      /* Reset View Button */
      .reset-view-btn {
        position: fixed;
        z-index: 850;
        bottom: 20px;
        left: 20px;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 200ms ease;
      }

      .reset-view-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
      }

      /* Map Canvas */
      .map-canvas {
        transition: filter 300ms ease;
      }

      .map-canvas.dim-others .leaflet-overlay-pane path:not(.hex-hover):not(.hex-selected) {
        opacity: 0.3;
      }

      .map-canvas.loading {
        filter: saturate(0.7);
      }

      /* Hex Hover Effect */
      .hex-hover {
        filter: brightness(1.2);
        transition: filter 150ms ease;
      }

      /* Enhanced Tooltips */
      .hex-tooltip-pro {
        background: rgba(20, 27, 45, 0.95);
        backdrop-filter: blur(20px) saturate(140%);
        color: rgba(248, 250, 252, 0.95);
        border: 1px solid rgba(148, 163, 184, 0.15);
        border-radius: 12px;
        padding: 0;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
        max-width: 280px;
        opacity: 0;
        transform: translateY(8px) scale(0.95);
        transition: all 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        overflow: hidden;
      }

      .hex-tooltip-pro.hex-tooltip-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .tooltip-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(148, 163, 184, 0.05);
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
      }

      .tooltip-title {
        font-weight: 600;
        font-size: 13px;
      }

      .tooltip-badge {
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 999px;
        font-weight: 500;
      }

      .tooltip-badge.forecast {
        background: rgba(139, 92, 246, 0.15);
        border: 1px solid rgba(139, 92, 246, 0.3);
        color: #a78bfa;
      }

      .tooltip-content {
        padding: 12px 16px;
      }

      .tooltip-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 0;
        font-size: 12px;
      }

      .tooltip-row:not(:last-child) {
        border-bottom: 1px solid rgba(148, 163, 184, 0.05);
      }

      .tooltip-label {
        color: rgba(148, 163, 184, 0.8);
      }

      .tooltip-value {
        font-weight: 500;
        color: rgba(248, 250, 252, 0.95);
      }

      .tooltip-bar {
        height: 4px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.1);
        overflow: hidden;
        margin-top: 12px;
      }

      .tooltip-bar-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        transition: width 250ms ease;
      }

      /* Hint Bar */
      .hint-bar {
        position: fixed;
        z-index: 850;
        bottom: 20px;
        left: 20px;
        max-width: 480px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 13px;
        animation: slideUp 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .hint-bar.info {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.25);
      }

      .hint-bar.warn {
        background: rgba(245, 158, 11, 0.1);
        border-color: rgba(245, 158, 11, 0.25);
      }

      .hint-bar.error {
        background: rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.25);
      }

      .hint-bar.success {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.25);
      }

      .hint-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
      }

      .hint-icon {
        font-size: 16px;
      }

      .hint-bar.info .hint-icon { color: #60a5fa; }
      .hint-bar.warn .hint-icon { color: #fbbf24; }
      .hint-bar.error .hint-icon { color: #f87171; }
      .hint-bar.success .hint-icon { color: #34d399; }

      .hint-text {
        color: rgba(248, 250, 252, 0.9);
      }

      .hint-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .hint-action-btn {
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        background: rgba(148, 163, 184, 0.1);
        color: rgba(248, 250, 252, 0.9);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 150ms ease;
      }

      .hint-action-btn:hover {
        background: rgba(148, 163, 184, 0.15);
        border-color: rgba(148, 163, 184, 0.3);
        transform: translateY(-1px);
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .map-toolbar {
          padding: 12px 16px;
          gap: 10px;
        }
        
        .toolbar-row {
          gap: 12px;
        }
        
        .chip-enhanced {
          height: 28px;
          padding: 0 10px;
          font-size: 11px;
        }
        
        .chip-icon {
          font-size: 12px;
        }
        
        .apply-btn-pro {
          height: 32px;
          padding: 0 16px;
          font-size: 12px;
        }

        .stats-bar {
          padding: 10px 16px;
          font-size: 12px;
          gap: 12px;
        }

        .advanced-popover {
          min-width: calc(100vw - 32px);
          left: 50%;
          transform: translateX(-50%);
        }
      }

/* Per-day Control Group */
.perday-control-group {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

/* Enhanced Per-day Toggle */
.perday-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 0 8px;
  user-select: none;
}

.perday-toggle-track {
  width: 44px;
  height: 24px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.2);
  position: relative;
  transition: all 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.perday-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
}

.perday-toggle-icon {
  opacity: 0;
  transform: scale(0.7);
  transition: all 250ms ease;
  color: #8b5cf6;
}

.perday-toggle input:checked + .perday-toggle-track {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.25) 100%);
  border-color: rgba(139, 92, 246, 0.4);
}

.perday-toggle input:checked + .perday-toggle-track .perday-toggle-thumb {
  left: 22px;
}

.perday-toggle input:checked + .perday-toggle-track .perday-toggle-icon {
  opacity: 1;
  transform: scale(1);
}

.perday-toggle:hover .perday-toggle-track {
  border-color: rgba(148, 163, 184, 0.3);
}

.perday-toggle:hover input:checked + .perday-toggle-track {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
}

.perday-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(203, 213, 225, 0.9);
  transition: color 200ms ease;
}

.perday-toggle:hover .perday-toggle-label {
  color: rgba(248, 250, 252, 0.95);
}

/* Playback Button */
.perday-play-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: #a78bfa;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 200ms ease;
  position: relative;
  overflow: hidden;
}

.perday-play-btn::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  padding: 1px;
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 300ms ease;
}

.perday-play-btn:hover:not(.disabled) {
  transform: scale(1.05);
  background: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.perday-play-btn:hover:not(.disabled)::before {
  opacity: 1;
}

.perday-play-btn.playing {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

.perday-play-btn:active:not(.disabled) {
  transform: scale(0.95);
}

.perday-play-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(148, 163, 184, 0.05);
  border-color: rgba(148, 163, 184, 0.1);
  color: rgba(148, 163, 184, 0.5);
}

/* Day Indicator */
.perday-indicator {
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: all 200ms ease;
}

.perday-indicator-label {
  color: #a78bfa;
}

.perday-indicator-divider {
  color: rgba(139, 92, 246, 0.4);
}

.perday-indicator-max {
  color: rgba(167, 139, 250, 0.7);
}

.perday-indicator.disabled {
  background: rgba(148, 163, 184, 0.05);
  border-color: rgba(148, 163, 184, 0.1);
}

.perday-indicator.disabled .perday-indicator-label {
  color: rgba(148, 163, 184, 0.6);
}

.perday-indicator.disabled .perday-indicator-divider,
.perday-indicator.disabled .perday-indicator-max {
  color: rgba(148, 163, 184, 0.4);
}

/* Slider adjustments when per-day is active */
.day-slider-container {
  position: relative;
  width: 220px;
  padding: 4px 0;
}

.day-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  outline: none;
  transition: all 200ms ease;
}

.day-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: white;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  position: relative;
}

.day-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.day-slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
}

.day-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: white;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.day-slider:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.day-slider:disabled::-webkit-slider-thumb {
  border-color: rgba(148, 163, 184, 0.3);
  cursor: not-allowed;
}

/* Slider track marks */
.day-slider-container::before {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 1px;
  display: flex;
  justify-content: space-between;
  gap: 2px;
}

/* Enhanced bubble */
.day-bubble {
  position: absolute;
  bottom: calc(100% + 12px);
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.95) 100%);
  border: 1px solid rgba(167, 139, 250, 0.3);
  color: white;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px) scale(0.9);
  transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.day-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #7c3aed;
}

.day-slider-container:hover .day-bubble,
.day-slider:focus + .day-bubble {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Enhanced Zoom Controls */
.leaflet-control-container .leaflet-top.leaflet-left {
  top: 20px;
  left: 20px;
}

.leaflet-control-zoom {
  border: none !important;
  box-shadow: none !important;
  margin: 0 !important;
}

.leaflet-control-zoom a {
  width: 40px !important;
  height: 40px !important;
  line-height: 40px !important;
  background: rgba(15, 23, 42, 0.85) !important;
  backdrop-filter: blur(20px) saturate(140%) !important;
  border: 1px solid rgba(148, 163, 184, 0.12) !important;
  color: rgba(203, 213, 225, 0.9) !important;
  border-radius: 12px !important;
  margin: 0 !important;
  font-size: 20px !important;
  font-weight: 300 !important;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.leaflet-control-zoom a:first-child {
  margin-bottom: 8px !important;
}

.leaflet-control-zoom a:hover {
  background: rgba(139, 92, 246, 0.15) !important;
  border-color: rgba(139, 92, 246, 0.35) !important;
  color: #a78bfa !important;
  transform: scale(1.08) !important;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.25) !important;
}

.leaflet-control-zoom a:active {
  transform: scale(0.95) !important;
}

.leaflet-control-zoom-in {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.leaflet-control-zoom-out {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

/* Loading Skeleton Styles */
.map-skeleton-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 26, 0.9);
  backdrop-filter: blur(8px);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-skeleton-container {
  text-align: center;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 60px);
  gap: 8px;
  margin-bottom: 32px;
  justify-content: center;
}

.hex-skeleton {
  width: 60px;
  height: 60px;
  background: linear-gradient(
    90deg,
    rgba(148, 163, 184, 0.08) 0%,
    rgba(148, 163, 184, 0.15) 50%,
    rgba(148, 163, 184, 0.08) 100%
  );
  background-size: 200% 100%;
  border-radius: 12px;
  animation: shimmer 2s infinite;
  opacity: 0;
  animation-fill-mode: forwards;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
    opacity: 0;
    transform: scale(0.8);
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
  }
  100% {
    background-position: 200% 0;
    opacity: 1;
  }
}

.skeleton-loading-text {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  color: rgba(203, 213, 225, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.skeleton-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Enhanced Hint Bar with Close Button */
.hint-bar {
  position: fixed;
  z-index: 850;
  bottom: 20px;
  left: 20px;
  max-width: 480px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  padding-right: 12px;
  border-radius: 12px;
  font-size: 13px;
  animation: slideUp 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.hint-close {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
  flex-shrink: 0;
}

.hint-close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
}

.hint-close:active {
  transform: scale(0.95);
}

.hint-bar.info .hint-close:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
}

.hint-bar.warn .hint-close:hover {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.hint-bar.error .hint-close:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #f87171;
}

.hint-bar.success .hint-close:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

/* Animated number transitions */
.stat-value {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value > span:first-child {
  display: inline-block;
  min-width: 3ch;
  text-align: right;
}

/* Enhanced Advanced Popover */
.advanced-popover {
  position: absolute;
  left: 0;
  top: calc(100% + 12px);
  width: 480px;
  padding: 0;
  z-index: 910;
  animation: advancedSlide 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 16px;
  overflow: hidden;
}

@keyframes advancedSlide {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Forecast Options */
.forecast-options {
  padding: 24px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(24px) saturate(150%);
}

.forecast-header {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.forecast-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(248, 250, 252, 0.95);
  margin-bottom: 4px;
}

.forecast-icon {
  font-size: 18px;
  color: #fbbf24;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
}

.forecast-subtitle {
  font-size: 13px;
  color: rgba(148, 163, 184, 0.8);
}

.forecast-section {
  margin-bottom: 24px;
}

.forecast-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(203, 213, 225, 0.8);
  font-weight: 500;
  margin-bottom: 12px;
}

.label-icon {
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.1);
}

.label-icon.poc {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}

.label-icon.data {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

/* Aggregate Pills */
.agg-pills {
  display: flex;
  gap: 8px;
  padding: 4px;
  background: rgba(148, 163, 184, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.agg-pill {
  flex: 1;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: rgba(203, 213, 225, 0.7);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.agg-pill:hover {
  background: rgba(148, 163, 184, 0.08);
  color: rgba(248, 250, 252, 0.9);
}

.agg-pill.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: #a78bfa;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.2);
}

.pill-icon {
  font-size: 16px;
  opacity: 0.8;
}

/* Multiplier Controls */
.multiplier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.multiplier-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
}

.mult-symbol {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.6);
}

.mult-number {
  font-size: 16px;
  font-weight: 600;
  color: rgba(248, 250, 252, 0.95);
  font-variant-numeric: tabular-nums;
}

/* Enhanced Sliders */
.slider-wrapper {
  position: relative;
  padding: 0 8px 20px;
}

.multiplier-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  outline: none;
  transition: all 200ms ease;
}

.multiplier-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: white;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.multiplier-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.multiplier-slider::-webkit-slider-thumb:active {
  transform: scale(1.05);
}

.multiplier-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: white;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.poc-slider::-webkit-slider-thumb {
  border-color: #8b5cf6;
}

.poc-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.data-slider::-webkit-slider-thumb {
  border-color: #3b82f6;
}

.data-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.slider-marks {
  position: absolute;
  bottom: 0;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.6);
}

/* Actions */
.forecast-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: rgba(203, 213, 225, 0.9);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 200ms ease;
}

.reset-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
  color: #f87171;
  transform: translateY(-1px);
}

.reset-btn:active {
  transform: translateY(0);
}

.scenario-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.scenario-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(148, 163, 184, 0.6);
}

.scenario-value {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  transition: color 200ms ease;
}

/* Enhanced close button */
.advanced-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: rgba(203, 213, 225, 0.8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms ease;
  z-index: 1;
}

.advanced-close:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
  transform: rotate(90deg);
}

.reset-btn {
  position: relative;
  overflow: hidden;
}

.reset-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(239, 68, 68, 0.2) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0);
  transition: all 300ms ease;
}

.reset-btn:hover::before {
  opacity: 1;
  transform: scale(1);
}

.reset-btn svg {
  transition: transform 300ms ease;
}

.reset-btn:hover svg {
  transform: rotate(-360deg);
}

.scenario-value {
  position: relative;
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.scenario-value::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 300ms ease;
}

.scenario-value.active::after {
  transform: scaleX(1);
}

.advanced-popover::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 16px;
  padding: 1px;
  background: linear-gradient(135deg, transparent 30%, #8b5cf6 50%, transparent 70%);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 300ms ease;
  animation: glowRotate 3s linear infinite;
}

.advanced-popover.value-changing::before {
  opacity: 0.5;
}

@keyframes glowRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.agg-pills {
  position: relative;
}

.agg-pills::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 6px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-radius: 8px;
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 0;
}

.agg-pills[data-active="avg"]::before {
  transform: translateX(calc(100% + 4px));
}

.agg-pill {
  position: relative;
  z-index: 1;
}

/* Animated multiplier values */
.multiplier-value {
  position: relative;
  overflow: hidden;
}

.mult-number {
  display: inline-block;
  transition: all 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mult-number.changing {
  animation: valueChange 300ms ease;
}

@keyframes valueChange {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); color: #a78bfa; }
  100% { transform: scale(1); }
}

/* Slider thumb pulse on change */
.multiplier-slider:active::-webkit-slider-thumb {
  animation: thumbPulse 400ms ease;
}

@keyframes thumbPulse {
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

/* Enhanced Tooltip with Better Visual Hierarchy */
.hex-tooltip-pro {
  background: rgba(20, 27, 45, 0.98);
  backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 0;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(139, 92, 246, 0.1);
  max-width: 320px;
}

/* Gradient Header */
.tooltip-header {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.08) 0%, 
    rgba(59, 130, 246, 0.05) 100%
  );
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  padding: 14px 16px;
}

/* Visual Progress Bars for Values */
.tooltip-stat {
  position: relative;
  padding: 10px 0;
}

.tooltip-stat-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 999px;
  overflow: hidden;
}

.tooltip-stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #60a5fa);
  border-radius: inherit;
  transition: width 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* Micro-animations */
.tooltip-value {
  font-variant-numeric: tabular-nums;
  transition: all 200ms ease;
}

.tooltip-row:hover .tooltip-value {
  transform: translateX(2px);
  color: #a78bfa;
}

/* Quick Actions */
.tooltip-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(148, 163, 184, 0.03);
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

.tooltip-action {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.12);
  color: rgba(203, 213, 225, 0.9);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  text-align: center;
}

.tooltip-action:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  transform: translateY(-1px);
}

/* Enhanced Modal Design */
.hex-modal {
  background: linear-gradient(
    145deg,
    rgba(15, 23, 42, 0.98) 0%,
    rgba(20, 27, 45, 0.96) 100%
  );
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 
    0 30px 60px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Animated Header Badge */
.modal-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: #a78bfa;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 12px;
}

.modal-header-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

/* Enhanced Chart Area */
.forecast-chart-container {
  position: relative;
  padding: 24px;
  background: rgba(148, 163, 184, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.08);
  margin: 20px 0;
}

/* Interactive Chart Points */
.chart-point {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 200ms ease;
  transform: translate(-50%, -50%);
}

.chart-point:hover {
  transform: translate(-50%, -50%) scale(1.3);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.chart-point-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: rgba(20, 27, 45, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 200ms ease;
}

.chart-point:hover .chart-point-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-4px);
}

/* Enhanced Table */
.data-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  transition: all 150ms ease;
  cursor: pointer;
}

.table-row:hover {
  background: rgba(139, 92, 246, 0.05);
  transform: translateX(4px);
}

.table-row.forecast {
  background: rgba(139, 92, 246, 0.03);
  border-left: 3px solid #8b5cf6;
}

/* Type Badge */
.type-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.type-badge.observed {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #34d399;
}

.type-badge.forecast {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.25);
  color: #a78bfa;
}

/* Floating Action Bar */
.modal-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.98) 0%,
    rgba(15, 23, 42, 0.8) 80%,
    transparent 100%
  );
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  backdrop-filter: blur(20px);
}

.modal-action-btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 14px;
  transition: all 200ms ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.modal-action-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
}

.modal-action-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.modal-action-secondary {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: rgba(203, 213, 225, 0.9);
}

.modal-action-secondary:hover {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.25);
}

/* Enhanced Live Data Badge */
.modal-header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-left: 12px;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.modal-header-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  animation: pulse 2s infinite;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

/* Enhanced Table Rows */
.data-table .table-row {
  position: relative;
  overflow: hidden;
}

.data-table .table-row::before {
  content: '';
  position: absolute;
  left: -100%;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%);
  transition: left 400ms ease;
}

.data-table .table-row:hover::before {
  left: 100%;
}

/* Type badges enhancement */
.type-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: all 200ms ease;
}

.type-badge.observed {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.type-badge.forecast {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
}


    `
    if (!document.getElementById(s.id)) document.head.appendChild(s)
    return () => {
      const el = document.getElementById(s.id)
      if (el) el.remove()
    }
  }, [])
  return null
}
