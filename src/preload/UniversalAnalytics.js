/* eslint-disable no-param-reassign */
/** @typedef {import('./Analytics').AnalyticsInit} AnalyticsInit */
/** @typedef {import('./Analytics').CustomMetric} CustomMetric */
/** @typedef {import('./Analytics').CustomDimension} CustomDimension */
/** @typedef {import('./Analytics').BaseHitOptions} BaseHitOptions */

export const initializingValue = Symbol('initializingValue');

/**
 * **Required for all hit types.**
 *
 * The Protocol version. The current value is '1'. This will only change when there
 * are changes made that are not backwards compatible.
 *
 * - Parameter: **v**
 * - Example value: 1
 * - Example usage: v=1
 *
 * @type {Number}
 */
const protocolVersion = 1;
/**
 * A map of parameter names to its descriptions.
 * @type {Object}
 */
export const paramsMap = {
  v: 'Protocol Version',
  tid: 'Tracking ID / Web Property ID',
  aip: 'Anonymize IP',
  ds: 'Data Source',
  qt: 'Queue Time',
  z: 'Cache Buster',
  cid: 'Client ID',
  uid: 'User ID',
  sc: 'Session Control',
  uip: 'IP Override',
  ua: 'User Agent Override',
  geoip: 'Geographical Override',
  dr: 'Document Referrer',
  cn: 'Campaign Name',
  cs: 'Campaign Source',
  cm: 'Campaign Medium',
  ck: 'Campaign Keyword',
  cc: 'Campaign Content',
  ci: 'Campaign ID',
  gclid: 'Google AdWords ID',
  dclid: 'Google Display Ads ID',
  sr: 'Screen Resolution',
  vp: 'Viewport size',
  de: 'Document Encoding',
  sd: 'Screen Colors',
  ul: 'User Language',
  je: 'Java Enabled',
  fl: 'Flash Version',
  t: 'Hit type',
  ni: 'Non-Interaction Hit',
  dl: 'Document location URL',
  dh: 'Document Host Name',
  dp: 'Document Path',
  dt: 'Document Title',
  cd: 'Screen Name',
  linkid: 'Link ID',
  an: 'Application Name',
  aid: 'Application ID',
  av: 'Application Version',
  aiid: 'Application Installer ID',
  ec: 'Event Category',
  ea: 'Event Action',
  el: 'Event Label',
  ev: 'Event Value',
  sn: 'Social Network',
  sa: 'Social Action',
  st: 'Social Action Target',
  utc: 'User timing category',
  utv: 'User timing variable name',
  utt: 'User timing time',
  utl: 'User timing label',
  plt: 'Page Load Time',
  dns: 'DNS Time',
  pdt: 'Page Download Time',
  rrt: 'Redirect Response Time',
  tcp: 'TCP Connect Time',
  srt: 'Server Response Time',
  dit: 'DOM Interactive Time',
  clt: 'Content Load Time',
  exd: 'Exception Description',
  exf: 'Is Exception Fatal?',
  xid: 'Experiment ID',
  xvar: 'Experiment Variant'
};

for (let i = 1; i < 201; i++) {
  paramsMap[`cd${i}`] = `Custom dimension #${i}`;
  paramsMap[`cm${i}`] = `Custom metric #${i}`;
}

/**
 * List of hist to be send when came back from offline state.
 * Note, this is in memory information only.
 * The component do not stores this information.
 *
 * @type {string[]}
 */
export const offlineQueue = [];

export class UniversalAnalytics {
  /**
   * The Client ID for the measurement protocol.
   *
   * **It is required for all types of calls.**
   *
   * The value of this field should be a random UUID (version 4) as described
   * in http://www.ietf.org/rfc/rfc4122.txt
   *
   * - Parameter: **cid**
   * - Example value: 35009a79-1a05-49d7-b876-2b884d0f825b
   * - Example usage: cid=35009a79-1a05-49d7-b876-2b884d0f825b
   *
   * @returns {string}
   */
  get clientId() {
    return this._clientId;
  }

