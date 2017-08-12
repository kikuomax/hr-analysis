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
			isSameSite: 'Lax',
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
			config: {
				// disables the Cookie auth redirection
				// because it surprises a user if he/she is redirected to
				// the Fitbit login page without any explanation
				// the user should be redirected to the menu
				// if he/she has already been authenticated
				auth: {
					mode: 'try'
				},
				plugins: {
					'hapi-auth-cookie': {
						redirectTo: false
					}
				},
			},
			handler: (request, reply) => {
				if (request.auth.isAuthenticated) {
					return reply.redirect('/menu');
				}
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
			path: '/step-count',
			handler: {
				file: './static/step-count.html'
			}
		});
		server.route({
			method: 'GET',
			path: '/step-x-hr',
			handler: {
				file: './static/step-x-hr.html'
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
			path: '/scripts/{param*}',
			handler: {
				directory: {
					path: './static/scripts',
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
				requestIntradayTimeSeries(
					request,
					reply,
					(date) => `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d/1sec.json`,
					(date, startTime, stopTime) => `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d/1sec/time/${startTime}/${stopTime}.json`);
			}
		});
		server.route({
			method: 'GET',
			path: '/data/step-count.json',
			handler: (request, reply) => {
				requestIntradayTimeSeries(
					request,
					reply,
					(date) => `https://api.fitbit.com/1/user/-/activities/steps/date/${date}/1d/1min.json`,
					(date, startTime, stopTime) => `https://api.fitbit.com/1/user/-/activities/steps/date/${date}/1d/1min/time/${startTime}/${stopTime}.json`);
			}
		});
		server.start((err) => {
			if (err) {
				throw err;
			}
			console.log(`Server running at: ${server.info.uri}`);
		});
	});

/**
 * Requests intraday time series through the Fitbit API.
 *
 * The following parameters can be specified in the query part of the request,
 *  - `date`:
 *    (mandatory) date of the time series in the format `yyyy-MM-dd`
 *  - `startTime`:
 *    (optional) start time of the time series in the format `HH:mm`
 *  - `stopTime`:
 *    (optional) stop time of the time series in the format `HH:mm`
 *
 * `getAllDayUri` should have a signature similar to the following,
 *
 *     getAllDayUri(date) => URI:string
 *
 * `getTimeSpanUri` should have a signature similar to the following,
 *
 *     getTimeSpanUri(date, startTime, stopTime) => URI:string
 *
 * If both of `startTime` and `stopTime` are specified, `getTimeSpanUri` is
 * called. Otherwise `getAllDayUri` is called.
 *
 * The reply will be a JSON object bearing a requested time series.
 * Please refer to the Fitbit API for details about the JSON structure.
 *
 * @method requestIntradayTimeSeries
 * @static
 * @param request
 *     Hapi request object.
 * @param reply
 *     Hapi reply object.
 * @param getAllDayUri
 *     Function which returns a URI to access whole time series in a given date.
 * @param getTimeSpanUri
 *     Function which returns a URI to access time series in a given time span
 *     on a given date.
 */
function requestIntradayTimeSeries(
		request, reply, getAllDayUri, getTimeSpanUri)
{
	const date = request.query.date;
	const startTime = request.query.startTime;
	const stopTime = request.query.stopTime;
	if (!date) {
		return reply(
			Boom.badRequest('"date" parameter is required'));
	}
	let apiUri;
	if (startTime && stopTime) {
		apiUri = getTimeSpanUri(date, startTime, stopTime);
	} else {
		if (startTime || stopTime) {
			console.warn(
				'both of "startTime" and "stopTime" parameters' +
				' must be specified if one of them is specified');
		}
		apiUri = getAllDayUri(date);
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

