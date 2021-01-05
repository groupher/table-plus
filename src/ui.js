// eslint-disable-next-line
import ajax from "@codexteam/ajax";
// eslint-disable-next-line
import polyfill from "url-polyfill";
import { make, findIndex, clazz } from "@groupher/editor-utils";

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
      endpoint: config.endpoint || "",
    };

    this.nodes = {
      // root element
      wrapperEl: null,
      // container: null,
      defaultTable: null,
    };

    this._data = {
      link: "",
      meta: {},
    };

    // this.data = data;
    this.data = {
      // 斑马线?
      // 有表头？
      // rowCount: 2
      columnCount: 3,
      items: [
        {
          text: "cell 0",
          index: 0,
          // align: '..',
        },
        {
          text: "cell 1",
          index: 1,
        },
        {
          text: "cell 2",
          index: 2,
        },
        {
          text: "cell 3",
          index: 3,
        },
        {
          text: "cell 4",
          index: 4,
        },
        {
          text: "cell 5",
          index: 5,
        },
        {
          text: "cell 6",
          index: 6,
        },
        {
          text: "cell 7",
          index: 7,
        },
        {
          text: "cell 8",
          index: 8,
        },
      ],
    };

    this.columnHandlers = [];
    this.rowHandlers = [];
    this.activeColumnIndex = null;
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
      container: "cdx-table-wrapper",
      table: "cdx-table",
      cell: "cdx-table__cell",
      columnHandler: "cdx-table__column_handler",
      rowHandler: "cdx-table__row_handler",
      activeTd: "cdx-table__active",
      activeTdTop: "cdx-table__active_top",
      activeTdBottom: "cdx-table__active_bottom",
    };
  }

  /**
   * draw render View
   */
  drawView() {
    const wrapperEl = make("div", this.CSS.baseClass);
    const containerEl = make("div", this.CSS.container);

    this.nodes.defaultTable = this._drawDefaultTable();

    containerEl.appendChild(this.nodes.defaultTable);
    wrapperEl.appendChild(containerEl);

    // if click outside, then clean up the active status
    // see: https://stackoverflow.com/a/28432139/4050784
    document.addEventListener("click", (e) => {
      const isClickOutside = !wrapperEl.contains(e.target);
      if (isClickOutside) {
        this._cleanUpHandlers();
      }
    });

    this.nodes.wrapperEl = wrapperEl;

    return wrapperEl;
  }

  /**
   * draw table element
   */
  _drawDefaultTable() {
    const TableEl = make("table", this.CSS.table);
    const TBodyEl = make("tbody");

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
    const RowEl = make("tr");

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
    const TdEl = make("td");
    const CellEl = make("div", this.CSS.cell, {
      innerHTML: item.text,
      contentEditable: true,
      "data-index": item.index,
      "data-row-index": this._whichRow(item.index),
      "data-column-index": this._whichColumn(item.index),
    });

    TdEl.appendChild(CellEl);

    if (item.index < this.data.columnCount) {
      const HandlerEl = this._drawColumnSettingHandler(item);

      TdEl.appendChild(HandlerEl);
      this.columnHandlers.push(HandlerEl);
    }

    if (item.index % this.data.columnCount === 0) {
      const HandlerEl = this._drawRowSettingHandler(item);

      TdEl.appendChild(HandlerEl);
      this.rowHandlers.push(HandlerEl);
    }

    TdEl.addEventListener("click", ({ target: { dataset } }) => {
      if (dataset.index) {
        this._showColumnHandler(dataset.index);
        this._showRowHandler(dataset.index);
      }
    });

    return TdEl;
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showColumnHandler(index) {
    const columnIndex = this._whichColumn(index);
    const handlerEls = this.columnHandlers;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    if (targetIndex >= 0) {
      for (let i = 0; i < handlerEls.length; i += 1) {
        const handlerEl = handlerEls[i];

        handlerEl.style.opacity = 0;
      }
      handlerEls[targetIndex].style.opacity = 1;
    }

    return targetIndex;
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showRowHandler(index) {
    const rowIndex = this._whichRow(index);
    const handlerEls = this.rowHandlers;

    // console.log('# rowIndex: ', rowIndex);
    // console.log('# row handlerEls: ', handlerEls);
    const targetIndex = findIndex(handlerEls, (item) => {
      // console.log('#> each rowIndex: ', item.dataset.rowIndex);
      return parseInt(item.dataset.rowIndex) === rowIndex;
    });

    // console.log('# targetIndex: ', targetIndex);

    if (targetIndex >= 0) {
      for (let i = 0; i < handlerEls.length; i += 1) {
        const handlerEl = handlerEls[i];

        handlerEl.style.opacity = 0;
      }
      handlerEls[targetIndex].style.opacity = 1;
    }

    return targetIndex;
  }

  /**
   * _cleanUpHandlers
   * @memberof UI
   */
  _cleanUpHandlers() {
    for (let i = 0; i < this.rowHandlers.length; i += 1) {
      const handlerEl = this.rowHandlers[i];

      handlerEl.style.opacity = 0;
    }

    for (let i = 0; i < this.columnHandlers.length; i += 1) {
      const handlerEl = this.columnHandlers[i];

      handlerEl.style.opacity = 0;
    }
  }

  /**
   * draw column handler
   *
   * @memberof UI
   */
  _drawColumnSettingHandler(item) {
    const HandlerEl = make("div", this.CSS.columnHandler, {
      "data-column-index": this._whichColumn(item.index),
    });

    HandlerEl.addEventListener("click", (e) => {
      this._highlightColumn(item.index);
    });

    return HandlerEl;
  }

  /**
   * draw raw handler
   *
   * @memberof UI
   */
  _drawRowSettingHandler(item) {
    const HandlerEl = make("div", this.CSS.rowHandler, {
      "data-row-index": this._whichRow(item.index),
    });

    return HandlerEl;
  }

  /**
   * highlight column
   *
   * @memberof UI
   */
  _highlightColumn(index) {
    this.activeColumnIndex = index;

    const allColumnEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}[data-column-index]`
    );

    allColumnEls.forEach((item) => {
      clazz.remove(item.parentNode, this.CSS.activeTd);
      clazz.remove(item.parentNode, this.CSS.activeTdTop);
      clazz.remove(item.parentNode, this.CSS.activeTdBottom);
    });

    const columnEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}[data-column-index="${index}"]`
    );

    columnEls.forEach((item, idx) => {
      clazz.toggle(item.parentNode, this.CSS.activeTd);
      if (idx === 0) {
        clazz.toggle(item.parentNode, this.CSS.activeTdTop);
      }
      if (idx === columnEls.length - 1) {
        clazz.toggle(item.parentNode, this.CSS.activeTdBottom);
      }
    });
  }

  /**
   * judge column by given index
   * @param {Number} index
   * @return {Number}
   * @memberof UI
   */
  _whichColumn(index) {
    const { columnCount } = this.data;

    return parseInt(index) % columnCount;
  }

  /**
   * judge row by given index
   * @param {Number} index
   * @return {Number}
   * @memberof UI
   */
  _whichRow(index) {
    const { columnCount } = this.data;

    return Math.floor(parseInt(index) / columnCount);
  }

  // _highlightRow () {}
  // _highlightColumn () {}
}
