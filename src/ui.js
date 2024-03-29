import {
  make,
  findIndex,
  clazz,
  showElement,
  hideElements,
} from "@groupher/editor-utils";

import { SETTING } from "./constant";

import MoveLeftIcon from "./svg/move-left.svg";
import MoveRightIcon from "./svg/move-right.svg";
import MoveUpIcon from "./svg/move-up.svg";
import MoveDownIcon from "./svg/move-down.svg";

import AddIcon from "./svg/add.svg";
import DeleteIcon from "./svg/delete.svg";

import AlignCenterIcon from "./svg/align-center.svg";
import AlignLeftIcon from "./svg/align-left.svg";
import AlignRightIcon from "./svg/align-right.svg";

import {
  formatData,
  addHeader,
  deleteHeader,
  addColumn,
  deleteColumn,
  addZebraStripe,
  deleteZebraStripe,
  moveColumn,
  addRow,
  deleteRow,
  moveRow,
  whichColumn,
  whichRow,
  setAlignClass,
  setAlignData,
  resizableTable,
} from "./helper";

/**
 * @typedef {Object} TableData
 * @description Table Tool's  data format
 * @property {number} columnCount — column count
 * @property {[CellItem]} items - array of cell item
 */

/**
 * @typedef {Object} CellItem
 * @description cell item
 * @property {string} text - inner text in cell (td)
 * @property {string} align — left | center | right
 */

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
  constructor({ config, api, reRender }) {
    this.api = api;
    this.reRender = reRender;

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
      table: null,
    };

    this._data = {};

    this.columnHandlers = [];
    this.columnActions = [];

    this.rowHandlers = [];
    this.rowActions = [];

    this.activeColumnIndex = null;
    this.activeRowIndex = null;
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
      header: "cdx-table__header",
      cell: "cdx-table__cell",
      stripe: "cdx-table__td_stripe",
      // not for directly use
      _cellAlign: "cdx-table__cell_align_",
      columnHandler: "cdx-table__column_handler",
      columnActions: "cdx-table__column_actions",
      columnActionIcon: "cdx-table__column_action_icon",

      rowHandler: "cdx-table__row_handler",
      rowActions: "cdx-table__row_actions",
      rowActionIcon: "cdx-table__row_action_icon",
      rowZebra: "cdx-table__zebra_row",

      activeColumnTd: "cdx-table__active_column",
      activeRowTd: "cdx-table__active_row",
      activeTdTop: "cdx-table__active_top",
      activeTdBottom: "cdx-table__active_bottom",
      activeTdLeft: "cdx-table__active_left",
      activeTdRight: "cdx-table__active_right",
    };
  }

  /**
   * draw render View
   * @param {TableData} data
   * @return {HTMLElement}
   */
  drawView(data) {
    this._data = formatData(data);
    const wrapperEl = make("div", this.CSS.baseClass);
    const containerEl = make("div", this.CSS.container);

    this.nodes.table = this._drawTable();

    containerEl.appendChild(this.nodes.table);
    wrapperEl.appendChild(containerEl);

    // if click outside, then clean up the active status
    // see: https://stackoverflow.com/a/28432139/4050784
    document.addEventListener("click", this._handleOutsideClick.bind(this));

    setTimeout(() => resizableTable(this.nodes.table));

    this.nodes.wrapperEl = wrapperEl;

    return wrapperEl;
  }

  /**
   * clear active handler/highlights state when click outside
   * 注意这里有 hack, 如果只用 document 来判断，在 paragraph 被 focus
   * 的时候不会触发（原因未知）。所以在 save 时又做了一次校验来判断，但是付过
   * 只用 save 时判断，在 list 中有不会被触发（原因未知），所以这个逻辑结合
   * 两种方法一起判断，尚不清楚这是 editor.js 自身的问题还是相关插件的问题，
   * 总之这块儿是相当的狗。
   *
   * @param {HTMLElementEvent} e
   * @memberof UI
   */
  _handleOutsideClick(e) {
    const isClickOutside = !this.nodes.wrapperEl.contains(e.target);

    if (isClickOutside) {
      this._doOutsideCleanUpStaff();
    }
  }

  _doOutsideCleanUpStaff() {
    this._hideAllHandlers();
    this._cleanUpHighlights();

    this.activeColumnIndex = null;
    this.activeRowIndex = null;
  }

  /**
   * clean up and render
   * @param {TableData} data
   * @return {void}
   * @memberof UI
   */
  redraw(data) {
    this._data = data;
    this.activeColumnIndex = null;
    this.activeRowIndex = null;
    this.columnHandlers = [];
    this.columnActions = [];

    this.rowHandlers = [];
    this.rowActions = [];

    document.removeEventListener("click", this._handleOutsideClick.bind(this));
    this.reRender(data);
  }

  /**
   * handle setting action
   *
   * @param {String} action - value of SETTING
   * @memberof UI
   */
  handleSettingAction(action) {
    if (action === SETTING.TOGGLE_HEADER) {
      this._data.withHeader
        ? this._deleteTableHeader()
        : this._addTableHeader();
      return;
    }

    if (action === SETTING.TOGGLE_ZEBRA) {
      this._data.withStripe
        ? this._deleteZebraStripe()
        : this._addZebraStripe();
    }
  }

  /**
   * add header to table
   *
   * @memberof UI
   */
  _addTableHeader() {
    const newData = addHeader(this._data);

    this.redraw(newData);
  }

  /**
   * remove table header
   *
   * @memberof UI
   */
  _deleteTableHeader() {
    const newData = deleteHeader(this._data);

    this.redraw(newData);
  }

  /**
   * add header to table
   *
   * @memberof UI
   */
  _addZebraStripe() {
    const newData = addZebraStripe(this._data);

    this.redraw(newData);
  }

  /**
   * remove table header
   *
   * @memberof UI
   */
  _deleteZebraStripe() {
    const newData = deleteZebraStripe(this._data);

    this.redraw(newData);
  }

  /**
   * draw table element
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawTable() {
    const tableEl = make("table", this.CSS.table);
    const tbodyEl = make("tbody");

    const { columnCount, items } = this._data;

    for (let i = 0; i < items.length; i += columnCount) {
      const rowCellItems = items.slice(i, i + columnCount);

      tbodyEl.appendChild(this._drawRow(rowCellItems));
    }

    tableEl.appendChild(tbodyEl);

    return tableEl;
  }

  /**
   * draw a table row
   * @param {[CellItem]} items
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawRow(items) {
    const rowEl = make("tr");

    items.forEach((item) => {
      rowEl.appendChild(this._drawCell(item));
    });

    return rowEl;
  }

  /**
   * draw cell in table row
   * @param {CellItem} item
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawCell(item) {
    // const headerClass = item.isHeader ? this.CSS.header : "";
    // const TdEl = make('td', headerClass);

    const stripClass = item.isStripe ? this.CSS.stripe : "";

    const wrapperEl = item.isHeader
      ? make("th", this.CSS.header)
      : make("td", stripClass);

    const cellEl = make(
      "div",
      [this.CSS.cell, `${this.CSS._cellAlign}${item.align}`],
      {
        innerHTML: item.text,
        contentEditable: true,
        "data-index": item.index,
        "data-row-index": whichRow(item.index, this._data),
        "data-column-index": whichColumn(item.index, this._data),
        "data-skip-plus-button": true,
      }
    );

    wrapperEl.appendChild(cellEl);

    if (item.index < this._data.columnCount) {
      const handlerEl = this._drawColumnSettingHandler(item);
      const ActionsEl = this._drawColumnActions(item);

      wrapperEl.appendChild(handlerEl);
      wrapperEl.appendChild(ActionsEl);

      this.columnHandlers.push(handlerEl);
      this.columnActions.push(ActionsEl);
    }

    if (item.index % this._data.columnCount === 0) {
      const handlerEl = this._drawRowSettingHandler(item);
      const ActionsEl = this._drawRowActions(item);

      wrapperEl.appendChild(handlerEl);
      wrapperEl.appendChild(ActionsEl);

      this.rowHandlers.push(handlerEl);
      this.rowActions.push(ActionsEl);
    }

    cellEl.addEventListener("click", () => this._cleanUpHighlights());
    cellEl.addEventListener("input", (e) => {
      const index = e.target.dataset.index;

      this._data.items[index].text = e.target.innerHTML;
    });

    wrapperEl.addEventListener("click", (e) => {
      const index = e.target.dataset.index;

      this._showRowHandler(index);
      this._showColumnHandler(index);
    });

    return wrapperEl;
  }

  /**
   * change columns action align icon
   * @param {HTMLElement} el - column action element
   * @param {Number} columnIndex
   * @return {void}
   * @memberof UI
   * @private
   */
  _changeAlignIcon(el, columnIndex) {
    const alignEl = el.querySelector('[data-action="align"]');
    const cellEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}[data-column-index="${columnIndex}"]`
    );

    let nextAlign;

    if (alignEl.dataset.align === "left") {
      nextAlign = "center";
    } else if (alignEl.dataset.align === "center") {
      nextAlign = "right";
    } else if (alignEl.dataset.align === "right") {
      nextAlign = "left";
    }

    setTimeout(() => {
      setAlignClass(cellEls, nextAlign);
      this._data = setAlignData(columnIndex, nextAlign, this._data);
      alignEl.setAttribute("data-align", nextAlign);
      alignEl.innerHTML = this._getAlignIcon(nextAlign);
    });
  }

  /**
   * get svg icon by align type
   *
   * @param {String} align - left | center | right
   * @returns {String} svg format
   * @memberof UI
   * @private
   */
  _getAlignIcon(align) {
    switch (align) {
      case "center": {
        return AlignCenterIcon;
      }
      case "right": {
        return AlignRightIcon;
      }
      default: {
        return AlignLeftIcon;
      }
    }
  }

  /**
   * draw column actions
   *
   * @param {CellItem} item
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawColumnActions(item) {
    const columnIndex = whichColumn(item.index, this._data);

    const wrapperEl = make("div", this.CSS.columnActions, {
      "data-column-index": columnIndex,
    });

    const moveLeftEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveLeftIcon,
    });

    const moveRightEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveRightIcon,
    });

    const addEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: AddIcon,
    });

    const deleteEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: DeleteIcon,
    });

    const alignEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: this._getAlignIcon(item.align),
      "data-action": "align",
      "data-align": item.align,
    });

    alignEl.addEventListener("click", (e) => {
      this._changeAlignIcon(wrapperEl, columnIndex);
    });

    moveLeftEl.addEventListener("click", (e) => {
      const newData = moveColumn(this._data, columnIndex, "left");

      this.redraw(newData);

      // simulate keep highlight state
      setTimeout(() => {
        let nextColumnIndex = whichColumn(item.index, this._data) - 1;
        let nextItemIndex = item.index - 1;

        if (nextColumnIndex < 0) {
          nextColumnIndex = this._data.columnCount - 1;
          nextItemIndex = nextColumnIndex;
        }

        this._showColumnActions(nextItemIndex);
        this._highlightColumn(nextColumnIndex);
      }, 100);
    });

    moveRightEl.addEventListener("click", (e) => {
      const newData = moveColumn(this._data, columnIndex, "right");

      this.redraw(newData);

      // simulate keep highlight state
      setTimeout(() => {
        let nextColumnIndex = whichColumn(item.index, this._data) + 1;
        let nextItemIndex = item.index + 1;

        if (nextColumnIndex === this._data.columnCount) {
          nextColumnIndex = 0;
          nextItemIndex = 0;
        }

        this._showColumnActions(nextItemIndex);
        this._highlightColumn(nextColumnIndex);
      }, 100);
    });

    deleteEl.addEventListener("click", (e) => {
      const newData = deleteColumn(this._data, columnIndex);

      this.redraw(newData);
    });

    addEl.addEventListener("click", (e) => {
      const newData = addColumn(this._data, columnIndex);

      this.redraw(newData);
    });

    this.api.tooltip.onHover(addEl, "增加一列", { delay: 200 });
    this.api.tooltip.onHover(deleteEl, "删除当前列", { delay: 200 });
    this.api.tooltip.onHover(alignEl, "对齐方式", { delay: 200 });

    wrapperEl.appendChild(moveLeftEl);
    wrapperEl.appendChild(moveRightEl);
    wrapperEl.appendChild(alignEl);
    wrapperEl.appendChild(addEl);
    wrapperEl.appendChild(deleteEl);

    return wrapperEl;
  }

  /**
   * draw column actions
   *
   * @param {CellItem} item
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawRowActions(item) {
    const rowIndex = whichRow(item.index, this._data);

    const wrapperEl = make("div", this.CSS.rowActions, {
      "data-row-index": rowIndex,
    });

    const moveUpEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveUpIcon,
    });

    const moveDownEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveDownIcon,
    });

    const addEl = make("div", this.CSS.rowActionIcon, {
      innerHTML: AddIcon,
    });

    const deleteEl = make("div", this.CSS.rowActionIcon, {
      innerHTML: DeleteIcon,
    });

    moveUpEl.addEventListener("click", (e) => {
      const newData = moveRow(this._data, rowIndex, "up");

      this.redraw(newData);

      // simulate keep highlight state
      setTimeout(() => {
        const { withHeader, columnCount, items } = this._data;
        let nextRowItemIndex = item.index - columnCount;

        if (withHeader && nextRowItemIndex < columnCount - 1) {
          nextRowItemIndex = items.length - 1;
        } else if (nextRowItemIndex < 0) {
          nextRowItemIndex = items.length - 1;
        }

        this._highlightRow(nextRowItemIndex);
        this._showRowActions(nextRowItemIndex);
      }, 100);
    });

    moveDownEl.addEventListener("click", (e) => {
      const newData = moveRow(this._data, rowIndex, "down");

      this.redraw(newData);

      // simulate keep highlight state
      setTimeout(() => {
        const { withHeader, columnCount, items } = this._data;
        let nextRowItemIndex = item.index + columnCount;
        // highlight the first line

        if (nextRowItemIndex === items.length) {
          if (withHeader) {
            nextRowItemIndex = columnCount;
          } else {
            nextRowItemIndex = 0;
          }
        }

        this._highlightRow(nextRowItemIndex);
        this._showRowActions(nextRowItemIndex);
      }, 100);
    });

    addEl.addEventListener("click", (e) => {
      const newData = addRow(this._data, rowIndex);

      this.redraw(newData);
    });

    deleteEl.addEventListener("click", (e) => {
      const newData = deleteRow(this._data, rowIndex);

      this.redraw(newData);
    });

    this.api.tooltip.onHover(addEl, "增加一行", {
      delay: 200,
      placement: "right",
    });
    this.api.tooltip.onHover(deleteEl, "删除当前行", {
      delay: 200,
      placement: "right",
    });

    wrapperEl.appendChild(moveUpEl);
    wrapperEl.appendChild(moveDownEl);
    wrapperEl.appendChild(addEl);
    wrapperEl.appendChild(deleteEl);

    return wrapperEl;
  }

  /**
   * draw column handler
   *
   * @param {CellItem} item
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawColumnSettingHandler(item) {
    const handlerEl = make("div", this.CSS.columnHandler, {
      "data-column-index": whichColumn(item.index, this._data),
    });

    handlerEl.addEventListener("click", (e) => {
      this._highlightColumn(item.index);
      this._hideAllHandlers();
      this._showColumnActions(item.index);
    });

    return handlerEl;
  }

  /**
   * draw raw handler
   *
   * @param {CellItem} item
   * @return {HTMLElement}
   * @memberof UI
   * @private
   */
  _drawRowSettingHandler(item) {
    const { withHeader } = this._data;
    const rowIndex = whichRow(item.index, this._data);

    const handlerEl = make("div", this.CSS.rowHandler, {
      "data-row-index": rowIndex,
    });

    if (withHeader && rowIndex === 0) {
      // header row
      handlerEl.style.cursor = "not-allowed";
    } else {
      handlerEl.style.cursor = "pointer";
    }

    handlerEl.addEventListener("click", (e) => {
      if (withHeader && rowIndex === 0) {
        return false;
      }

      this._highlightRow(item.index);
      this._hideAllHandlers();
      this._showRowActions(item.index);
    });

    return handlerEl;
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showColumnActions(index) {
    const columnIndex = whichColumn(index, this._data);
    const handlerEls = this.columnActions;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    showElement(targetIndex, handlerEls, "flex");
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showRowActions(index) {
    const rowIndex = whichRow(index, this._data);
    const handlerEls = this.rowActions;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.rowIndex) === rowIndex;
    });

    showElement(targetIndex, handlerEls, "flex");
  }

  /**
   *
   * @param {Number} index
   * @return {void}
   * @memberof UI
   */
  _showColumnHandler(index) {
    const columnIndex = whichColumn(index, this._data);

    const handlerEls = this.columnHandlers;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    showElement(targetIndex, handlerEls);
  }

  /**
   *
   * @param {Number} index
   * @return {void}
   * @memberof UI
   */
  _showRowHandler(index) {
    const rowIndex = whichRow(index, this._data);
    const handlerEls = this.rowHandlers;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.rowIndex) === rowIndex;
    });

    showElement(targetIndex, handlerEls);
  }

  /**
   * highlight column
   * @return {void}
   * @memberof UI
   */
  _highlightColumn(index) {
    this.activeColumnIndex = index;
    this._unHighlightCells();

    const columnEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}[data-column-index="${index}"]`
    );

    setTimeout(() => {
      columnEls.forEach((item, idx) => {
        clazz.toggle(item.parentNode, this.CSS.activeColumnTd);
        if (idx === 0) {
          clazz.toggle(item.parentNode, this.CSS.activeTdTop);
        }
        if (idx === columnEls.length - 1) {
          clazz.toggle(item.parentNode, this.CSS.activeTdBottom);
        }
      });
    });
  }

  /**
   * highlight column
   * @return {void}
   * @memberof UI
   */
  _highlightRow(index) {
    this.activeRowIndex = index;
    this._unHighlightCells();

    const rowIndex = whichRow(index, this._data);

    const rowEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}[data-row-index="${rowIndex}"]`
    );

    setTimeout(() => {
      rowEls.forEach((item, idx) => {
        clazz.toggle(item.parentNode, this.CSS.activeRowTd);
        if (idx === 0) {
          clazz.toggle(item.parentNode, this.CSS.activeTdLeft);
        }
        if (idx === rowEls.length - 1) {
          clazz.toggle(item.parentNode, this.CSS.activeTdRight);
        }
      });
    });
  }

  /**
   * clean up highlighted column or row, if needed
   *
   * @memberof UI
   */
  _cleanUpHighlights() {
    this._unHighlightCells();
    this._hideAllActions();
  }

  /**
   * _unHighlightCells
   *
   * @memberof UI
   */
  _unHighlightCells() {
    const allColumnEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}`
    );

    allColumnEls.forEach((item) => {
      clazz.remove(item.parentNode, this.CSS.activeColumnTd);
      clazz.remove(item.parentNode, this.CSS.activeRowTd);

      clazz.remove(item.parentNode, this.CSS.activeTdTop);
      clazz.remove(item.parentNode, this.CSS.activeTdBottom);
      clazz.remove(item.parentNode, this.CSS.activeTdLeft);
      clazz.remove(item.parentNode, this.CSS.activeTdRight);
    });
  }

  /**
   * _hideAllHandlers
   * @memberof UI
   */
  _hideAllHandlers() {
    hideElements([...this.columnHandlers, ...this.rowHandlers]);
  }

  /**
   * hide all actions
   *
   * @memberof UI
   */
  _hideAllActions() {
    hideElements([...this.columnActions, ...this.rowActions]);
  }

  /**
   * set resized width if need
   *
   * @param {TableData} data
   * @returns
   * @memberof UI
   */
  _setCellWidthIfNeed(data) {
    const allCellEls = this.nodes.table.querySelectorAll(`.${this.CSS.cell}`);

    for (let i = 0; i < allCellEls.length; i++) {
      const cellEl = allCellEls[i];
      const TDResizedWidth = cellEl.parentNode.style.width;

      //  NOTE:  only set first row if resized data is fine
      // no need to set all column with the some column index
      if (TDResizedWidth) {
        data.items[i].width = TDResizedWidth;
      }
    }

    return data;
  }

  /**
   * Return Tool data
   * @return {TableData} data
   */
  get data() {
    const activeClassList = document.activeElement.classList;

    if (
      // 某些 handler 是绝对定位, 此时 activeElement 为 body
      activeClassList.length !== 0 &&
      !activeClassList.contains(this.CSS.cell)
    ) {
      this._doOutsideCleanUpStaff();
    }

    return this._setCellWidthIfNeed(this._data);
  }
}
