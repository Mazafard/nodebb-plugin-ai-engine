'use strict';

const requireNodeBB = require('../nodebb');
const search = requireNodeBB('./src/search');
const topics = requireNodeBB('./src/topics');
const nconf = requireNodeBB('nconf');

const SearchHelper = {
	async findRelatedTopics(query, excludeTid = 0, limit = 3) {
		const results = [];
		try {
			const baseUrl = (nconf && typeof nconf.get === 'function') ? nconf.get('url') : '';

			// Clean query keywords
			const keywords = query
				.replace(/[^\w\s]/g, ' ')
				.split(/\s+/)
				.filter((w) => w.length > 3)
				.slice(0, 5)
				.join(' ');

			if (!keywords) {
				return [];
			}

			if (search && typeof search.search === 'function') {
				const searchResult = await search.search({
					query: keywords,
					searchIn: 'titlesposts',
					matchWords: 'any',
					limit: limit + 2,
					uid: 1, // Admin read privileges
				});

				const pids = (searchResult && searchResult.pids) || [];
				if (pids.length > 0) {
					const posts = requireNodeBB('./src/posts');
					const postDataList = await posts.getPostsFields(pids, ['pid', 'tid', 'content']);
					const seenTids = new Set([parseInt(excludeTid, 10)]);

					for (const post of postDataList) {
						if (!post || !post.tid || seenTids.has(post.tid)) {
							continue;
						}
						seenTids.add(post.tid);

						const topic = await topics.getTopicData(post.tid);
						if (topic && !topic.deleted) {
							results.push({
								tid: topic.tid,
								title: topic.title,
								url: `${baseUrl}/topic/${topic.slug || topic.tid}`,
								snippet: (post.content || '').replace(/<[^>]*>?/gm, '').slice(0, 200),
							});
						}

						if (results.length >= limit) {
							break;
						}
					}
				}
			}
		} catch (err) {
			// Search may fail gracefully if indexing is in progress or backend is down
		}

		return results;
	},
};

module.exports = SearchHelper;
