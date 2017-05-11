const request = require('request');

module.exports = baseUrl => ({
  connectUser(userId, accessToken) {
    return new Promise( (resolve, reject) => {
      const options = {
        method: 'POST',
        baseUrl: baseUrl,
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
        baseUrl: baseUrl,
        uri: `/users/${user.id}?api-version=2016-10-10`,
        headers: {
          Authorization: `SharedAccessSignature ${accessToken}`
        },
        json: user
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
        baseUrl: baseUrl,
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
  }
});