  set clientId(value) {
    this._clientId = value;
    this._configureBaseParams();
  }

  /**
   * This is intended to be a known identifier for a user provided by the site owner/tracking
   * library user. It must not itself be PII (personally identifiable information).
   * The value should never be persisted in GA cookies or other Analytics provided storage.
   *
   * - Parameter: **uid**
   * - Example value: as8eknlll
   * - Example usage: uid=as8eknlll
   *
   * @returns {string}
   */
  get userId() {
    return this._userId;
  }

  set userId(value) {
    this._userId = value;
    this._configureBaseParams();
  }

  /**
   * **Required for all hit types.**
   *
   * The tracking ID / web property ID. The format is UA-XXXX-Y.
   * All collected data is associated by this ID.
   *
   * - Parameter: **tid**
   * - Example value: UA-XXXX-Y
   * - Example usage: tid=UA-XXXX-Y
   *
   * @returns {string}
   */
  get trackingId() {
    return this._trackingId;
  }

  set trackingId(value) {
    this._trackingId = value;
    this._configureBaseParams();
  }

  /**
   * When present, the IP address of the sender will be anonymized.
   * For example, the IP will be anonymized if any of the following parameters are present in
   * the payload: &aip=, &aip=0, or &aip=1
   *
   * - Parameter: **aip**
   * - Example value: 1
   * - Example usage: aip=1
   * @returns {boolean}
   */
  get anonymizeIp() {
    return this._anonymizeIp;
  }

  set anonymizeIp(value) {
    this._anonymizeIp = value;
    this._configureBaseParams();
  }

  /**
   * Indicates the data source of the hit. Hits sent from analytics.js will have data source
   * set to 'web'; hits sent from one of the mobile SDKs will have data source set to 'app'.
   *
   * - Parameter: **ds**
   * - Example value: call center
   * - Example usage: ds=call%20center
   *
   * @returns {string}
   */
  get dataSource() {
    return this._dataSource;
  }

  set dataSource(value) {
    this._dataSource = value;
    this._configureBaseParams();
  }

  /**
   * Used to send a random number in GET requests to ensure browsers and proxies
   * don't cache hits.
   *
   * - Parameter: **z**
   * - Example value: 289372387623
   * - Example usage: z=289372387623
   *
   * @returns {boolean}
   */
  get useCacheBooster() {
    return this._useCacheBooster;
  }

  set useCacheBooster(value) {
    this._useCacheBooster = value;
  }

  /**
   * Specifies which referral source brought traffic to a website. This value is also used to
   * compute the traffic source. The format of this value is a URL.
   *
   * - Parameter: **dr**
   * - Example value: http://example.com
   * - Example usage: dr=http%3A%2F%2Fexample.com
   *
   * @returns {string}
   */
  get referrer() {
    return this._referrer;
  }

  set referrer(value) {
    this._referrer = value;
    this._configureBaseParams();
  }

  /**
   * Specifies the campaign name.
   *
   * - Parameter: **cn**
   * - Example value: (direct)
   * - Example usage: cn=%28direct%29
   *
   * @returns {string}
   */
  get campaignName() {
    return this._campaignName;
  }

  set campaignName(value) {
    this._campaignName = value;
    this._configureBaseParams();
  }

  /**
   * Specifies the campaign source.
   *
   * - Parameter: **cs**
   * - Example value: (direct)
   * - Example usage: cs=%28direct%29
   *
   * @returns {string}
   */
  get campaignSource() {
    return this._campaignSource;
  }

  set campaignSource(value) {
    this._campaignSource = value;
    this._configureBaseParams();
  }

  /**
   * Specifies the campaign medium.
   *
   * - Parameter: **cm**
   * - Example value: organic
   * - Example usage: cm=organic
   *
   * @returns {string}
   */
  get campaignMedium() {
    return this._campaignMedium;
  }

  set campaignMedium(value) {
    this._campaignMedium = value;
    this._configureBaseParams();
  }

