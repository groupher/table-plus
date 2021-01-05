// eslint-disable-next-line
import ajax from "@codexteam/ajax";
// eslint-disable-next-line
import polyfill from "url-polyfill";
import { make, findIndex } from '@groupher/editor-utils';

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

    // this.data = data;
    this.data = {
      // 斑马线?
      // 有表头？
      // rowCount: 2
      columnCount: 3,
      items: [
        {
          text: 'cell 0',
          index: 0
          // align: '..',
        },
        {
          text: 'cell 1',
          index: 1
        },
        {
          text: 'cell 2',
          index: 2
        },
        {
          text: 'cell 3',
          index: 3
        },
        {
          text: 'cell 4',
          index: 4
        },
        {
          text: 'cell 5',
          index: 5
        }
      ]
    };

    this.rowHandlers = [];
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
      cell: 'cdx-table__cell',
      handler: 'cdx-table__handler'
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

    const { columnCount, items } = this.data;

    for (let i = 0; i < items.length; i += columnCount) {
      const rowCellItems = items.slice(i, i + columnCount);

      TBodyEl.appendChild(this._drawRow(rowCellItems));
    }

    TableEl.appendChild(TBodyEl);

    return TableEl;
  }

  /**
   * draw a table row
   *
   * @memberof UI
   */
  _drawRow(items) {
    const RowEl = make('tr');

    items.forEach((item) => {
      RowEl.appendChild(this._drawCell(item));
    });

    return RowEl;
  }

  /**
   * draw cell in table row
   *
   * @memberof UI
   */
  _drawCell(item) {
    const TdEl = make('td');
    const CellEl = make('div', this.CSS.cell, {
      innerHTML: item.text,
      contentEditable: true,
      'data-index': item.index
    });

    TdEl.appendChild(CellEl);

    if (item.index < this.data.columnCount) {
      const RowHandlerEl = this._drawRowSettingHandler(item);

      TdEl.appendChild(RowHandlerEl);
      this.rowHandlers.push(RowHandlerEl);
    }

    TdEl.addEventListener('mouseover', ({ target: { dataset } }) => {
      if (dataset.index) {
        this._showColumnHandler(dataset.index);
      }
    });

    return TdEl;
  }

  /**
   * judge column by given index
   *
   * @memberof UI
   */
  _whichColumn(index) {
    const { columnCount } = this.data;

    return parseInt(index) % columnCount;
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showColumnHandler(index) {
    const columnIndex = this._whichColumn(index);

    const targetIndex = findIndex(this.rowHandlers, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    if (targetIndex >= 0) {
      for (let i = 0; i < this.rowHandlers.length; i += 1) {
        const handlerEl = this.rowHandlers[i];

        handlerEl.style.opacity = 0;
      }
      this.rowHandlers[targetIndex].style.opacity = 1;
    }

    return targetIndex;
  }

  /**
   * draw handler
   *
   * @memberof UI
   */
  _drawRowSettingHandler(item) {
    const HandlerEl = make('div', this.CSS.handler, {
      'data-column-index': this._whichColumn(item.index)
    });

    return HandlerEl;
  }
  // _highlightRow () {}
  // _highlightColumn () {}
}
