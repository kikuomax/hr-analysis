'use strict';

const Hapi = require('hapi');
const Wreck = require('wreck');

const server = new Hapi.Server();
server.connection({
	port: process.env.PORT || 5000,
	host: 'localhost'
});

// single session is sufficient because this is a personal application
const cache = server.cache({
	segment: 'session',
	expiresIn: 24 * 60 * 60 * 1000
});

server.register([
	require('inert'),
	require('bell'),
	{
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
	}],
	(err) => {
		if (err) {
			throw err;
		}
		server.auth.strategy('fitbit', 'bell', {
			provider: 'fitbit',
			password: process.env.COOKIE_PASSWORD,
			clientId: process.env.FITBIT_OAUTH2_CLIENT_ID,
			clientSecret: process.env.FITBIT_OAUTH2_CLIENT_SECRET,
			isSecure: false,
				// should be true, but the localhost version needs false
			scope: ['profile', 'activity', 'heartrate', 'sleep']
		});
		server.route({
			method: 'GET',
			path: '/',
			handler: (request, reply) => {
				reply.file('./static/index.html');
			}
		});
		server.route({
			method: 'GET',
			path: '/menu',
			handler: {
				file: './static/menu.html'
			}
		});
		server.route({
			method: 'GET',
			path: '/profile',
			handler: {
				file: './static/profile.html'
			}
		});
		server.route({
			method: 'GET',
			path: '/lib/{param*}',
			handler: {
				directory: {
					path: './static/lib',
					index: false
				}
			}
		});
		server.route({
			method: 'GET',
			path: '/signin',
			config: {
				auth: 'fitbit',
				handler: (request, reply) => {
					if (!request.auth.isAuthenticated) {
						return reply('Authentication failed due to: ');
					}
					cache.set(
						'tokens',
						{
							token: request.auth.credentials.token,
							refreshToken: request.auth.credentials.refreshToken
						},
						0,
						(err) => {
							if (err) {
								console.log(err);
								return reply(err);
							}
						});
					return reply.redirect('/menu');
				}
			}
		});
		server.route({
			method: 'GET',
			path: '/data/profile.json',
			handler: (request, reply) => {
				cache.get('tokens', (err, cached) => {
					if (err) {
						console.log(err);
						return reply(err);
					}
					const requestOptions = {
						headers: {
							Authorization: `Bearer ${ cached.token }`
						},
						json: true,
						cors: true  // JSON type needs preflight
					};
					Wreck.get(
						'https://api.fitbit.com/1/user/-/profile.json',
						requestOptions,
						(err, response, payload) => {
							if (err) {
								console.log(err);
								return reply(err);
							}
							return reply(payload);
						});
				});
			}
		});
		server.start((err) => {
			if (err) {
				throw err;
			}
			console.log(`Server running at: ${server.info.uri}`);
		});
	});

