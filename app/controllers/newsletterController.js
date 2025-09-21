const {User} = require('../models');
const emailService = require('../utils/emailService');

function extractValue(record, field) {
  if (!record) {
    return undefined;
  }

  if (typeof record.get === 'function') {
    const value = record.get(field);
    if (typeof value !== 'undefined') {
      return value;
    }
  }

  return record[field];
}

function buildQueryOptions(criteria) {
  if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
    return {where: {isConfirmed: true}};
  }

  const {where: rawWhere, ...rest} = criteria;
  const where = {...(rawWhere || {}), isConfirmed: true};

  return {where, ...rest};
}

function toPlainText(htmlOrText) {
  if (typeof htmlOrText !== 'string') {
    return '';
  }

  return htmlOrText
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendNewsletter(req, res) {
  const {subject, template, criteria} = req.body || {};

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({error: 'Тема письма обязательна'});
  }

  if (!template || typeof template !== 'string' || !template.trim()) {
    return res.status(400).json({error: 'Шаблон письма обязателен'});
  }

  const queryOptions = buildQueryOptions(criteria);

  let recipients;
  try {
    recipients = await User.findAll(queryOptions);
  } catch (error) {
    return res.status(500).json({error: 'Не удалось получить список получателей', details: error.message});
  }

  if (!recipients.length) {
    return res.status(200).json({
      message: 'Нет получателей, удовлетворяющих критериям',
      summary: {total: 0, sent: 0, failed: 0},
      failures: []
    });
  }

  const htmlBody = template;
  const textBody = toPlainText(template);

  let sentCount = 0;
  const failures = [];

  for (const recipient of recipients) {
    const email = extractValue(recipient, 'email');

    if (!email) {
      failures.push({reason: 'Отсутствует email получателя'});
      continue;
    }

    try {
      await emailService.sendEmail({
        to: email,
        subject: subject.trim(),
        html: htmlBody,
        text: textBody
      });
      sentCount += 1;
    } catch (error) {
      failures.push({email, reason: error.message || 'Неизвестная ошибка'});
    }
  }

  const hasFailures = failures.length > 0;

  return res.status(hasFailures ? 207 : 200).json({
    message: hasFailures ? 'Рассылка отправлена с ошибками' : 'Рассылка успешно отправлена',
    summary: {
      total: recipients.length,
      sent: sentCount,
      failed: failures.length
    },
    failures
  });
}

module.exports = {
  sendNewsletter
};
