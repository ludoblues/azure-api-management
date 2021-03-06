const crypto = require('crypto');

const moment = require('moment');
const request = require('request');

module.exports = (credentials) => ({
  getSubscriptions(filter, accessToken) {
    return new Promise( (resolve, reject) => {
      const options = {
        method: 'GET',
        baseUrl: credentials.restApi,
        uri: `/subscriptions?$filter=${filter}&api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`
        }
      };

      request(options, (err, response, body) => {
        if (err || response.statusCode >= 400) {
          return reject(err || body);
        }

        body = JSON.parse(body);
        resolve(body.value);
      });
    });
  },
  
  connectUser(userId, accessToken) {
    return new Promise( (resolve, reject) => {
      const options = {
        method: 'POST',
        baseUrl: credentials.restApi,
        uri: `/users/${userId}/generateSsoUrl?api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`
        }
      };

      request(options, (err, response, body) => {
        if (err || response.statusCode >= 400) {
          return reject(err || body);
        }

        body = JSON.parse(body);
        resolve(body.value);
      });
    });
  },

  createUser(user, accessToken) {
    return new Promise( (resolve, reject) => {
      const options = {
        method: 'PUT',
        baseUrl: credentials.restApi,
        uri: `/users/${user.id}?api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`
        },
        json: {
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName
        }
      };

      request(options, (err, response, body) => {
        (err || response.statusCode >= 400) ? reject(err || body) : resolve(body);
      });
    });
  },

  removeUser(userId, accessToken) {
    return new Promise( (resolve, reject) => {
      const options = {
        method: 'DELETE',
        baseUrl: credentials.restApi,
        uri: `/users/${user.id}?api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`,
          'If-Match': '*'
        }
      };

      request(options, (err, response, body) => {
        (err || response.statusCode >= 400) ? reject(err || body) : resolve(body);
      });
    });
  },

  getReportByApi(filter, accessToken) {
    return new Promise( (resolve, reject) => {
      const options = {
        method: 'GET',
        baseUrl: credentials.restApi,
        uri: `/reports/byApi?$filter=${filter}&api-version=2017-03-01`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`
        },
        json: true
      };

      request(options, (err, response, body) => {
        (err || response.statusCode >= 400) ? reject(err || body) : resolve(body);
      });
    });
  },

  subscribe(userId, productId, subscription, accessToken) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'PUT',
        baseUrl: credentials.restApi,
        uri: `/subscriptions/${subscription.id}?api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`
        },
        json: {
          userId: `/users/${userId}`,
          productId: `/products/${productId}`,
          name: subscription.name,
          state: 'active'
        }
      };

      request(options, (err, response, body) => {
        (err || response.statusCode >= 400) ? reject(err || body) : resolve(body)
      });
    });
  },

  unsubscribe(subscriptionId, accessToken) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'DELETE',
        baseUrl: credentials.restApi,
        uri: `/subscriptions/${subscriptionId}?api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`,
          'If-Match': '*'
        }
      };

      request(options, (err, response, body) => {
        (err || response.statusCode >= 400) ? reject(err || body) : resolve(body)
      });
    });
  },

  generateAccessToken() {
    const hmac = crypto.createHmac('sha512', new Buffer(credentials.key, 'utf8'));

    const expiry = moment().utc().add(10, 'days').format('YYYY-MM-DD[T]HH:mm:ss.SSSSSSS[Z]');
    const digest = hmac.update(`${credentials.identifier}\n${expiry}`).digest();

    const signature = digest.toString('base64');

    return `uid=${credentials.identifier}&ex=${expiry}&sn=${signature}`;
  },

  verifySignInSignature(salt, returnUrl, sig) {
    const hmac = crypto.createHmac('sha512', new Buffer(credentials.delegationKey, 'base64'));
    const digest = hmac.update(`${salt}\n${returnUrl}`).digest();

    const signature = digest.toString('base64');

    return signature === sig;
  },

  verifySignOutSignature(salt, userId, sig) {
    const hmac = crypto.createHmac('sha512', new Buffer(credentials.delegationKey, 'base64'));
    const digest = hmac.update(`${salt}\n${userId}`).digest();

    const signature = digest.toString('base64');

    return signature === sig;
  },

  verifySubscriptionSignature(salt, productId, userId, sig) {
    const hmac = crypto.createHmac('sha512', new Buffer(credentials.delegationKey, 'base64'));
    const digest = hmac.update(`${salt}\n${productId}\n${userId}`).digest();

    const signature = digest.toString('base64');

    return signature === sig;
  },

  verifyUnsubscribeSignature(salt, subscriptionId, sig) {
    const hmac = crypto.createHmac('sha512', new Buffer(credentials.delegationKey, 'base64'));
    const digest = hmac.update(`${salt}\n${subscriptionId}`).digest();

    const signature = digest.toString('base64');

    return signature === sig;
  },

  verifySignature(query) {
    if (query.operation === 'SignIn') {
      return this.verifySignInSignature(query.salt, query.returnUrl, query.sig);
    } else if (query.operation === 'SignOut') {
      return this.verifySignOutSignature(query.salt, query.userId, query.sig);
    } else if (query.operation === 'Subscribe') {
      return this.verifySubscriptionSignature(query.salt, query.productId, query.userId, query.sig);
    } else if (query.operation === 'Unsubscribe') {
      return this.verifyUnsubscribeSignature(query.salt, query.subscriptionId, query.sig);
    } else {
      return false;
    }
  }
});
