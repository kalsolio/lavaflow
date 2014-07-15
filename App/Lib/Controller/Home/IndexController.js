'use strict';

module.exports = Controller(function() {
    var request = require('request');
    var cheerio = require('cheerio');
    var marked = require('marked');
    var html2markdown = require('html2markdown');
    var validator = require('validator');

    function getPage(url) {
        var deferred = getDefer();
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                deferred.resolve(body);
            } else {
                deferred.reject({ errType: 1, error: error, status: response.statusCode });
            }
        });
        return deferred.promise;
    }

    function getContent($, selector) {
        if (selector.length === 0) {
            return '';
        }
        var sr = selector.shift();
        var $article = $(sr);
        if ($article.length > 0) {
            return $article.html();
        } else {
            return getContent($, selector);
        }
    }

    return {
        indexAction: function() {
            return this.display();
        },

        captureAction: function() {
            // 抓取页面，将HTML解析成 markdown 格式
            var self = this;
            var url = self.get('url');
            if (!url) {
                return self.redirectIndex('文章URL不能为空');
            } else if (!validator.isURL(url)) {
                return self.redirectIndex('请输入一个合法的URL');
            } else {
                return D('Url').where({ url: url }).select().then(function(data) {
                    var attrs = {};

                    // 如果文章已收录，那么将URL 提示到页面上
                    if (data.length > 0) {
                        attrs.lastVersionUrl = 'http://' + self.http.host + '/index/detail/id/' + data[0].last_version_aid;
                        return D('Article').where({ id: data[0].last_version_aid }).select().then(function(data) {
                            attrs.tag = data[0].tag;
                            return self.capturePage(url, attrs);
                        });
                    } else {
                        return self.capturePage(url, attrs);
                    }
                }).catch(function(error){
                    return self.redirectIndex('解析失败' + (error && error.errType === 1 ? '：Status Code ' + error.status + (error.error ? ' - ' + error.error : '') : ''), 'url=' + encodeURIComponent(url));
                });
            }
        },

        capturePage: function(url, attrs) {
            var self = this;
            return getPage(url).then(function(html) {
                var content, title;
                var $ = cheerio.load(html, { decodeEntities: false });
                $('script').remove();
                $('style').remove();
                title = $('title').html();

                // '.tab-content .comment-content' 是Github文章
                content = getContent($, ['article .content', '.content', '.tab-content .comment-content', 'article', '.article', '.post', 'body']);

                // 过滤掉所有html2markdown不解析的标签
                content = content.replace(/<!--.*-->/gi, '');
                content = content.replace(/<(\/)?([^>]*)\/?>/gi, function(s, s1, s2) {
                    var tag = s2.split(' ')[0];
                    if (/^code$/i.test(tag)) {
                        return s1 != '/' ? '<pre>' : '</pre>';
                    }
                    return /^(h[1-9]|hr|br|title|b|strong|i|em|dfn|var|city|span|ul|ol|dl|li|blockquote|pre|p|div|img|a)$/i.test(tag) ? s : '';
                });
                content = content ? html2markdown(content) : '';
                content = content.replace(/(<|&lt;)\s*\/?\s*script\s*\/?\s*(<|&gt;)/gi, '```');

                attrs.url = url;
                attrs.title = title;
                attrs.content = content;
                self.assign('attrs', attrs);
                return self.display();
            });
        },

        saveCaptureAction: function() {
            var self = this;
            var urlModel = D('Url');
            var articleModel = D('Article');
            var url = self.post('url');
            var articleData = {
                title: self.post('title'),
                tag: self.post('tag'),
                contributor: self.post('contributor'),
                contributor_website: self.post('website'),
                content: self.post('content'),
                url: url
            };
            if (!url || !articleData.title || !articleData.tag || !articleData.content) {
                return self.redirectIndex('不合法的请求参数');
            }
            return urlModel.where({ url: url }).select().then(function(data) {
                if (data.length > 0) {
                    articleData.url_id = data[0].id;
                    articleData.version = (data[0].last_version + 1);
                    return articleModel.addArticle(articleData).then(function(aid) {
                        return self.redirectDetail('收录成功', aid);
                    });
                } else {
                    return urlModel.add({
                        url: url
                    }).then(function(uid) {
                        articleData.url_id = uid;
                        articleData.version = 1;
                        return articleModel.addArticle(articleData).then(function(aid) {
                            return self.redirectDetail('收录成功', aid);
                        });
                    });
                }
            }).catch(function() {
                return self.redirectIndex('提交失败', 'url=' + encodeURIComponent(url));
            });
        },

        detailAction: function() {
            var self = this;
            var id = self.get('id');
            if (!id) {
                self.redirectIndex();
            } else {
                return D('Article').where({ id: id }).select().then(function(article) {
                    if (article.length > 0) {
                        return Promise.all([
                            D('Article').where({ url_id: article[0].url_id }).order('version DESC').select().then(function(relatives) {
                                return relatives;
                            }),
                            D('Article').query('SELECT * FROM (SELECT * FROM __ARTICLE__ ORDER BY version DESC) a GROUP BY url ORDER BY create_time DESC').then(function(latest) {
                                return latest;
                            })
                        ]).then(function(data) {
                            article[0].content = marked(String(article[0].content));
                            self.assign('article', article[0]);
                            self.assign('relatives', data[0]);
                            self.assign('latest', data[1]);
                            return self.display();
                        });
                    } else {
                        return self.redirectIndex('文章还没被收录');
                    }
                });
            }
        },

        listAction: function() {

            return this.display();
        },

        tagAction: function() {

            return this.display();
        },

        searchAction: function() {

            return this.display();
        },

        redirectIndex: function(error, p) {
            return this.redirect('/home/index/index' + (error ? '?error=' + encodeURIComponent(error) : '') + (p ? '&' + p : ''));
        },

        redirectDetail: function(msg, id) {
            return this.redirect('/home/index/detail/id/' + id + '?msg=' + encodeURIComponent(msg));
        }
    };
});
