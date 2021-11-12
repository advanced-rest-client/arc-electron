/* eslint-disable no-param-reassign */
import { PlatformBindings, EventTypes, Events } from '../../../web_modules/index.js';
import { UniversalAnalytics } from '../lib/UniversalAnalytics.js';

/** @typedef {import('@advanced-rest-client/events').TelemetryExceptionEvent} TelemetryExceptionEvent */
/** @typedef {import('@advanced-rest-client/events').TelemetryTimingEvent} TelemetryTimingEvent */
/** @typedef {import('@advanced-rest-client/events').TelemetryEventEvent} TelemetryEventEvent */
/** @typedef {import('@advanced-rest-client/events').TelemetryScreenEvent} TelemetryScreenEvent */
/** @typedef {import('@advanced-rest-client/events').Config.ARCConfig} ARCConfig */
/** @typedef {import('../lib/Analytics').AnalyticsInit} AnalyticsInit */
/** @typedef {import('../lib/Analytics').Tracker} Tracker */

const channelValue = Symbol('channelValue');

export class GoogleAnalyticsBindings extends PlatformBindings {
  get channel() {
    return this[channelValue];
  }

  set channel(value) {
    const old = this[channelValue];
    if (old === value) {
      return;
    }
    this[channelValue] = value;
    this.setupChannel(value);
  }

  constructor() {
    super();
    /** 
     * Whether or not the Google Analytics is enabled.
     * When disabled all functions are void.
     */
    this.telemetry = false;

    /** 
     * The client ID needed to maintain the session.
     */
    this.clientId = undefined;

    /** 
     * When `telemetry` equals `false` and this is `true` then it will allow to send 
     * information about exceptions only to google analytics.
     */
    this.exceptionsOnly = false;

    /** 
     * The application identifier.
     */
    this.appId = 'com.mulesoft.arc';

    /** 
     * The application name.
     */
    this.appName = 'Advanced REST Client';

    /** 
     * @type {Tracker[]}
     */
    this.trackers = [];
  }

  addCustomDimensions() {
    // @ts-ignore
    const { versionInfo } = global;
    const cd = [
      {
        index: 1,
        value: versionInfo.chrome,
      },
      {
        index: 2,
        value: versionInfo.appVersion,
      }
    ];
    this.trackers.forEach((tracker) => {
      tracker.analytics.customDimensions = cd;
    });
    // channel is set up via the `channel` property.
  }

  async initialize() {
    let settings = /** @type ARCConfig */ ({});
    try {
      settings = (await Events.Config.readAll(document.body)) || {};
    } catch (e) {
      // ...
    }
    
    const { privacy={}, updater={} } = settings;
    this.channel = updater.channel || 'stable';
    this.telemetry = typeof privacy.telemetry === 'boolean' ? privacy.telemetry : false;
    try {
      await this.setupClientId(privacy.clientId);
    } catch (e) {
      // ...
    }
    this.setupTrackers();
    window.addEventListener(EventTypes.Telemetry.event, this.eventHandler.bind(this));
    window.addEventListener(EventTypes.Telemetry.exception, this.exceptionHandler.bind(this));
    window.addEventListener(EventTypes.Telemetry.view, this.viewHandler.bind(this));
    window.addEventListener(EventTypes.Telemetry.timing, this.timingHandler.bind(this));
    ArcEnvironment.ipc.on('preferences-value-updated', this.preferenceHandler.bind(this));
  }

  /**
   * Sets up tracker instances.
   */
  setupTrackers() {
    const base = /** @type AnalyticsInit */ ({
      trackingId: '',
      clientId: this.clientId,
      appName: this.appName,
      appVersion: window.versionInfo.appVersion,
      appId: this.appId,
      // debug: true,
      // debugEndpoint: true,
    });
    /** 
     * @type {Tracker[]}
     */
    this.trackers = [
      {
        analytics: new UniversalAnalytics({ ...base, trackingId: 'UA-18021184-6' }),
        type: 'web',
      },
      {
        analytics: new UniversalAnalytics({ ...base, trackingId: 'UA-18021184-14' }),
        type: 'app',
      },
      {
        analytics: new UniversalAnalytics({ ...base, trackingId: 'UA-71458341-1' }),
        type: 'app',
      }
    ];
  }

  /**
   * Sets the client id. When the `clientId` is not provided it generates one and updated the application settings.
   * @param {string=} clientId 
   */
  async setupClientId(clientId) {
    if (typeof clientId === 'string') {
      this.clientId = clientId;
      return;
    }
    this.clientId = ArcEnvironment.uuid();
    await ArcEnvironment.ipc.invoke('preferences-update', 'privacy.clientId', this.clientId);
  }

  /**
   * @param {string} screenName
   */
  screenView(screenName) {
    if (!this.telemetry) {
      return;
    }
    this.trackers.forEach((tracker) => {
      if (tracker.type === 'web') {
        tracker.analytics.sendPage(screenName);
      } else {
        tracker.analytics.sendScreen(screenName);
      }
    });
  }

  /**
   * @param {string} category
   * @param {string} action
   * @param {string=} label
   * @param {number=} value
   */
  event(category, action, label, value) {
    if (!this.telemetry) {
      return;
    }
    this.trackers.forEach((tracker) => {
      tracker.analytics.sendEvent(category, action, label, value);
    });
  }

  /**
   * @param {string} message
   * @param {boolean} fatal
   */
  exception(message, fatal) {
    if (!this.telemetry) {
      return;
    }
    this.trackers.forEach((tracker) => {
      tracker.analytics.sendException(message, fatal);
    });
  }

  /**
   * @param {string} category
   * @param {string} variable
   * @param {number} value
   * @param {string=} label
   */
  timing(category, variable, value, label) {
    if (!this.telemetry) {
      return;
    }
    this.trackers.forEach((tracker) => {
      tracker.analytics.sendTimings(category, variable, value, label);
    });
  }

  /**
   * @param {TelemetryScreenEvent} e
   */
  viewHandler(e) {
    const { screenName } = e.detail;
    this.screenView(screenName);
  }

  /**
   * @param {TelemetryEventEvent} e
   */
  eventHandler(e) {
    const { action, category, label, value } = e.detail;
    this.event(category, action, label, value);
  }

  /**
   * @param {TelemetryExceptionEvent} e
   */
  exceptionHandler(e) {
    const { description, fatal } = e.detail;
    this.exception(description, fatal);
  }

  /**
   * @param {TelemetryTimingEvent} e
   */
  timingHandler(e) {
    const { category, variable, value, label } = e.detail;
    this.timing(category, variable, value, label);
  }

  /**
   * @param {string} value The application release channel.
   */
  setupChannel(value) {
    this.trackers.forEach((tracker) => {
      const index = tracker.analytics.customDimensions.findIndex((i) => i.index === 5);
      if (index === -1) {
        tracker.analytics.customDimensions.push({
          index: 5,
          value,
        });
      } else {
        tracker.analytics.customDimensions[index].value = value;
      }
    });
  }

  /**
   * Handler for the IO event for settings update.
   *
   * @param {Electron.IpcRendererEvent} e
   * @param {String} key The key of changed property
   * @param {any} value
   */
  preferenceHandler(e, key, value) {
    switch (key) {
      case 'privacy.telemetry': this.telemetry = value; break;
      case 'updater.channel': this.channel = value; break;
      default:
    }
  }
}
