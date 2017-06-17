'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({
	port: process.env.PORT || 3000
});

server.route({
	method: 'GET',
	path: '/',
	handler: function (request, reply) {
		reply('Hello, world!');
	}
});

server.route({
	method: 'GET',
	path: '/{name}',
	handler: function (request, reply) {
		reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
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

