const axios = require('axios');

class CDEKError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'CDEKError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

class CDEKService {
  constructor() {
    this.clientId = process.env.CDEK_CLIENT_ID;
    this.clientSecret = process.env.CDEK_CLIENT_SECRET;
    this.apiBaseUrl = process.env.CDEK_API_URL || 'https://api.cdek.ru/v2';
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  getDefaultSenderLocation() {
    const location = {};

    if (process.env.CDEK_SENDER_CITY_CODE) {
      location.city_code = Number(process.env.CDEK_SENDER_CITY_CODE);
    }

    if (process.env.CDEK_SENDER_POSTAL_CODE) {
      location.postal_code = process.env.CDEK_SENDER_POSTAL_CODE;
    }

    if (process.env.CDEK_SENDER_ADDRESS) {
      location.address = process.env.CDEK_SENDER_ADDRESS;
    }

    return Object.keys(location).length ? location : null;
  }

  async getToken() {
    if (!this.isConfigured()) {
      throw new CDEKError('Сервис CDEK не настроен', 503);
    }

    const now = Date.now();
    if (this.token && this.tokenExpiresAt && now < this.tokenExpiresAt - 60000) {
      return this.token;
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      const response = await axios.post(
        `${this.apiBaseUrl}/oauth/token`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const {access_token: accessToken, expires_in: expiresIn = 3600} = response.data || {};

      if (!accessToken) {
        throw new CDEKError('Не удалось получить токен CDEK', 502, response.data);
      }

      this.token = accessToken;
      this.tokenExpiresAt = now + Number(expiresIn) * 1000;

      return this.token;
    } catch (error) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Ошибка авторизации CDEK';
      throw new CDEKError(message, status, error.response?.data || error.message);
    }
  }

  async request(config) {
    const token = await this.getToken();

    const axiosConfig = {
      ...config,
      baseURL: this.apiBaseUrl,
      headers: {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`
      }
    };

    try {
      const response = await axios(axiosConfig);
      return response.data;
    } catch (error) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || 'Ошибка обращения к API CDEK';
      throw new CDEKError(message, status, error.response?.data || error.message);
    }
  }

  sanitizeParams(params = {}) {
    return Object.fromEntries(
      Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
  }

  normalizePickupPoint(point) {
    if (!point || typeof point !== 'object') {
      return null;
    }

    const location = point.location || {};

    return {
      code: point.code,
      name: point.name,
      type: point.type,
      owner_code: point.owner_code,
      status: point.status,
      address: location.address_full || location.address || null,
      city_code: location.city_code || null,
      country_code: location.country_code || null,
      region: location.region || null,
      location: location.latitude && location.longitude ? {
        latitude: location.latitude,
        longitude: location.longitude
      } : null,
      postal_code: location.postal_code || null,
      nearest_station: point.nearest_station || null,
      note: point.note || null,
      work_time: point.work_time || null,
      work_time_list: point.work_time_list || [],
      have_cash: point.have_cash || false,
      have_cashless: point.have_cashless || false,
      allowed_cod: point.allowed_cod || false,
      is_dressing_room: point.is_dressing_room || false,
      is_ltl: point.is_ltl || false,
      weight_min: point.weight_min || null,
      weight_max: point.weight_max || null,
      phones: Array.isArray(point.phones) ? point.phones.map(phone => phone.number) : [],
      address_comment: location.address_comment || null,
      schedule: point.schedule || null,
      additional_services: point.additional_services || []
    };
  }

  async getPickupPoints(rawParams = {}) {
    const params = this.sanitizeParams(rawParams);

    const data = await this.request({
      method: 'get',
      url: '/deliverypoints',
      params
    });

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map(point => this.normalizePickupPoint(point))
      .filter(Boolean);
  }

  async calculateTariff(payload = {}) {
    const requestPayload = {...payload};

    if (!requestPayload.from_location) {
      const defaultLocation = this.getDefaultSenderLocation();
      if (defaultLocation) {
        requestPayload.from_location = defaultLocation;
      }
    }

    if (!requestPayload.tariff_code) {
      throw new CDEKError('Не указан тариф CDEK', 400);
    }

    if (!requestPayload.from_location) {
      throw new CDEKError('Не указан адрес отправителя', 400);
    }

    if (!requestPayload.to_location) {
      throw new CDEKError('Не указан адрес получателя', 400);
    }

    if (!Array.isArray(requestPayload.packages) || requestPayload.packages.length === 0) {
      throw new CDEKError('Не переданы параметры посылок', 400);
    }

    return this.request({
      method: 'post',
      url: '/calculator/tariff',
      data: requestPayload
    });
  }

  clearToken() {
    this.token = null;
    this.tokenExpiresAt = 0;
  }
}

module.exports = new CDEKService();
module.exports.CDEKError = CDEKError;
