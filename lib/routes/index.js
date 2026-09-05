'use strict';

const AdminRoutes = require('./admin');
const ApiRoutes = require('./api');

const Routes = {
	init(params) {
		const { router, middleware } = params;
		AdminRoutes.register(router, middleware);
		ApiRoutes.register(router, middleware);
	},
};

module.exports = Routes;
