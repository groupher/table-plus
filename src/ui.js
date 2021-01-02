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
  constructor({ data, config, api, changeView }) {
    this.api = api;
    this.changeView = changeView;

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
      progress: null,
      input: null,
      inputHolder: null,
      linkContent: null,
      linkImage: null,
      linkTitle: null,
      linkDescription: null,
      linkText: null
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
      container: 'link-tool',
      inputEl: 'link-tool__input',
      inputHolder: 'link-tool__input-holder',
      inputError: 'link-tool__input-holder--error',
      linkContent: 'link-tool__content',
      linkContentRendered: 'link-tool__content--rendered',
      linkImage: 'link-tool__image',
      linkTitle: 'link-tool__title',
      linkDescription: 'link-tool__description',
      linkText: 'link-tool__anchor',
      progress: 'link-tool__progress',
      progressLoading: 'link-tool__progress--loading',
      progressLoaded: 'link-tool__progress--loaded',

      // buttons
      settingsWrapper: 'cdx-custom-settings',
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive
    };
  }

  /**
   * just for debug
   *
   */
  async getFakeData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve({
          success: true,
          meta: {
            title: 'CodeX Team',
            // eslint-disable-next-line
            site_name: "CodeX",
            description:
              'Club of web-development, design and marketing. We build team learning how to build full-valued projects on the world market.',
            image: {
              url: 'https://codex.so/public/app/img/meta_img.png'
            }
          }
        });
      }, 1000);
    });
  }

  /**
   * Sends to backend pasted url and receives link data
   * @param {string} url - link source url
   */
  async fetchLinkData(url) {
    this._showProgress();
    // this.data = { link: url };
    this.data.link = url;

    try {
      // const response = await ajax.get({
      //   url: this.config.endpoint,
      //   data: {
      //     url,
      //   },
      // });

      // this.onFetch(response);
      const response = await this.getFakeData();

      console.log('the response: ', response);
      this.onFetch(response);
    } catch (error) {
      this.fetchingFailed('服务器：解析错误，请输入正确的 URL 地址');
    }
  }

  /**
   * Link data fetching callback
   * @param {UploadResponseFormat} response
   */
  onFetch(response) {
    if (!response || !response.success) {
      this.fetchingFailed('Can not get this link data, try another');
      return;
    }

    const metaData = response.meta;

    this.data.meta = metaData;

    if (!metaData) {
      this.fetchingFailed('Wrong response format from server');
      return;
    }

    this._hideProgress().then(() => {
      this.nodes.inputHolder.remove();
      this.changeView('card');
    });
  }

  /**
   * If data fetching failed, set input error style
   */
  applyErrorStyle() {
    this.nodes.inputHolder.classList.add(this.CSS.inputError);
    this.nodes.progress.remove();
  }

  /**
   * Handle link fetching errors
   * @private
   *
   * @param {string} errorMessage
   */
  fetchingFailed(errorMessage) {
    this.api.notifier.show({
      message: errorMessage,
      style: 'error'
    });

    this.applyErrorStyle();
  }

  /**
   * buildCardView
   */
  buildCardView() {
    console.log('buildCardView this.data: ', this.data);

    const wrapperEl = make('div', this.CSS.baseClass);
    const containerEl = make('div', this.CSS.container);

    this.nodes.container = containerEl;
    this.nodes.linkContent = this._prepareLinkPreview();

    containerEl.appendChild(this.nodes.linkContent);
    this._showLinkPreview(this.data.meta);

    wrapperEl.appendChild(containerEl);

    return wrapperEl;
  }

  /**
   * buildInputView
   */
  buildInputView() {
    const wrapperEl = make('div', this.CSS.baseClass);
    const containerEl = make('div', this.CSS.container);

    this.nodes.inputHolder = this._makeInputHolder();

    containerEl.appendChild(this.nodes.inputHolder);
    wrapperEl.appendChild(containerEl);

    return wrapperEl;
  }

  /**
   * for buildInputView
   * Prepare input holder
   * @return {HTMLElement} - url input
   * @private
   */
  _makeInputHolder() {
    const inputHolder = make('div', this.CSS.inputHolder);

    this.nodes.progress = make('label', this.CSS.progress);
    this.nodes.input = make('div', [this.CSS.input, this.CSS.inputEl], {
      contentEditable: true
    });

    // TODO: i18n
    this.nodes.input.dataset.placeholder = '链接地址';

    this.nodes.input.addEventListener('paste', (event) => {
      this.startFetching(event);
    });

    this.nodes.input.addEventListener('keydown', (event) => {
      const [ENTER, A] = [13, 65];
      const cmdPressed = event.ctrlKey || event.metaKey;

      switch (event.keyCode) {
        case ENTER:
          event.preventDefault();
          event.stopPropagation();

          this.startFetching(event);
          break;
        case A:
          if (cmdPressed) {
            this.selectLinkUrl(event);
          }
          break;
      }
    });

    inputHolder.appendChild(this.nodes.progress);
    inputHolder.appendChild(this.nodes.input);

    return inputHolder;
  }

  /**
   * Activates link data fetching by url
   */
  startFetching(event) {
    let url = this.nodes.input.textContent;

    if (event.type === 'paste') {
      url = (event.clipboardData || window.clipboardData).getData('text');
    }

    this.removeErrorStyle();
    this.fetchLinkData(url);
  }

  /**
   * If previous link data fetching failed, remove error styles
   */
  removeErrorStyle() {
    this.nodes.inputHolder.classList.remove(this.CSS.inputError);
    this.nodes.inputHolder.insertBefore(this.nodes.progress, this.nodes.input);
  }

  /**
   * Show loading progressbar
   * @private
   */
  _showProgress() {
    this.nodes.progress.classList.add(this.CSS.progressLoading);
  }

  /**
   * Hide loading progressbar
   * @private
   */
  _hideProgress() {
    return new Promise((resolve) => {
      this.nodes.progress.classList.remove(this.CSS.progressLoading);
      this.nodes.progress.classList.add(this.CSS.progressLoaded);

      setTimeout(resolve, 500);
    });
  }

  /**
   * for buildCardView: Prepare link preview holder
   * @return {HTMLElement}
   * @private
   */
  _prepareLinkPreview() {
    const { linkContent } = this.CSS;

    const holder = make('a', linkContent, {
      target: '_blank',
      rel: 'nofollow noindex noreferrer'
    });

    this.nodes.linkImage = make('div', this.CSS.linkImage);
    this.nodes.linkTitle = make('div', this.CSS.linkTitle);
    this.nodes.linkDescription = make('p', this.CSS.linkDescription);
    this.nodes.linkText = make('a', this.CSS.linkText);

    return holder;
  }

  /**
   * * for buildCardView: Compose link preview from fetched data
   * @param {metaData} meta - link meta data
   * @private
   */
  _showLinkPreview({ image, title, description }) {
    this.nodes.container.appendChild(this.nodes.linkContent);

    if (image && image.url) {
      this.nodes.linkImage.style.backgroundImage = 'url(' + image.url + ')';
      this.nodes.linkContent.appendChild(this.nodes.linkImage);
    }

    if (title) {
      this.nodes.linkTitle.textContent = title;
      this.nodes.linkContent.appendChild(this.nodes.linkTitle);
    }

    if (description) {
      this.nodes.linkDescription.textContent = description;
      this.nodes.linkContent.appendChild(this.nodes.linkDescription);
    }

    const { link } = this.data;
    const linkAddr = link.indexOf('http') === 0 ? link : `http://${link}`;

    this.nodes.linkContent.classList.add(this.CSS.linkContentRendered);
    this.nodes.linkContent.setAttribute('href', linkAddr);
    this.nodes.linkContent.appendChild(this.nodes.linkText);

    try {
      this.nodes.linkText.textContent = new URL(this.data.link).hostname;
      this.nodes.linkText.href = this.data.link;
    } catch (e) {
      const addr = this.data.link;

      this.nodes.linkText.textContent = addr;
      this.nodes.linkText.href = addr;
    }
  }
}
