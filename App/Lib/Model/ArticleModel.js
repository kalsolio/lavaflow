'use strict';

module.exports = Model(function() {
    return {
        getArticle: function(id) {
            return this.where({ id: id }).select().then(function(data) {
                if (data.length > 0) {
                    data[0].content = data[0].content.toString();
                }
                return data;
            });
        },

        addArticle: function(data) {
            var urlModel = D('Url');
            return this.add(data).then(function(aid) {
                return urlModel.where({ id: data.url_id }).update({
                    last_version: data.version,
                    last_version_aid: aid
                }).then(function() {
                    return aid;
                });
            });
        },

        getArticles: function(page, size, keyword, tag) {
            page = page || 1;
            size = size || 20;

            var sql = [];
            sql.push('SELECT * FROM (SELECT * FROM __ARTICLE__ ORDER BY version DESC) a');
            if (keyword) {
                sql.push(' WHERE title LIKE \'%', keyword, '%\'');
            } else if (tag) {
                sql.push(' WHERE tag LIKE \'%', tag, '%\'');
            }
            sql.push(' GROUP BY url_id ORDER BY create_time DESC');
            sql.push(' LIMIT ', (page - 1) * size, ',', page * size);

            return this.query(sql.join('')).then(function(data) {
                for (var i = 0, len = data.length; i < len; i++) {
                    data[i].content = data[i].content.toString();
                }
                return data;
            });
        },

        getArticlesByUrlId: function(urlId) {
            return this.where({ url_id: urlId }).order('version DESC').select().then(function(relatives) {
                return relatives;
            });
        },

        getLatest: function() {
            return this.query('SELECT * FROM (SELECT * FROM __ARTICLE__ ORDER BY version DESC) a GROUP BY url_id ORDER BY create_time DESC LIMIT 0,10').then(function(latest) {
                return latest;
            })
        }
    };
});
