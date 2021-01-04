// eslint-disable-next-line
import ajax from "@codexteam/ajax";
// eslint-disable-next-line
import polyfill from "url-polyfill";
import { make } from '@groupher/editor-utils';

/**
 * @description the ui parts
 *
 */
export default class UI {
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
      endpoint: config.endpoint || ''
    };

    this.nodes = {
      // root element
      wrapper: null,
      container: null,
      defaultTable: null
    };

    this._data = {
      link: '',
      meta: {}
    };

    this.data = data;
  }

  /**
   * @return {object} - Link Tool styles
   * @constructor
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,

      /**
       * Tool's classes
       */
      container: 'cdx-table-wrapper',
      table: 'cdx-table',
      cell: 'cdx-table__cell'
    };
  }

  /**
   * draw render View
   */
  drawView() {
    const wrapperEl = make('div', this.CSS.baseClass);
    const containerEl = make('div', this.CSS.container);

    this.nodes.defaultTable = this._drawDefaultTable();

    containerEl.appendChild(this.nodes.defaultTable);
    wrapperEl.appendChild(containerEl);

    return wrapperEl;
  }

  /**
   * draw table element
   */
  _drawDefaultTable() {
    const TableEl = make('table', this.CSS.table);
    const TBodyEl = make('tbody');

    // tr-1
    const TrEl1 = make('tr', 'tr');

    const TdEl11 = make('td', 'th');
    const Cell11 = make('div', this.CSS.cell, {
      innerHTML: 'Month',
      contentEditable: true
    });

    TdEl11.appendChild(Cell11);

    const TdEl12 = make('td', 'th');
    const Cell12 = make('div', this.CSS.cell, {
      innerHTML: 'Month',
      contentEditable: true
    });

    TdEl12.appendChild(Cell12);

    TrEl1.appendChild(TdEl11);
    TrEl1.appendChild(TdEl12);

    // tr2
    const TrEl2 = make('tr', 'tr');
    const TdEl21 = make('td', 'th');
    const Cell21 = make('div', this.CSS.cell, {
      innerHTML: 'Month-cell',
      contentEditable: true
    });

    TdEl21.appendChild(Cell21);

    const TdEl22 = make('td', 'th');
    const Cell22 = make('div', this.CSS.cell, {
      innerHTML: 'Month-cell',
      contentEditable: true
    });

    TdEl22.appendChild(Cell22);

    TrEl2.appendChild(TdEl21);
    TrEl2.appendChild(TdEl22);

    //
    TBodyEl.appendChild(TrEl1);
    TBodyEl.appendChild(TrEl2);

    TableEl.appendChild(TBodyEl);

    return TableEl;
  }
}
