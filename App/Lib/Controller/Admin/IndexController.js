'use strict';

module.exports = Controller(function() {
    var md5 = require('MD5');

    return {
        init: function(http) {
            var self = this;
            self.super('init', http);
            if (http.action === 'login') {
                return self.session("user").then(function(data) {
                    if (!isEmpty(data)) {
                        return self.redirect("/admin");
                    }
                });
            } else {
                return self.session("user").then(function(data) {
                    if (isEmpty(data)) {
                        if (self.isAjax()) {
    						return self.error(403);
    					} else {
                            return self.redirect("/login");
    					}
                    } else {
                        self.user = data;
                    }
                });
            }
        },

        loginAction: function() {
            var self = this;
            var password = self.post('password');
            var ret = {};
            if (password) {
                if (md5(password) === 'e04c8f3a8ed92cc0dfcc5b441fbf2250') {
                    return self.session('user', '1').then(function() {
                        return self.redirect("/admin");
                    });
                } else {
                    ret.error = '口令错误，请大声念“芝麻开门”';
                }
            }
            self.assign('ret', ret);
            return self.display();
        },

        indexAction: function() {
            var self = this;
            var key = self.get('key');
            var page = parseInt(self.get('page'), 10) || 1;
            var size = 50;
            var articleModel = D('Article');
            return articleModel.where({ 'title': ['like', '%' + key + '%'] }).count('id').then(function(count) {
                var last = count < size ? 1 : (count % size === 0 ? count / size : Math.ceil(count / size));
                page = page > last ? last : page;
                return articleModel
                    .where({ 'title': ['like', '%' + key + '%'] })
                    .order('create_time DESC')
                    .page(page, size)
                    .select().then(function(data) {
                        self.assign('articles', data);
                        self.assign('key', key);
                        self.assign('page', page);
                        self.assign('size', size);
                        self.assign('last', last);
                        return self.display();
                    });
            });
        },

        delAction: function() {
            var self = this;
            var id = self.post('id');
            var articleModel = D('Article');
            return articleModel.getArticle(id, true).then(function(article) {
                if (!isEmpty(article)) {
                    var urlId = article.url_id;
                    return articleModel.delArticle(id).then(function() {
                        return articleModel.query('SELECT `id`,max(`version`) as `max_version` FROM __ARTICLE__ where `url_id`=' + urlId).then(function(data) {
                            var lastVersion, lastAid;
                            if (data.length > 0) {
                                lastVersion = data[0].max_version;
                                lastAid = data[0].id;
                            } else {
                                lastVersion = '';
                                lastAid = '';
                            }
                            return D('Url').updateUrl(urlId, lastVersion, lastAid).then(function() {
                                return self.success();
                            });
                        });
                    });
                } else {
                    return self.error('删除文章失败');
                }
            });
        }
    };
});
