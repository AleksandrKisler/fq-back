const orderService = require('../services/orderService');
const yookassaService = require('../services/payments/yookassa');
const dolyamiService = require('../services/payments/dolyami');

exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const {delivery, customer, comment, returnUrl, payment} = req.body;

    const result = await orderService.createOrderFromCart({
      userId,
      delivery,
      customer,
      comment,
      returnUrl,
      payment
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Не удалось создать заказ'
    });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {slug} = req.params;

    const order = await orderService.getOrderBySlug({slug, userId});

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Не удалось получить заказ'
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    if (!yookassaService.isValidWebhookAuth(req.headers.authorization)) {
      return res.status(401).json({success: false, message: 'Unauthorized'});
    }

    await orderService.updateOrderFromPaymentEvent(req.body);

    return res.json({success: true});
  } catch (error) {
    console.error('Webhook error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Не удалось обработать уведомление'
    });
  }
};

exports.handleDolyamiWebhook = async (req, res) => {
  try {
    if (!dolyamiService.isConfigured()) {
      return res.status(503).json({success: false, message: 'Интеграция Долями не настроена'});
    }

    const signature = dolyamiService.extractSignature(req.headers);
    const payloadForSignature = req.rawBody ?? req.body;

    if (!dolyamiService.isValidWebhookSignature({signature, payload: payloadForSignature})) {
      return res.status(401).json({success: false, message: 'Недействительная подпись уведомления'});
    }

    await orderService.updateOrderFromDolyamiEvent(req.body);

    return res.json({success: true});
  } catch (error) {
    console.error('Dolyami webhook error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Не удалось обработать уведомление Долями'
    });
  }
};
