import AIKernel from '../kernel/AIKernel.js';

class SearchRuntime {
    async search({ entity = 'all', query = '', filters = {}, sort = 'relevance', page = 1, limit = 10 } = {}, context = {}) {
        const normalizedQuery = String(query || '').toLowerCase().trim();
        const providers = AIKernel.searchProviders;

        const results = [];
        for (const provider of providers) {
            try {
                if (provider.entity && entity !== 'all' && provider.entity !== entity) continue;
                const subResults = await provider.search(normalizedQuery, {
                    ...context,
                    entity,
                    filters,
                    sort,
                    page,
                    limit
                });
                results.push(...subResults);
            } catch (e) {
                console.error(`Search Provider error:`, e);
            }
        }

        return results;
    }

    async query(parsed, context) {
        return this.search({ query: parsed.normalized }, context);
    }
}

export default new SearchRuntime();
