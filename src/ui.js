// eslint-disable-next-line
import ajax from "@codexteam/ajax";
// eslint-disable-next-line
import polyfill from "url-polyfill";
import { make, findIndex, clazz } from "@groupher/editor-utils";

import MoveLeftIcon from "./svg/move-left.svg";
import MoveRightIcon from "./svg/move-right.svg";
import MoveUpIcon from "./svg/move-up.svg";
import MoveDownIcon from "./svg/move-down.svg";

import AddIcon from "./svg/add.svg";
import DeleteIcon from "./svg/delete.svg";

import AlignCenterIcon from "./svg/align-center.svg";

import {
  mapIndex,
  addColumn,
  addRow,
  deleteRow,
  showEl,
  hideAllEls,
  whichColumn,
  whichRow,
} from "./helper";

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
      cell: "cdx-table__cell",
      columnHandler: "cdx-table__column_handler",
      columnActions: "cdx-table__column_actions",
      columnActionIcon: "cdx-table__column_action_icon",

      rowHandler: "cdx-table__row_handler",
      rowActions: "cdx-table__row_actions",
      rowActionIcon: "cdx-table__row_action_icon",

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
   */
  drawView(data) {
    this.data = mapIndex(data);
    const wrapperEl = make("div", this.CSS.baseClass);
    const containerEl = make("div", this.CSS.container);

    this.nodes.table = this._drawTable();

    containerEl.appendChild(this.nodes.table);
    wrapperEl.appendChild(containerEl);

    // if click outside, then clean up the active status
    // see: https://stackoverflow.com/a/28432139/4050784
    document.addEventListener("click", (e) => {
      const isClickOutside = !wrapperEl.contains(e.target);

      if (isClickOutside) {
        this._hideAllHandlers();
        this._cleanUpHighlights();

        this.activeColumnIndex = null;
        this.activeRowIndex = null;
      }
    });

    this.nodes.wrapperEl = wrapperEl;

    return wrapperEl;
  }

  /**
   * TODO
   *
   * @param {*} data
   * @memberof UI
   */
  redraw(data) {
    this.activeColumnIndex = null;
    this.activeRowIndex = null;
    this.columnHandlers = [];
    this.columnActions = [];

    this.rowHandlers = [];
    this.rowActions = [];

    this.reRender(data);
  }

  /**
   * draw table element
   */
  _drawTable() {
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
      "data-row-index": whichRow(item.index, this.data),
      "data-column-index": whichColumn(item.index, this.data),
    });

    TdEl.appendChild(CellEl);

    if (item.index < this.data.columnCount) {
      const HandlerEl = this._drawColumnSettingHandler(item);
      const ActionsEl = this._drawColumnActions(item);

      TdEl.appendChild(HandlerEl);
      TdEl.appendChild(ActionsEl);

      this.columnHandlers.push(HandlerEl);
      this.columnActions.push(ActionsEl);
    }

    if (item.index % this.data.columnCount === 0) {
      const HandlerEl = this._drawRowSettingHandler(item);
      const ActionsEl = this._drawRowActions(item);

      TdEl.appendChild(HandlerEl);
      TdEl.appendChild(ActionsEl);

      this.rowHandlers.push(HandlerEl);
      this.rowActions.push(ActionsEl);
    }

    CellEl.addEventListener("click", () => this._cleanUpHighlights());

    TdEl.addEventListener("click", (e) => {
      const index = e.target.dataset.index;

      this._showRowHandler(index);
      this._showColumnHandler(index);
    });

    return TdEl;
  }

  /**
   * draw column actions
   *
   * @memberof UI
   */
  _drawColumnActions(item) {
    const columnIndex = whichColumn(item.index, this.data);

    const WrapperEl = make("div", this.CSS.columnActions, {
      "data-column-index": columnIndex,
    });

    const MoveLeftEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveLeftIcon,
    });

    const MoveRightEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveRightIcon,
    });

    const AddEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: AddIcon,
    });

    const DeleteEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: DeleteIcon,
    });

    const AlignCenterEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: AlignCenterIcon,
    });

    DeleteEl.addEventListener("click", (e) => {
      console.log("delete it");
    });

    AddEl.addEventListener("click", (e) => {
      addColumn(this.data.items, columnIndex);
    });

    this.api.tooltip.onHover(AddEl, "增加一列", { delay: 1500 });
    this.api.tooltip.onHover(DeleteEl, "删除当前列", { delay: 1500 });
    this.api.tooltip.onHover(AlignCenterEl, "对齐方式", { delay: 1500 });

    WrapperEl.appendChild(MoveLeftEl);
    WrapperEl.appendChild(MoveRightEl);
    WrapperEl.appendChild(AlignCenterEl);
    WrapperEl.appendChild(AddEl);
    WrapperEl.appendChild(DeleteEl);

    return WrapperEl;
  }

  /**
   * draw column actions
   *
   * @memberof UI
   */
  _drawRowActions(item) {
    const rowIndex = whichRow(item.index, this.data);

    const WrapperEl = make("div", this.CSS.rowActions, {
      "data-row-index": rowIndex,
    });

    const MoveUpEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveUpIcon,
    });

    const MoveDownEl = make("div", this.CSS.columnActionIcon, {
      innerHTML: MoveDownIcon,
    });

    const AddEl = make("div", this.CSS.rowActionIcon, {
      innerHTML: AddIcon,
    });

    const DeleteEl = make("div", this.CSS.rowActionIcon, {
      innerHTML: DeleteIcon,
    });

    AddEl.addEventListener("click", (e) => {
      const newData = addRow(this.data, rowIndex);

      this.redraw(newData);
    });

    DeleteEl.addEventListener("click", (e) => {
      const newData = deleteRow(this.data, rowIndex);

      this.redraw(newData);
    });

    this.api.tooltip.onHover(AddEl, "增加一行", {
      delay: 1500,
      placement: "right",
    });
    this.api.tooltip.onHover(DeleteEl, "删除当前行", {
      delay: 1500,
      placement: "right",
    });

    WrapperEl.appendChild(MoveUpEl);
    WrapperEl.appendChild(MoveDownEl);
    WrapperEl.appendChild(AddEl);
    WrapperEl.appendChild(DeleteEl);

    return WrapperEl;
  }

  /**
   * draw column handler
   *
   * @memberof UI
   */
  _drawColumnSettingHandler(item) {
    const HandlerEl = make("div", this.CSS.columnHandler, {
      "data-column-index": whichColumn(item.index, this.data),
    });

    HandlerEl.addEventListener("click", (e) => {
      this._highlightColumn(item.index);
      this._hideAllHandlers();
      this._showColumnActions(item.index);
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
      "data-row-index": whichRow(item.index, this.data),
    });

    HandlerEl.addEventListener("click", (e) => {
      this._highlightRow(item.index);
      this._hideAllHandlers();
      this._showRowActions(item.index);
    });

    return HandlerEl;
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showColumnActions(index) {
    const columnIndex = whichColumn(index, this.data);
    const handlerEls = this.columnActions;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    showEl(targetIndex, handlerEls, "flex");
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showRowActions(index) {
    const rowIndex = whichRow(index, this.data);
    const handlerEls = this.rowActions;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.rowIndex) === rowIndex;
    });

    showEl(targetIndex, handlerEls, "flex");
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showColumnHandler(index) {
    const columnIndex = whichColumn(index, this.data);
    const handlerEls = this.columnHandlers;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    showEl(targetIndex, handlerEls);

    return targetIndex;
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showRowHandler(index) {
    const rowIndex = whichRow(index, this.data);
    const handlerEls = this.rowHandlers;

    const targetIndex = findIndex(handlerEls, (item) => {
      // console.log('#> each rowIndex: ', item.dataset.rowIndex);
      return parseInt(item.dataset.rowIndex) === rowIndex;
    });

    showEl(targetIndex, handlerEls);

    return targetIndex;
  }

  /**
   * highlight column
   *
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
   *
   * @memberof UI
   */
  _highlightRow(index) {
    this.activeRowIndex = index;
    this._unHighlightCells();

    const rowIndex = whichRow(index, this.data);

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
    hideAllEls([...this.columnHandlers, ...this.rowHandlers]);
  }

  /**
   * hide all actions
   *
   * @memberof UI
   */
  _hideAllActions() {
    hideAllEls([...this.columnActions, ...this.rowActions]);
  }
}