  /**
   * Specifies the application version.
   *
   * - Parameter: **av**
   * - Example value: 1.2
   * - Example usage: av=1.2
   *
   * @returns {string}
   */
  get appVersion() {
    return this._appVersion;
  }

  set appVersion(value) {
    this._appVersion = value;
    this._configureBaseParams();
  }

  /**
   * Specifies the application name. This field is required for any hit that has app related
   * data (i.e., app version, app ID, or app installer ID). For hits sent to web properties,
   * this field is optional.
   *
   * - Parameter: **an**
   * - Example My App
   * - Example usage: an=My%20App
   *
   * @returns {string}
   */
  get appName() {
    return this._appName;
  }

  set appName(value) {
    this._appName = value;
    this._configureBaseParams();
  }

  /**
   * Application identifier.
   *
   * - Parameter: **aid**
   * - Example value: com.company.app
   * - Example usage: aid=com.company.app
   *
   * @returns {string}
   */
  get appId() {
    return this._appId;
  }

  set appId(value) {
    this._appId = value;
    this._configureBaseParams();
  }

  /**
   * Application installer identifier.
   *
   * - Parameter: **aiid**
   * - Example value: com.platform.vending
   * - Example usage: aiid=com.platform.vending
   *
   * @returns {string}
   */
  get appInstallerId() {
    return this._appInstallerId;
  }

  set appInstallerId(value) {
    this._appInstallerId = value;
    this._configureBaseParams();
  }

  /**
   * If set to true it will prints debug messages into the console.
   *
   * @returns {boolean}
   */
  get debug() {
    return this._debug;
  }

  set debug(value) {
    this._debug = value;
  }

  /**
   * If set it will send the data to GA's debug endpoint and the request won't be actually saved but only validated
   * 
   * @returns {boolean}
   */
  get debugEndpoint() {
    return this._debugEndpoint;
  }

  set debugEndpoint(value) {
    this._debugEndpoint = value;
  }

  /**
   * When set it queues requests to GA in memory and attempts to send the requests
   * again when this flag is removed.
   *
   * @returns {boolean}
   */
  get offline() {
    return this._offline;
  }

  set offline(value) {
    this._offline = value;
    this._offlineChanged(value);
  }

  /**
   * Generated POST parameters based on a params
   * @returns {Record<string, string>}
   */
  get _baseParams() {
    return this.__baseParams;
  }

  set _baseParams(value) {
    this.__baseParams = value;
  }

  /**
   * Each custom metric has an associated index. There is a maximum of 20 custom
   * metrics (200 for Analytics 360 accounts). The metric index must be a positive
   * integer between 1 and 200, inclusive.
   *
   * - Parameter: **cm<metricIndex>**
   * - Example value: 47
   * - Example usage: cm1=47
   *
   * @return {CustomMetric[]}
   */
  get customMetrics() {
    return this._customMetrics;
  }

  set customMetrics(value) {
    this._customMetrics = value;
  }

  /**
   * Each custom dimension has an associated index. There is a maximum of 20 custom
   * dimensions (200 for Analytics 360 accounts). The dimension index must be a positive
   * integer between 1 and 200, inclusive.
   *
   * - Parameter: **cd<dimensionIndex>**
   * - Example value: Sports
   * - Example usage: cd1=Sports
   *
   * @return {CustomDimension[]}
   */
  get customDimensions() {
    return this._customDimensions;
  }

  set customDimensions(value) {
    this._customDimensions = value;
  }
  
