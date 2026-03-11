/**
 * SvgOverlay — base class for overlays with custom SVG content.
 * No card resolution or drag-drop. Designed for unique visual elements (e.g. gyrophare).
 * @module overlays/svg-overlay
 */
import { BaseOverlay } from "./base-overlay.mjs";

export class SvgOverlay extends BaseOverlay {
  /**
   * @param {object} config
   * @param {string} config.elementId
   * @param {string} [config.previewId]
   * @param {string[]} [config.settingKeys]
   */
  constructor(config) {
    super(config);
  }

  /**
   * Build the SVG markup. Override in subclasses.
   * @returns {Promise<string>|string}
   */
  async buildSVG() { return ""; }

  /** @override */
  async buildHTML() {
    return this.buildSVG();
  }
}
