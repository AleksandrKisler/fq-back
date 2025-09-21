const cdekService = require('../services/delivery/cdekService');

const parseBoolean = value => {
  if (value === undefined) {
    return undefined;
  }
  if (value === 'true' || value === true) {
    return true;
  }
  if (value === 'false' || value === false) {
    return false;
  }
  return undefined;
};

const respondWithError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);
  const status = error.statusCode || error.response?.status || 500;
  const payload = {
    success: false,
    message: error.message || fallbackMessage
  };

  if (error.details) {
    payload.details = error.details;
  } else if (error.response?.data) {
    payload.details = error.response.data;
  }

  return res.status(status).json(payload);
};

exports.getPickupPoints = async (req, res) => {
  try {
    if (!cdekService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Сервис доставки CDEK не настроен'
      });
    }

    const {
      city_code: cityCode,
      postal_code: postalCode,
      country_code: countryCode,
      region_code: regionCode,
      code,
      type,
      limit,
      page,
      only_active: onlyActive,
      allowed_cod: allowedCod,
      have_cashless: haveCashless,
      have_cash: haveCash,
      is_handout: isHandout
    } = req.query;

    if (!cityCode && !postalCode && !code) {
      return res.status(400).json({
        success: false,
        message: 'Укажите city_code, postal_code или код пункта выдачи'
      });
    }

    const params = {
      city_code: cityCode ? Number(cityCode) : undefined,
      postal_code: postalCode,
      country_code: countryCode,
      region_code: regionCode ? Number(regionCode) : undefined,
      code,
      type,
      size: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
      only_active: parseBoolean(onlyActive),
      allowed_cod: parseBoolean(allowedCod),
      have_cashless: parseBoolean(haveCashless),
      have_cash: parseBoolean(haveCash),
      is_handout: parseBoolean(isHandout)
    };

    const points = await cdekService.getPickupPoints(params);

    return res.json({
      success: true,
      data: points
    });
  } catch (error) {
    return respondWithError(res, error, 'Не удалось получить список пунктов выдачи CDEK');
  }
};

exports.calculateTariff = async (req, res) => {
  try {
    if (!cdekService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Сервис доставки CDEK не настроен'
      });
    }

    const {
      tariff_code: tariffCode,
      from_location: fromLocation,
      to_location: toLocation,
      packages,
      services,
      mode_id: modeId
    } = req.body || {};

    const result = await cdekService.calculateTariff({
      tariff_code: tariffCode,
      from_location: fromLocation,
      to_location: toLocation,
      packages,
      services,
      mode_id: modeId
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return respondWithError(res, error, 'Не удалось рассчитать стоимость доставки CDEK');
  }
};
