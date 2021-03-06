import apiClient from "./api-client";
window.apiClient = apiClient;

/* Generic Helpers */
let self = {
  url: {
    fix: window.apiClient.fixUrl,
    parseQueryString(query) {
      query = query || window.location.href;
      if (!query) {
        return { };
      }
    
      return (/[?]/.test(query) ? query.split('?')[1] : query)
        .split('&')
        .reduce((params, param) => {
          let [ key, value ] = param.split('=');
          params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
          return params;
        }, { });
    },
    encode(value) {
      let encoded = window.encodeURI(value);
      encoded = self.url.replace(encoded, '?', '%3F');
      encoded = self.url.replace(encoded, '/', '%2F');
      encoded = self.url.replace(encoded, '#', '%23');
      return encoded;
    },
    replace(value, oldToken, newToken) {
      return self.text.replace(value, oldToken, newToken);
    }
  },
  text: {
    replace(value, oldToken, newToken) {
      let newValue = value;
      while (newValue.indexOf(oldToken) >= 0) {
        newValue = newValue.replace(oldToken, newToken);
      }
      return newValue;
    },
    pad(n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
  },
  xsrf: {
    config() {
      let xsrfToken = window.appState.xsrfToken;
      if (xsrfToken) {
        Vue.http.headers.common['xsrf-form-token'] = xsrfToken;
      }
    }
  },
  token: {
    setupAutoTokenRefresh() {
      if (window.appState.tokenExpiresMilliseconds > 90000)
      {
        setTimeout(this.refreshToken, window.appState.tokenExpiresMilliseconds - 90000);
      }
      else
      {
        this.refreshToken();
      }
    },
    refreshToken() {
      Vue.http.get(appHelpers.fixUrl('/token/refresh')).then(response => {
        window.appState.tokenExpires = response.body['expires'];
        window.appState.tokenExpiresMilliseconds = response.body['expires_in_milliseconds'];
        this.setupAutoTokenRefresh();
      });
    }
  },
  message: {
    getFromResponse(response, defaultVariant) {
      if (typeof response.body !== 'undefined' && response.body !== null) {
        let errors = [];
        defaultVariant = defaultVariant || 'danger';
        if (Array.isArray(response.body)) {
          errors = response.body;
        } else if(response.body.errors && Array.isArray(response.body.errors)) {
          errors = response.body.errors;
        } else if(response.body.messages && Array.isArray(response.body.messages)) {
          errors = response.body.messages;
        } else {
          errors = [ `An HTTP ${response.status} error prevented this operation from completing` ];
        }
        return errors.map(error => {
          if (error.text) {
            return self.message.create(error.text, error.variant || defaultVariant)
          } else {
            return self.message.create(error, defaultVariant);
          }
        });
      } else if (Array.isArray(response)) {
        let messages = [];
        response.forEach((r) => {
          messages = messages.concat(self.message.getFromResponse(r, defaultVariant))
        });
        return messages;
      }
    },
    create(text, variant) {
      return {
        text: text,
        variant: variant || 'danger'
      };
    }
  },
  loader: {
    listeners: [],
    currentCounter: 0,
    register(listener) {
      self.loader.listeners.push(listener);
    },
    start() {
      self.loader.currentCounter++;
      self.loader.notify();
    },
    stop() {
      self.loader.currentCounter--;
      self.loader.notify();
    },
    notify() {
      self.loader.listeners.forEach((listener) => {
        listener(!!self.loader.currentCounter);
      });
    }
  },
  formatters: {
    formatDate (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm') : 'N/A';
    },
    formatDateSansTime (value) {
      return value ? moment(value).format('YYYY-MM-DD') : 'N/A';
    },
    formatDateSansTimeShort (value) {
      return value ? moment(value).format('MM/DD/YY') : 'N/A';
    },
    formatDateWithSeconds (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : 'N/A';
    },
    formatDateTime (value) {
      return value ? moment(value).format('YYYY-MM-DD HH:mm') : 'N/A';
    },
    formatCurrency (value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      });
      return formatter.format(typeof value == "number" ? value : parseFloat(value));
    },
    formatCurrencyInt (value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return formatter.format(typeof value == "number" ? value : parseFloat(value));
    },
    formatCurrencyExtreme (value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4
      });
      return formatter.format(typeof value == "number" ? value : parseFloat(value));
    },
    formatFloat (value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      return (typeof value == "number" ? value : parseFloat(value)).toFixed(2);
    },
    formatPreciseFloat (value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      return (typeof value == "number" ? value : parseFloat(value)).toFixed(4);
    },
    formatPercent(value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      return (typeof value == "number" ? value : parseFloat(value)).toFixed(1) + '%';
    },
    formatInt(value) {
      if (typeof value !== "number" && isNaN(parseFloat(value))) {
        return value;
      }
      return (typeof value == "number" ? value : parseFloat(value)).toFixed(0);
    },
    formatBool(value) {
      if (value) {
        return "Y";
      } else {
        return "N";
      }
    },
    trimString(value, length) {
      if (typeof value !== "string") {
        return value;
      }
      return value.substring(0, length);
    },
  },
};

export default self;