import {PolymerElement} from '../../web_modules/@polymer/polymer/polymer-element.js';
import {html} from '../../web_modules/@polymer/polymer/lib/utils/html-tag.js';
import {afterNextRender} from '../../web_modules/@polymer/polymer/lib/utils/render-status.js';
import '../../web_modules/@polymer/font-roboto-local/roboto.js';
import '../../web_modules/@polymer/paper-item/paper-item.js';
import '../../web_modules/@polymer/iron-flex-layout/iron-flex-layout.js';
import '../../web_modules/@polymer/iron-icon/iron-icon.js';
import '../../web_modules/@advanced-rest-client/arc-icons/arc-icons.js';
/* global appProcess, BrowserWindow, app */
/**
 * @customElement
 * @polymer
 * @demo demo/index.html
 * @memberof ApiElements
 */
class ArcTaskManager extends PolymerElement {
  static get template() {
    return html`<style>
    :host {
      display: block;
      background-color: #fff;
      overflow: auto;
      @apply --layout-fit;
      font-size: 14px;
    }

    .title {
      @apply --layout-flex;
    }

    .pid,
    .cpu-usage,
    .memory-working-size,
    .memory-private-size,
    .memory-shared-size {
      padding-left: 8px;
      padding-right: 8px;
      text-align: right;
      -webkit-user-select: text;
      user-select: text;
    }

    .cpu-usage {
      width: 60px;
    }

    .pid {
      width: 60px;
    }

    .memory-working-size,
    .memory-private-size,
    .memory-shared-size {
      width: 90px;
    }

    .th {
      font-weight: 500;
      @apply --layout-horizontal;
      @apply --layout-center;
      height: 48px;
      padding: 0 16px;
      font-size: 13px;
    }

    .th > div {
      @apply --layout-horizontal;
      @apply --layout-center;
      @apply --layout-end-justified;
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
    }

    .th > div.title {
      @apply --layout-start-justified;
    }

    .th .label {
      display: block;
      height: 23px;
    }

    div[ordered] {
      /* padding-right: 0px; */
    }
    </style>
    <div class="th">

      <div class="title" ordered\$="[[orderTitle]]" on-click="_changeOrder" data-order-property="title">
        <span class="label">Process</span>
        <template is="dom-if" if="[[orderTitle]]" restamp>
          <iron-icon icon="[[_computeOrderIcon(orderDirection)]]"></iron-icon>
        </template>
      </div>

      <div class="pid" ordered\$="[[orderPid]]" on-click="_changeOrder" data-order-property="pid">
        <span class="label">Pid</span>
        <template is="dom-if" if="[[orderPid]]" restamp>
          <iron-icon icon="[[_computeOrderIcon(orderDirection)]]"></iron-icon>
        </template>
      </div>
      <div class="cpu-usage" ordered\$="[[orderCpu]]" on-click="_changeOrder" data-order-property="cpu-usage">
        <span class="label">CPU</span>
        <template is="dom-if" if="[[orderCpu]]" restamp>
          <iron-icon icon="[[_computeOrderIcon(orderDirection)]]"></iron-icon>
        </template>
      </div>
      <div class="memory-working-size"
        ordered\$="[[orderMemWorkingSize]]" on-click="_changeOrder" data-order-property="memory-working">
        <span class="label">Memory</span>
        <template is="dom-if" if="[[orderMemWorkingSize]]" restamp>
          <iron-icon icon="[[_computeOrderIcon(orderDirection)]]"></iron-icon>
        </template>
      </div>
      <div class="memory-private-size"
        ordered\$="[[orderMemPrivateSize]]" on-click="_changeOrder" data-order-property="memory-private">
        <span class="label">Private memory</span>
        <template is="dom-if" if="[[orderMemPrivateSize]]" restamp>
          <iron-icon icon="[[_computeOrderIcon(orderDirection)]]"></iron-icon>
        </template>
      </div>
      <div class="memory-shared-size"
        ordered\$="[[orderMemSharedSize]]" on-click="_changeOrder" data-order-property="memory-shared">
        <span class="label">Shared memory</span>
        <template is="dom-if" if="[[orderMemSharedSize]]" restamp>
          <iron-icon icon="[[_computeOrderIcon(orderDirection)]]"></iron-icon>
        </template>
      </div>
    </div>
    <template is="dom-repeat" items="[[items]]" sort="_sortItems" id="list">
      <paper-item>
        <div class="title">[[item.title]]</div>
        <div class="pid">[[item.pid]]</div>
        <div class="cpu-usage">[[item.cpu.usage]]</div>
        <div class="memory-working-size">[[item.memory.workingSetSize]]</div>
        <div class="memory-private-size">[[item.memory.privateBytes]]</div>
        <div class="memory-shared-size">[[item.memory.sharedBytes]]</div>
      </paper-item>
    </template>`;
  }

