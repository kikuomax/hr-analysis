'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({
	port: process.env.PORT || 3000
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
		isSecure: (process.env.FITBIT_SECURED_ACCESS != null) &&
			(process.env.FITBIT_SECURED_ACCESS != 0)
	});
	// makes sure that the 'fitbit' strategy is registered before
	// the signin route is added
	server.route({
		method: 'GET',
		path: '/signin',
		config: {
			auth: 'fitbit',
			handler: function (request, reply) {
				if (!request.auth.isAuthenticated) {
					return reply('Authentication failed due to: ');
				}
				return reply(
					'Signed in as ' +
					request.auth.credentials.profile.displayName);
			}
		}
	});
});

server.route({
	method: 'GET',
	path: '/',
	handler: function (request, reply) {
		reply(`Hello, world! ${ (process.env.FITBIT_SECURED_ACCESS != null) && (process.env.FITBIT_SECURED_ACCESS != 0) }`);
	}
});

server.route({
	method: 'GET',
	path: '/authenticated',
	handler: function (request, reply) {
		return reply(
			'Signed in as ' + request.auth.credentials.profile.displayName);
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

