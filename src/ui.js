// eslint-disable-next-line
import ajax from "@codexteam/ajax";
// eslint-disable-next-line
import polyfill from "url-polyfill";
import { make, findIndex, clazz } from '@groupher/editor-utils';

import MoveLeftIcon from './svg/move-left.svg';
import MoveRightIcon from './svg/move-right.svg';
import MoveUpIcon from './svg/move-up.svg';
import MoveDownIcon from './svg/move-down.svg';

import AddIcon from './svg/add.svg';
import DeleteIcon from './svg/delete.svg';

import AlignCenterIcon from './svg/align-center.svg';
// import AlignLeftIcon from './svg/align-left.svg';
// import AlignRightIcon from './svg/align-right.svg';

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
      wrapperEl: null,
      // container: null,
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
        },
        {
          text: 'cell 6',
          index: 6
        },
        {
          text: 'cell 7',
          index: 7
        },
        {
          text: 'cell 8',
          index: 8
        }
      ]
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
      container: 'cdx-table-wrapper',
      table: 'cdx-table',
      cell: 'cdx-table__cell',
      columnHandler: 'cdx-table__column_handler',
      columnActions: 'cdx-table__column_actions',
      columnActionIcon: 'cdx-table__column_action_icon',

      rowHandler: 'cdx-table__row_handler',
      rowActions: 'cdx-table__row_actions',
      rowActionIcon: 'cdx-table__row_action_icon',

      activeColumnTd: 'cdx-table__active_column',
      activeRowTd: 'cdx-table__active_row',
      activeTdTop: 'cdx-table__active_top',
      activeTdBottom: 'cdx-table__active_bottom',
      activeTdLeft: 'cdx-table__active_left',
      activeTdRight: 'cdx-table__active_right'
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

    // if click outside, then clean up the active status
    // see: https://stackoverflow.com/a/28432139/4050784
    document.addEventListener('click', (e) => {
      const isClickOutside = !wrapperEl.contains(e.target);

      if (isClickOutside) {
        this._cleanUpHandlers();
        this._cleanUpHighlights();

        this.activeColumnIndex = null;
        this.activeRowIndex = null;
      }
    });

    this.nodes.wrapperEl = wrapperEl;

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
      'data-index': item.index,
      'data-row-index': this._whichRow(item.index),
      'data-column-index': this._whichColumn(item.index)
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

    CellEl.addEventListener('click', () => this._cleanUpHighlights());

    TdEl.addEventListener('click', (e) => {
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
    const WrapperEl = make('div', this.CSS.columnActions, {
      'data-column-index': this._whichColumn(item.index)
    });

    const MoveLeftEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: MoveLeftIcon
    });

    const MoveRightEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: MoveRightIcon
    });

    const AddEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: AddIcon
    });

    const DeleteEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: DeleteIcon
    });

    const AlignCenterEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: AlignCenterIcon
    });

    DeleteEl.addEventListener('click', (e) => {
      console.log('delete it');
    });

    this.api.tooltip.onHover(AddEl, '增加一列', { delay: 1500 });
    this.api.tooltip.onHover(DeleteEl, '删除当前列', { delay: 1500 });
    this.api.tooltip.onHover(AlignCenterEl, '对齐方式', { delay: 1500 });

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
    const WrapperEl = make('div', this.CSS.rowActions, {
      'data-row-index': this._whichRow(item.index)
    });

    const MoveUpEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: MoveUpIcon
    });

    const MoveDownEl = make('div', this.CSS.columnActionIcon, {
      innerHTML: MoveDownIcon
    });

    const AddEl = make('div', this.CSS.rowActionIcon, {
      innerHTML: AddIcon
    });

    const DeleteEl = make('div', this.CSS.rowActionIcon, {
      innerHTML: DeleteIcon
    });

    DeleteEl.addEventListener('click', (e) => {
      console.log('delete it');
    });

    this.api.tooltip.onHover(AddEl, '增加一行', {
      delay: 1500,
      placement: 'right'
    });
    this.api.tooltip.onHover(DeleteEl, '删除当前行', {
      delay: 1500,
      placement: 'right'
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
    const HandlerEl = make('div', this.CSS.columnHandler, {
      'data-column-index': this._whichColumn(item.index)
    });

    HandlerEl.addEventListener('click', (e) => {
      this._highlightColumn(item.index);
      this._cleanUpHandlers();
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
    const HandlerEl = make('div', this.CSS.rowHandler, {
      'data-row-index': this._whichRow(item.index)
    });

    HandlerEl.addEventListener('click', (e) => {
      this._highlightRow(item.index);
      this._cleanUpHandlers();
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
    const columnIndex = this._whichColumn(index);
    const handlerEls = this.columnActions;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.columnIndex) === columnIndex;
    });

    if (targetIndex >= 0) {
      for (let i = 0; i < handlerEls.length; i += 1) {
        const handlerEl = handlerEls[i];

        handlerEl.style.display = 'none';
      }
      handlerEls[targetIndex].style.display = 'flex';
    }
  }

  /**
   *
   * @param {Number} index
   * @memberof UI
   */
  _showRowActions(index) {
    const rowIndex = this._whichRow(index);
    const handlerEls = this.rowActions;

    const targetIndex = findIndex(handlerEls, (item) => {
      return parseInt(item.dataset.rowIndex) === rowIndex;
    });

    if (targetIndex >= 0) {
      for (let i = 0; i < handlerEls.length; i += 1) {
        const handlerEl = handlerEls[i];

        handlerEl.style.display = 'none';
      }
      handlerEls[targetIndex].style.display = 'flex';
    }
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

        handlerEl.style.display = 'none';
      }
      handlerEls[targetIndex].style.display = 'block';
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

        handlerEl.style.display = 'none';
      }
      handlerEls[targetIndex].style.display = 'block';
    }

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

    columnEls.forEach((item, idx) => {
      clazz.toggle(item.parentNode, this.CSS.activeColumnTd);
      if (idx === 0) {
        clazz.toggle(item.parentNode, this.CSS.activeTdTop);
      }
      if (idx === columnEls.length - 1) {
        clazz.toggle(item.parentNode, this.CSS.activeTdBottom);
      }
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

    const rowIndex = this._whichRow(index);

    const rowEls = this.nodes.wrapperEl.querySelectorAll(
      `.${this.CSS.cell}[data-row-index="${rowIndex}"]`
    );

    rowEls.forEach((item, idx) => {
      clazz.toggle(item.parentNode, this.CSS.activeRowTd);
      if (idx === 0) {
        clazz.toggle(item.parentNode, this.CSS.activeTdLeft);
      }
      if (idx === rowEls.length - 1) {
        clazz.toggle(item.parentNode, this.CSS.activeTdRight);
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

  /**
   * _cleanUpHandlers
   * @memberof UI
   */
  _cleanUpHandlers() {
    for (let i = 0; i < this.rowHandlers.length; i += 1) {
      const handlerEl = this.rowHandlers[i];

      handlerEl.style.display = 'none';
    }

    for (let i = 0; i < this.columnHandlers.length; i += 1) {
      const handlerEl = this.columnHandlers[i];

      handlerEl.style.display = 'none';
    }
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
   * hide all actions
   *
   * @memberof UI
   */
  _hideAllActions() {
    const actionsEls = [...this.columnActions, ...this.rowActions];

    for (let i = 0; i < actionsEls.length; i += 1) {
      const actionsEl = actionsEls[i];

      actionsEl.style.display = 'none';
    }
  }
}
