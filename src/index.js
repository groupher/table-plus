/**
 * @typedef {object} TableData
 * @description Link Tool's input and output data format
 * @property {string} link — data url
 * @property {metaData} meta — fetched link data
 */

/**
 * @typedef {Object} metaData
 * @description Fetched link meta data
 * @property {string} image - link's meta image
 * @property {string} title - link's meta title
 * @property {string} description - link's description
 */

// eslint-disable-next-line
import {
  make,
  enableCtrlEnterBreak,
  addBreakHint,
} from "@groupher/editor-utils";

import "./index.css";

import { SETTING } from "./constant";

import TableIcon from "./svg/table.svg";
import TableHeaderIcon from "./svg/table-header.svg";
import TableZebraIcon from "./svg/table-zebra.svg";

import UI from "./ui";
// eslint-disable-next-line
import polyfill from "url-polyfill";

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on link data fetching
 * @property {number} success  - 1 for successful uploading, 0 for failure
 * @property {metaData} meta - Object with link data.
 *
 * Tool may have any data provided by backend, currently are supported by design:
 * title, description, image, url
 */
export default class Table {
  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: TableIcon,
      title: "表格",
    };
  }

  /**
   * Allow to press Enter inside the Table input
   * @returns {boolean}
   * @public
   */
  static get enableLineBreaks() {
    return true;
  }

  /**
   * @param {TableData} data - previously saved data
   * @param {config} config - user config for Tool
   * @param {object} api - Editor.js API
   */
  constructor({ data, config, api }) {
    this.api = api;

    /**
     * Tool's initial config
     */
    this.config = {
      endpoint: config.endpoint || "",
    };

    this.element = null;

    const defaultData = {
      items: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
      columnCount: 2,
    };
    // this._data = data || { items: [], columnCount: 2 };
    this._data = defaultData;

    this.ui = new UI({
      api,
      config: this.config,
      reRender: this.reRender.bind(this),
    });
  }

  /**
   * Renders Block content
   * @public
   *
   * @return {HTMLDivElement}
   */
  render() {
    this.element = this.ui.drawView(this._data);
    enableCtrlEnterBreak(this.element, this.api);
    addBreakHint(this.element);

    return this.element;
  }

  /**
   * reRender based on new data
   * @public
   *
   * @return {HTMLDivElement}
   */
  reRender(data) {
    this._data = data;
    this.replaceElement(this.ui.drawView(this._data));
    addBreakHint(this.element);
  }

  /**
   * replace element wrapper with new html element
   * @param {HTMLElement} node
   */
  replaceElement(node) {
    this.element.replaceWith(node);
    this.element = node;

    enableCtrlEnterBreak(this.element, this.api);

    this.api.tooltip.hide();
    this.api.toolbar.close();
  }

  /**
   * render Setting buttons
   * @public
   */
  renderSettings() {
    const Wrapper = make("div");

    const settings = [
      {
        title: "添加表头",
        action: SETTING.TOGGLE_HEADER,
        icon: TableHeaderIcon,
      },
      {
        title: "斑马条纹",
        action: SETTING.TOGGLE_ZEBRA,
        icon: TableZebraIcon,
      },
    ];

    settings.forEach((item) => {
      const ItemEl = make("div", this.CSS.settingsButton, {
        innerHTML: item.icon,
      });

      if (item.action === SETTING.TOGGLE_HEADER) {
        this._data.withHeader
          ? ItemEl.classList.add(this.CSS.settingsButtonActive)
          : ItemEl.classList.remove(this.CSS.settingsButtonActive);
      }

      if (item.action === SETTING.TOGGLE_ZEBRA) {
        this._data.withStripe
          ? ItemEl.classList.add(this.CSS.settingsButtonActive)
          : ItemEl.classList.remove(this.CSS.settingsButtonActive);
      }

      ItemEl.addEventListener("click", () => {
        this.ui.handleSettingAction(item.action);
      });

      this.api.tooltip.onHover(ItemEl, item.title, {
        placement: "top",
      });

      Wrapper.appendChild(ItemEl);
    });

    return Wrapper;
  }

  /**
   * Return Block data
   * @public
   *
   * @return {TableData}
   */
  save() {
    return this.ui.data;
  }

  /**
   * Stores all Tool's data
   * @param {TableData} data
   */
  // set data(data) {
  // this._data = Object.assign(
  //   {},
  //   {
  //     link: data.link || this._data.link,
  //     meta: data.meta || this._data.meta,
  //   }
  // );
  // }

  /**
   * Return Tool data
   * @return {TableData} data
   */
  get data() {
    return this._data;
  }

  /**
   * @return {object} - Link Tool styles
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,

      // settings class
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive,
    };
  }
}
