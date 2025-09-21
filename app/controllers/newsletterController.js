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

function renderTemplate(template, recipient) {
  if (typeof template !== 'string' || !template) {
    return '';
  }

  const values = new Proxy(
    {},
    {
      get: (_, prop) => extractValue(recipient, prop)
    }
  );

  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
    const value = values[key];
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });
}

function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPreheaderHtml(preheader) {
  if (typeof preheader !== 'string') {
    return '';
  }

  const trimmed = preheader.trim();
  if (!trimmed) {
    return '';
  }

  return `\n<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(trimmed)}</span>`;
}

function buildPlainTextContent(htmlContent, preheader) {
  const parts = [];

  if (typeof preheader === 'string' && preheader.trim()) {
    parts.push(preheader.trim());
  }

  const textFromHtml = toPlainText(htmlContent);
  if (textFromHtml) {
    parts.push(textFromHtml);
  }

  return parts.join('\n\n').trim();
}

function formatFromField(name, email) {
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedName = typeof name === 'string' ? name.trim() : '';

  if (trimmedEmail && trimmedName) {
    return `${trimmedName} <${trimmedEmail}>`;
  }

  if (trimmedEmail) {
    return trimmedEmail;
  }

  if (trimmedName) {
    return trimmedName;
  }

  return undefined;
}

async function sendNewsletter(req, res) {
  const {
    subject,
    html,
    template,
    criteria,
    preheader,
    from_name: fromName,
    from_email: fromEmail
  } = req.body || {};

  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({error: 'Тема письма обязательна'});
  }

  const baseTemplate = typeof html === 'string' && html.trim() ? html : template;
  if (!baseTemplate || typeof baseTemplate !== 'string' || !baseTemplate.trim()) {
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

  const preheaderHtml = buildPreheaderHtml(preheader);
  const fromField = formatFromField(fromName, fromEmail);

  let sentCount = 0;
  const failures = [];

  for (const recipient of recipients) {
    const email = extractValue(recipient, 'email');

    if (!email) {
      failures.push({reason: 'Отсутствует email получателя'});
      continue;
    }

    try {
      const renderedHtml = renderTemplate(baseTemplate, recipient);
      const htmlBody = `${preheaderHtml}${renderedHtml}`;
      const textBody = buildPlainTextContent(renderedHtml, preheader);

      await emailService.sendEmail({
        to: email,
        subject: subject.trim(),
        html: htmlBody,
        text: textBody,
        from: fromField
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