  /**
   * @param {AnalyticsInit} init
   */
  constructor(init) {
    this[initializingValue] = true;
    this.clientId = init.clientId;
    this.trackingId = init.trackingId;
    this._baseParams = {};
    this._customMetrics = [];
    this._customDimensions = [];

    if (typeof init.userId === 'string') {
      this.userId = init.userId;
    }
    if (typeof init.dataSource === 'string') {
      this.dataSource = init.dataSource;
    }
    if (typeof init.referrer === 'string') {
      this.referrer = init.referrer;
    }
    if (typeof init.campaignName === 'string') {
      this.campaignName = init.campaignName;
    }
    if (typeof init.campaignSource === 'string') {
      this.campaignSource = init.campaignSource;
    }
    if (typeof init.campaignMedium === 'string') {
      this.campaignMedium = init.campaignMedium;
    }
    if (typeof init.appVersion === 'string') {
      this.appVersion = init.appVersion;
    }
    if (typeof init.appName === 'string') {
      this.appName = init.appName;
    }
    if (typeof init.appId === 'string') {
      this.appId = init.appId;
    }
    if (typeof init.appInstallerId === 'string') {
      this.appInstallerId = init.appInstallerId;
    }
    if (typeof init.debugEndpoint === 'boolean') {
      this.debugEndpoint = init.debugEndpoint;
    }
    if (typeof init.anonymizeIp === 'boolean') {
      this.anonymizeIp = init.anonymizeIp;
    }
    if (typeof init.useCacheBooster === 'boolean') {
      this.useCacheBooster = init.useCacheBooster;
    }
    if (typeof init.debug === 'boolean') {
      this.debug = init.debug;
    }
    if (Array.isArray(init.customDimensions)) {
      this.customDimensions = init.customDimensions;
    }
    if (Array.isArray(init.customMetrics)) {
      this.customMetrics = init.customMetrics;
    }
    this[initializingValue] = false;
    this._configureBaseParams();
  }

  /**
   * Sends the screen view hit to the GA.
   *
   * @param {string} name Screen name.
   * @param {BaseHitOptions=} opts Custom data definition
   * @returns {Promise<void>}
   */
  sendScreen(name, opts) {
    const data = {
      cd: name,
    };
    this.appendCustomData(data, opts);
    return this.sendHit('screenview', data);
  }

  /**
   * Sends the screen view hit to the GA.
   *
   * @param {string} name Screen name.
   * @param {string=} hostName Document hostname.
   * @param {string=} path Page path
   * @param {BaseHitOptions=} opts Custom data definition
   * @returns {Promise<void>}
   */
  sendPage(name, hostName=window.location.hostname, path=window.location.pathname, opts) {
    const data = {
      dh: hostName,
      dp: path,
      dt: name,
    };
    this.appendCustomData(data, opts);
    return this.sendHit('pageview', data);
  }

  /**
   * Sends event tracking.
   *
   * @param {string} category Specifies the event category. Must not be empty.
   * @param {string} action Specifies the event action. Must not be empty.
   * @param {string=} label Specifies the event label. Optional value.
   * @param {number=} value Specifies the event value. Values must be non-negative. Optional.
   * @param {BaseHitOptions=} opts Custom data definition.
   * @returns {Promise<void>}
   */
  sendEvent(category, action, label, value, opts) {
    const missing = [];
    if (!category) {
      missing.push('category');
    }
    if (!action) {
      missing.push('action');
    }
    if (missing.length) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
    const data = {
      ec: category,
      ea: action
    };
    if (label) {
      data.el = label;
    }
    if (value) {
      data.ev = value;
    }
    this.appendCustomData(data, opts);
    return this.sendHit('event', data);
  }

  /**
   * Sends the exception hit to GA.
   *
   * @param {string} description A description of the exception.
   * @param {boolean} fatal Specifies whether the exception was fatal.
   * @param {BaseHitOptions=} opts Custom data definition.
   * @returns {Promise<void>}
   */
  sendException(description, fatal, opts) {
    const value = fatal ? '1' : '0';
    const data = {
      exd: description,
      exf: value,
    };
    this.appendCustomData(data, opts);
    return this.sendHit('exception', data);
  }

