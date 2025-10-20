const apm = require('elastic-apm-node');
const morgan = require('morgan'); 
const Pino = require('pino')({
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.LOG_PRETTY_PRINT === 'true' || false,
  base: null,
  formatters: {
    level: (label) => ({ level: label })
  },
  enabled: process.env.NODE_ENV !== 'test',
  redact: process.env.LOG_REDUCTION_KEYS && JSON.parse(process.env.LOG_REDUCTION_KEYS) // format ['data.*.key', 'path.to.key', 'arrays[*].key']
});

const log = (tags, data) => {
  const logs = { tags };
  if (data) {
    Object.assign(logs, { data ,...apm.currentTraceIds});
  }

  Pino.info(logs);
};

const getRealIp = (req) => {
  if (typeof req.headers['x-original-forwarded-for'] === 'string') {
    return req.headers['x-original-forwarded-for'].split(',')[0];
  } else if (typeof req.headers['x-forwarded-for'] === 'string') {
    return req.headers['x-forwarded-for'].split(',')[0];
  }
  return req.socket.remoteAddress;
};

const initLogger = () => {
  return morgan((tokens, req, res) => {
    const urlOriginal = `${tokens.url(req, res)}`;
    const responseStatus = tokens.status(req, res);
    const message = `${tokens.method(req, res)} ${urlOriginal} - ${responseStatus}`;
    const clientIp = getRealIp(req);
    const timeDiff = process.hrtime(req.startTime);
    const timeTaken = Math.round((timeDiff[0] * 1e9 + timeDiff[1]) / 1e6);
    const meta = {
      'service.name': process.env.SERVICE_NAME,
      'service.version': process.env.VERSION,
      'log.logger': 'restify',
      tags: ['audit-log'],
      'url.original': urlOriginal,
      'http.request.method': tokens.method(req, res),
      'user_agent.original': tokens['user-agent'](req, res),
      'http.response.status_code': responseStatus,
      'http.response.body.bytes': tokens.res(req, res, 'content-length'),
      'event.duration': parseInt(tokens['response-time'](req, res, '0')) * 1000000, // in milisecond (ms) so need to convert to ns
      'http.response.date': tokens.date(req, res, 'iso'),
      'client.address': req.socket.remoteAddress,
      'client.ip': clientIp,
      timeTaken,
      'user.id': req.userId || '',
      'user.roles': req.role ? [req.role] : undefined,
    };
    const obj = {
      context: 'service-info',
      scope: 'audit-log',
      message: message,
      meta: meta,
      ...apm.currentTraceIds
    };
    Pino.info(obj);
    return;
  });
};

const socketLogger = (socket, next) => {
  const logEvent = (eventName, data) => {
    const message = `${eventName} - ${JSON.stringify(data)}`;
    const clientIp = socket.handshake.address;
    const meta = {
      'service.name': process.env.SERVICE_NAME,
      'service.version': process.env.VERSION,
      'log.logger': 'socketio',
      tags: ['audit-log'],
      'event.name': eventName,
      'client.address': clientIp,
      'client.ip': clientIp,
      'user.id': socket.userId || '',
      'user.roles': socket.role ? [socket.role] : undefined,
      'event.data': data ? JSON.stringify(data) : '',
      'event.duration': 0,
      'http.response.date': new Date().toISOString(),
    };

    const obj = {
      context: 'service-info',
      scope: 'audit-log',
      message: message,
      meta: meta,
      ...apm.currentTraceIds,
    };

    Pino.info(obj);
  };

  socket.onAny((eventName, ...args) => {
    logEvent(eventName, args);
  });

  next();
};

module.exports = {
  log,
  initLogger,
  socketLogger
};
