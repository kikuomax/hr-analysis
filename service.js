'use strict';

const Boom = require('boom');
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
	require('hapi-auth-cookie'),
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
		server.auth.strategy('session', 'cookie', true, {
			password: process.env.COOKIE_PASSWORD,
			cookie: 'fitbit-signin',
			redirectTo: '/signin',
			isSecure: false,
				// should be true, but the localhost version needs false
			validateFunc: (request, session, callback) => {
				cache.get(session.sid, (err, cached) => {
					if (err) {
						return callback(err, false);
					}
					if (!cached) {
						return callback(null, false);
					}
					return callback(null, true, cached);
				});
			}
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
			path: '/heart-rate',
			handler: {
				file: './static/heart-rate.html'
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
				plugins: {
					'hapi-auth-cookie': {
						redirectTo: false
					}
				},
				handler: (request, reply) => {
					if (!request.auth.isAuthenticated) {
						return reply('Authentication failed due to: ');
					}
					const userId = request.auth.credentials.profile.id;
					cache.set(
						userId,
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
							request.cookieAuth.set({ sid: userId });
							return reply.redirect('/menu');
						});
				}
			}
		});
		server.route({
			method: 'GET',
			path: '/data/profile.json',
			handler: (request, reply) => {
				if (err) {
					console.log(err);
					return reply(err);
				}
				const requestOptions = {
					headers: {
						Authorization: `Bearer ${request.auth.credentials.token}`
					},
					json: true,
					cors: true  // Authorization needs preflight
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
			}
		});
		server.route({
			method: 'GET',
			path: '/data/heart-rate.json',
			handler: (request, reply) => {
				const date = request.query.date;
				const startTime = request.query.startTime;
				const stopTime = request.query.stopTime;
				if (!date) {
					return reply(
						Boom.badRequest('"date" parameter is required'));
				}
				let apiUri;
				if (startTime && stopTime) {
					apiUri = `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d/1sec/time/${startTime}/${stopTime}.json`;
				} else {
					if (startTime || stopTime) {
						console.warn('both of "startTime" and "stopTime" parameters must be specified if one of them is specified');
					}
					apiUri = `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d/1sec.json`;
				}
				if (err) {
					console.log(err);
					return reply(err);
				}
				const requestOptions = {
					headers: {
						Authorization: `Bearer ${request.auth.credentials.token}`
					},
					json: true,
					cors: true  // Authorization needs preflight
				};
				Wreck.get(
					apiUri,
					requestOptions,
					(err, response, payload) => {
						if (err) {
							console.log(err);
							return reply(err);
						}
						return reply(payload);
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