  /**
   * Track social interaction
   *
   * @param {string} network Specifies the social network, for example Facebook or Google Plus.
   * @param {string} action Specifies the social interaction action. For example on Google Plus
   * when a user clicks the +1 button, the social action is 'plus'.
   * @param {string} target Specifies the target of a social interaction. This value is
   * typically a URL but can be any text.
   * @param {BaseHitOptions=} opts Custom data definition.
   * @returns {Promise<void>}
   */
  sendSocial(network, action, target, opts) {
    const missing = [];
    if (!network) {
      missing.push('network');
    }
    if (!action) {
      missing.push('action');
    }
    if (!target) {
      missing.push('target');
    }
    if (missing.length) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
    const data = {
      sn: network,
      sa: action,
      st: target
    };
    this.appendCustomData(data, opts);
    return this.sendHit('social', data);
  }

  /**
   * Track timings in the app.
   *
   * @param {string} category Specifies the user timing category. **required**
   * @param {string} variable Specifies the user timing variable. **required**
   * @param {number} time Specifies the user timing value. The value is in milliseconds.
   * @param {string} label Specifies the user timing label.
   * @param {BaseHitOptions=} cmOpts Custom data definition.
   * @returns {Promise<void>}
   */
  sendTimings(category, variable, time, label, cmOpts) {
    const missing = [];
    if (!category) {
      missing.push('category');
    }
    if (!variable) {
      missing.push('variable');
    }
    if (!time) {
      missing.push('time');
    }
    if (missing.length) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
    const opts = {
      utc: category,
      utv: variable,
      utt: String(time)
    };
    if (label) {
      opts.utl = label;
    }
    this.appendCustomData(opts, cmOpts);
    return this.sendHit('timing', opts);
  }

  /**
   * Append custom metrics / dimensions definitions to the
   * parameters list.
   *
   * @param {Record<string, string>} data The data to send
   * @param {BaseHitOptions=} opts
   */
  appendCustomData(data, opts) {
    if (!opts) {
      return;
    }
    if (opts.customDimensions && opts.customDimensions.length) {
      opts.customDimensions.forEach((item) => {
        data[`cd${item.index}`] = item.value;
      });
    }
    if (opts.customMetrics && opts.customMetrics.length) {
      opts.customMetrics.forEach((item) => {
        data[`cm${item.index}`] = String(item.value);
      });
    }
  }

  /**
   * Send a hit to the GA server.
   * The `type` parameter is required for all types of hits.
   *
   * @param {string} type The type of hit. Must be one of 'pageview', 'screenview', 'event',
   * 'transaction', 'item', 'social', 'exception', 'timing'.
   * @param {Record<string, string>} params Map of params to send wit this hit.
   * @returns {Promise<void>}
   */
  sendHit(type, params) {
    if (!['pageview', 'screenview', 'event', 'transaction', 'item', 'social', 'exception', 'timing'].includes(type)) {
      throw new Error('Unknown hit type.');
    }
    params.t = type;
    this._processParams(params);
    const post = { ...this._baseParams, ...params};
    const body = this._createBody(post);
    if (this.debug) {
      /* eslint-disable-next-line */
      console.group('Running command for ', type);
      this._printParamsTable(post);
      /* eslint-disable-next-line */
      console.groupEnd();
    }
    return this._transport(body);
  }

  /**
   * Encodes parameters.
   * @param {Record<string, string>} params
   */
  _processParams(params) {
    Object.keys(params).forEach((param) => {
      params[param] = this.encodeQueryString(params[param]);
    });
  }

  /**
   * Creates a post body from the params.
   * @param {Record<string, string>} params List of parameters to send
   * @returns {string} Request body
   */
  _createBody(params) {
    let result = '';
    Object.keys(params).forEach((param) => {
      if (result) {
        result += '&';
      }
      result += `${param}=${params[param]}`;
    });
    return result;
  }

  /**
   * @param {string} str The value to URL encode
   * @returns {string} The encoded value;
   */
  encodeQueryString(str) {
    if (!str) {
      return str;
    }
    const regexp = /%20/g;
    return encodeURIComponent(str).replace(regexp, '+');
  }