  static get properties() {
    return {
      // List of items to display in the table.
      items: Array,
      // True if the window is active.
      active: Boolean,
      // True if ordering by title is enabled
      orderTitle: Boolean,
      // True if ordering by pid is enabled
      orderPid: Boolean,
      // True if ordering by cpu is enabled
      orderCpu: Boolean,
      // True if ordering by memory working size is enabled
      orderMemWorkingSize: Boolean,
      // True if ordering by memory private size is enabled
      orderMemPrivateSize: Boolean,
      // True if ordering by memory shared size is enabled
      orderMemSharedSize: Boolean,
      // Order direction. `acs` or `desc`.
      orderDirection: {
        type: String,
        value: 'asc'
      },
      // Order property name
      orderProperty: String,
      mainId: {
        type: Number
      },
      thisPid: {
        type: Number
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this.active = true;
    afterNextRender(this, () => {
      this.setupGlobalVariables();
      this.refresh();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.active = false;
  }

  setupGlobalVariables() {
    this.mainId = appProcess.pid;
    this.thisPid = appProcess.pid;
  }

  refresh() {
    if (!this.active) {
      return;
    }
    let metrics = app.getAppMetrics();
    metrics = this.translateMetrics(metrics);
    this.set('items', metrics);
    setTimeout(() => this.refresh(), 2000);
  }

  /**
   * Translates electron app metrics into the data model.
   *
   * @param {Array<Object>} metrics List of current metrics
   * @return {Array} Internal data model.
   */
  translateMetrics(metrics) {
    const result = metrics.map((metric) => {
      const cpu = this.translateCpuMetrics(metric.cpu);
      let memory;
      // https://github.com/electron/electron/issues/16179
      if (metric.memory) {
        memory = this.translateMemoryMetrics(metric.memory);
      } else {
        memory = this._emptyMemoryInfo();
      }
      const title = this.translateMetricTitle(metric.type, metric.pid);
      return {
        pid: metric.pid,
        memory,
        cpu,
        title
      };
    });
    return result;
  }
  /**
   * Translates `type` property of the metric to a title to display
   * @param {String} type Metric type value
   * @param {Number} pid OS process id
   * @return {String} Title related to the type.
   */
  translateMetricTitle(type, pid) {
    if (this.mainId === pid) {
      return 'Application main thread';
    }
    if (this.thisPid === pid) {
      return 'Task manager';
    }
    const windows = BrowserWindow.getAllWindows();
    for (let i = 0; i < windows.length; i++) {
      if (windows[i].webContents.getOSProcessId() === pid) {
        let title = windows[i].getTitle();
        if (title) {
          return title;
        }
      }
    }
    switch (type) {
      case 'Tab': return 'Application window';
      case 'Browser': return 'Application';
      default: return type;
    }
  }
  /**
   * Creates a data model for the CPU usage.
   *
   * @param {Object} cpu CPU metric
   * @return {Object} Data model for CPU metrics
   */
  translateCpuMetrics(cpu) {
    return {
      usage: Math.round(cpu.percentCPUUsage),
      usageCompare: cpu.percentCPUUsage
      // wakeups: cpu.idleWakeupsPerSecond
    };
  }
  /**
   * Creates a data model for memory usage metrics
   *
   * @param {Object} memory Memory metric
   * @return {Object} Memory usage metrics
   */
  translateMemoryMetrics(memory) {
    return {
      // peak: peakWorkingSetSize
      workingSetSize: this.computeBytes(memory.workingSetSize),
      workingSetSizeCompare: memory.workingSetSize,
      privateBytes: this.computeBytes(memory.privateBytes),
      privateBytesCompare: memory.privateBytes,
      sharedBytes: this.computeBytes(memory.sharedBytes),
      sharedBytesCompare: memory.sharedBytes
    };
  }

  _emptyMemoryInfo() {
    return {
      workingSetSize: 'unknown',
      workingSetSizeCompare: 0,
      privateBytes: 'unknown',
      privateBytesCompare: 0,
      sharedBytes: 'unknown',
      sharedBytesCompare: 0
    };
  }
  /**
   * Computes readable value of bytes usage.
   * https://stackoverflow.com/a/18650828/1127848
   *
   * @param {Number} bytes Number of bytes
   * @param {String} decimals Decimal number
   * @return {String} Size label
   */
  computeBytes(bytes, decimals) {
    if (!bytes) {
      return '0 B';
    }
    const k = 1024;
    const dm = decimals || 2;
    const sizes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  _computeOrderIcon(direction) {
    return direction === 'asc' ? 'arc:arrow-drop-down' : 'arc:arrow-drop-up';
  }

  _changeOrder(e) {
    const target = e.currentTarget;
    const property = target.dataset.orderProperty;
    if (property === this.orderProperty) {
      this.toggleOrder();
      this.$.list.render();
      return;
    }
    this._cancelOrderProperty();
    switch (property) {
      case 'title':
        this.orderTitle = true;
        break;
      case 'pid':
        this.orderPid = true;
        break;
      case 'cpu-usage':
        this.orderCpu = true;
        break;
      case 'memory-shared':
        this.orderMemSharedSize = true;
        break;
      case 'memory-private':
        this.orderMemPrivateSize = true;
        break;
      case 'memory-working':
        this.orderMemWorkingSize = true;
        break;
    }
    this.orderProperty = property;
    this.$.list.render();
  }

  _cancelOrderProperty() {
    const prop = this.orderProperty;
    switch (prop) {
      case 'title':
        this.orderTitle = false;
        break;
      case 'pid':
        this.orderPid = false;
        break;
      case 'cpu-usage':
        this.orderCpu = false;
        break;
      case 'memory-shared':
        this.orderMemSharedSize = false;
        break;
      case 'memory-private':
        this.orderMemPrivateSize = false;
        break;
      case 'memory-working':
        this.orderMemWorkingSize = false;
        break;
    }
    this.orderProperty = undefined;
  }

  toggleOrder() {
    this.orderDirection = this.orderDirection === 'asc' ? 'desc' : 'asc';
  }

  _sortItems(a, b) {
    const prop = this.orderProperty;
    switch (prop) {
      case 'title': return this._sortTitle(a, b);
      case 'pid': return this._sortPid(a, b);
      case 'cpu-usage': return this._sortCpu(a, b);
      case 'memory-shared': return this._sortMemory(a, b, 'sharedBytesCompare');
      case 'memory-private': return this._sortMemory(a, b, 'privateBytesCompare');
      case 'memory-working': return this._sortMemory(a, b, 'workingSetSizeCompare');
    }
  }

  _sortTitle(a, b) {
    const dir = this.orderDirection;
    const result = a.title.localeCompare(b.title);
    if (dir === 'desc') {
      return -result;
    }
    return result;
  }

  _sortPid(a, b) {
    let result = 0;
    if (a.pid > b.pid) {
      result = -1;
    }
    if (a.pid < b.pid) {
      result = 1;
    }
    if (result === 0) {
      return result;
    }
    return this.orderDirection === 'asc' ? result : -result;
  }

  _sortCpu(a, b) {
    let result = 0;
    if (a.cpu.usageCompare > b.cpu.usageCompare) {
      result = -1;
    }
    if (a.cpu.usageCompare < b.cpu.usageCompare) {
      result = 1;
    }
    if (result === 0) {
      return result;
    }
    return this.orderDirection === 'asc' ? result : -result;
  }

  _sortMemory(a, b, property) {
    let result = 0;
    const aValue = a.memory[property];
    const bValue = b.memory[property];

    if (aValue > bValue) {
      result = -1;
    }
    if (aValue < bValue) {
      result = 1;
    }
    if (result === 0) {
      return result;
    }
    return this.orderDirection === 'asc' ? result : -result;
  }
}
window.customElements.define('arc-task-manager', ArcTaskManager);
