'use strict';

/**
 * [Pattern 5: Adapter Pattern]
 * Normalizes jQuery AJAX and CSRF headers across forum paths.
 */
class AjaxClientAdapter {
	constructor() {
		this.forumPath = (typeof config !== 'undefined' && config.relative_path) ? config.relative_path : '';
		this.csrfHeader = (typeof config !== 'undefined' && config.csrf_token) ? config.csrf_token : '';
	}

	async request(endpoint, options = {}) {
		const url = this.forumPath + endpoint;
		const method = options.method || 'GET';
		const headers = Object.assign({
			'x-csrf-token': this.csrfHeader,
		}, options.headers || {});

		if (method !== 'GET' && options.body && !headers['content-type']) {
			headers['content-type'] = 'application/json';
		}

		return new Promise((resolve, reject) => {
			$.ajax({
				url,
				type: method,
				headers,
				data: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
				success: (res) => resolve(res),
				error: (xhr) => {
					const err = (xhr.responseJSON && xhr.responseJSON.error) || xhr.statusText || 'Network request failed';
					reject(new Error(err));
				},
			});
		});
	}
}

module.exports = AjaxClientAdapter;
