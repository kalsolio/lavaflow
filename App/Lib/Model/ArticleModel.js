module.exports = Model(function() {
    'use strict';
    
    var timeout = 60;

    return {
        getArticle: function(id, noCache) {
            var p = this.where({ 'id': id });
            if (noCache !== true) {
                p.cache(timeout);
            }
            return p.find().then(function(data) {
                return data;
            });
        },

        addArticle: function(data) {
            var urlModel = D('Url');
            return this.add(data).then(function(aid) {
                return urlModel.updateUrl(data.url_id, data.version, aid).then(function() {
                    return aid;
                });
            });
        },

        queryArticles: function(page, size, keyword, tag) {
            page = parseInt(page, 10) || 1;
            size = size || 20;

            var sql = [];
            sql.push('SELECT * FROM (SELECT * FROM __ARTICLE__ ORDER BY `version` DESC) a');
            if (keyword) {
                sql.push(' WHERE `title` LIKE \'%', escapeSQL(keyword), '%\'');
            } else if (tag) {
                sql.push(' WHERE `tag` LIKE \'%', escapeSQL(tag), '%\'');
            }
            sql.push(' GROUP BY `url_id` ORDER BY `create_time` DESC');
            sql.push(' LIMIT ', (page - 1) * size, ',', page * size);

            return this.cache(timeout)
                .query(sql.join(''))
                .then(function(data) {
                    return data;
                });
        },

        getArticlesByUrlId: function(urlId) {
            return this.where({ 'url_id': urlId }).order('version DESC')
                .cache(timeout)
                .select().then(function(relatives) {
                    return relatives;
                });
        },

        getLatest: function() {
            return this.cache(timeout)
                .query('SELECT * FROM (SELECT * FROM __ARTICLE__ ORDER BY `version` DESC) a GROUP BY `url_id` ORDER BY `create_time` DESC LIMIT 0,10')
                .then(function(latest) {
                    return latest;
                });
        },

        getTags: function() {
            return this.cache(timeout)
                .query('SELECT `tag`,count(`tag`) as `count` FROM __ARTICLE__ GROUP BY `tag`')
                .then(function(data) {
                    return data;
                });
        },

        delArticle: function(id) {
            return this.where({ 'id': id }).delete().then(function(affectedRows) {
                return affectedRows;
            });
        }
    };
});