  _configureBaseParams() {
    if (this[initializingValue]) {
      return;
    }
    const { screen } = window;
    const data = {
      v: String(protocolVersion),
      tid: this.trackingId,
      cid: this.clientId,
      ul: navigator.language,
      sr: `${screen.width}x${screen.height}`,
      sd: String(screen.pixelDepth)
    };
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    if (iw && ih) {
      data.vp = `${iw}x${ih}`;
    }

    if (this.userId) {
      data.uid = this.userId;
    }
    if (this.anonymizeIp) {
      data.aip = '1';
    }
    if (this.dataSource) {
      data.ds = this.encodeQueryString(this.dataSource);
    }
    if (this.referrer) {
      data.dr = this.encodeQueryString(this.referrer);
    }
    if (this.campaignName) {
      data.cn = this.encodeQueryString(this.campaignName);
    }
    if (this.campaignSource) {
      data.cs = this.encodeQueryString(this.campaignSource);
    }
    if (this.campaignMedium) {
      data.cm = this.encodeQueryString(this.campaignMedium);
    }
    if (this.appVersion) {
      data.av = this.encodeQueryString(this.appVersion);
    }
    if (this.appName) {
      data.an = this.encodeQueryString(this.appName);
    }
    if (this.appId) {
      data.aid = this.encodeQueryString(this.appId);
    }
    if (this.appInstallerId) {
      data.aiid = this.encodeQueryString(this.appInstallerId);
    }
    if (this.customMetrics.length) {
      this.customMetrics.forEach((cm) => {
        data[`cm${cm.index}`] = this.encodeQueryString(String(cm.value));
      });
    }
    if (this._customDimensions.length) {
      this._customDimensions.forEach((cd) => {
        data[`cd${cd.index}`] = this.encodeQueryString(cd.value);
      });
    }
    if (this.debug) {
      /* eslint-disable-next-line */
      console.info('[GA] Configuring base object', data);
    }
    this._baseParams = data;
  }

  /**
   * @param {Record<string, string>} list
   */
  _printParamsTable(list) {
    const map = {};
    const debugList = [];
    Object.keys(list).forEach((param) => {
      const name = paramsMap[param] || param;
      const value = decodeURIComponent(list[param]);
      map[param] = {
        value,
        name
      };
      debugList.push({
        param,
        value,
        name
      });
    });
    /* eslint-disable-next-line */
    console.table(map, ['name', 'value']);
  }

  /**
   * @param {string} body The message to send
   * @returns {Promise<void>} 
   */
  async _transport(body) {
    const { offline } = this;
    if (offline) {
      offlineQueue.push(body);
      return;
    }

    const init = {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    };
    let url = 'https://www.google-analytics.com';
    if (this.debugEndpoint) {
      url += '/debug';
    }
    url += '/collect';
    if (this.useCacheBooster) {
      url += `?z=${  Date.now()}`;
    }

    try {
      const response = await fetch(url, init);
      if (response.status !== 200) {
        if (!offline) {
          offlineQueue.push(body);
        } else {
          throw new Error('Unable send analytics data.');
        }
      }
      if (this.debugEndpoint) {
        const result = await response.json();
        // eslint-disable-next-line no-console
        console.log(result);
      }
    } catch (e) {
      if (!navigator.onLine && !offline) {
        offlineQueue.push(body);
        return;
      }
      /* eslint-disable-next-line */
      console.warn(e);
      // throw new Error('Unable to send data');
    }
  }

  /**
   * @param {boolean} value
   * @returns {Promise<void>} 
   */
  async _offlineChanged(value) {
    if (value || !offlineQueue.length) {
      // Nothing to do when offline of no pending tasks.
      return;
    }
    const p = [];
    for (let i = offlineQueue.length - 1; i >= 0; i--) {
      const body = offlineQueue[i];
      offlineQueue.splice(i, 1);
      p[p.length] = this._transport(body);
    }
    try {
      await Promise.all(p)
    } catch (e) {
      /* eslint-disable-next-line */
      console.warn(e);
    };
  }
}
