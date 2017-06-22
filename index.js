'use strict';

const Hapi = require('hapi');
const Wreck = require('wreck');

const server = new Hapi.Server();
server.connection({
	port: process.env.PORT || 5000,
	host: 'localhost'
});

// configures the authentication module 'bell'
server.register(require('bell'), (err) => {
	if (err) {
		throw err;
	}
	server.auth.strategy('fitbit', 'bell', {
		provider: 'fitbit',
		password: process.env.COOKIE_PASSWORD,
		clientId: process.env.FITBIT_OAUTH2_CLIENT_ID,
		clientSecret: process.env.FITBIT_OAUTH2_CLIENT_SECRET,
		isSecure: false,
		scope: ['profile', 'activity', 'heartrate', 'sleep']
	});
	// makes sure that the 'fitbit' strategy is registered before
	// the signin route is added
	server.route({
		method: 'GET',
		path: '/signin',
		config: {
			auth: 'fitbit',
			handler: (request, reply) => {
				if (!request.auth.isAuthenticated) {
					return reply('Authentication failed due to: ');
				}
				const requestOptions = {
					headers: {
						Authorization:
							`Bearer ${ request.auth.credentials.token }`
					},
					json: true
				};
				Wreck.get(
					'https://api.fitbit.com/1/user/-/profile.json',
					requestOptions,
					(err, response, payload) => {
						if (err) {
							console.log(err);
							return reply(err);
						}
						return reply(`<pre>${ JSON.stringify(payload) }</pre>`);
					});
			}
		}
	});
});

server.route({
	method: 'GET',
	path: '/',
	handler: function (request, reply) {
		reply(`Hello, world!`);
	}
});

server.register({
	register: require('good'),
	options: {
		reporters: {
			console: [{
				module: 'good-squeeze',
				name: 'Squeeze',
				args: [{
					response: '*',
					log: '*'
				}]
			}, {
				module: 'good-console'
			}, 'stdout']
		}
	}
}, (err) => {
	if (err) {
		throw err;
	}
	server.start((err) => {
		if (err) {
			throw err;
		}
		console.log(`Server running at: ${server.info.uri}`);
	});
});

