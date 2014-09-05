module.exports = Controller(function() {
    'use strict';
    
    var urlMod = require('url');
    var request = require('request');
    var cheerio = require('cheerio');
    var htmlparser = require('htmlparser2');
    var marked = require('marked');
    var toMarkdown = require('to-markdown').toMarkdown;
    var validator = require('validator');

    var GHOST_REQUEST_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2101.0 Safari/537.36',
        'Referer': ''
    };

    var tagExpires = 300; // 单位s

    var specialSelectors = [
        // 博客
        [/github\.com/, '.tab-content .comment-content .comment-body'], // Github issue
        [/csdn\.net/, '.article_content'], // blog.csdn.net
        [/cnblogs\.com/, '#cnblogs_post_body'], // www.cnblogs.com
        [/aliued\.cn/, '#content article .entry'], // www.aliued.cn
        [/alloyteam\.com/, '#content .content_text .content_banner > .text'], // www.alloyteam.com
        [/ued\.taobao\.com/, '#content .content-bd .post-bd'], // ued.taobao.com
        [/ruanyifeng\.com/, '#content .entry-content'], // www.ruanyifeng.com
        [/zhangxinxu\.com/, '#content .entry'], // www.zhangxinxu.com
        [/imququ\.com/, 'article .entry-content'], // www.imququ.com
        [/welefen\.com/, 'article .article'], // www.welefen.com

        // 社区
        [/html5rocks\.com/, '.page .pattern-bg-lighter section:nth-child(2)'], // www.html5rocks.com
        [/infoq\.com/, '.text_info_article'], // www.infoq.com
        [/www\.zhihu\.com/, '.zh-question-answer-wrapper .zm-editable-content'], // 知乎回答
        [/zhuanlan\.zhihu\.com/, '.entry .entry-content'], // 知乎专栏
        [/cssforest\.org/, '#content .entrybody'], // www.cssforest.org
        [/coolshell\.cn/, '#content .content'], // www.coolshell.cn
        [/36kr\.com/, '.content .article'], // www.36kr.com
        [/mp\.weixin\.qq\.com/, '.rich_media_content'], // mp.weixin.qq.com
        [/geek100\.com/, '.content .post'], // geek100.com

        // Other
        [/security\.tencent\.com/, '.safe_school_topics_cont'] // security.tencent.com
    ];

    // selectors的顺序不能随意更改，选取器顺序表示探测优先级
    var defaultSelectors = [
        '#content .content-bd .post-bd',
        '#content article .entry',
        '#content .entry-content',
        '#content .entry',
        '#content .content',
        '#content .entrybody',
        '.entry .entry-content',
        '.content .detail-article',
        '.content .article',
        '.content .post',
        'article .entry-content',
        'article .article',
        'article .content',
        'article .post',
        'article .post-bd',
        '#content article',
        '.article_content',
        '.detail-article',
        '.entry-content',
        '.content',
        '.content-bd',
        '#content',
        '.entry',
        'article',
        '.article',
        '.post',
        '.post-bd',
        'body'
    ];

    function getSpecialSelector(url) {
        var hostname = urlMod.parse(url).hostname;
        for (var i = 0, len = specialSelectors.length; i < len; i++) {
            if (specialSelectors[i][0].test(hostname)) {
                return specialSelectors[i][1];
            }
        }
        return null;
    }

    function getPage(url) {
        var deferred = getDefer();
        request({
            url: url,
            headers: GHOST_REQUEST_HEADERS
        }, function(error, response, body) {
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

    function filterContent(content, newContent, filterFn) {
        newContent = newContent || [];
        filterFn = filterFn || escapeHTMLWithoutGT;
        var sp = '```', sl = sp.length;
        var i1 = content.indexOf(sp);
        if (i1 != -1) {
            var c1 = content.substring(0, i1);
            content = content.substring(i1 + sl);
            var i2 = content.indexOf(sp);
            if (i2 != -1) {
                var code = content.substring(0, i2);
                content = content.substring(i2 + sl);
                newContent.push(filterFn(c1), sp, code, sp);
                return filterContent(content, newContent, filterFn);
            } else {
                newContent.push(filterFn(c1), sp, filterFn(content));
                return newContent;
            }
        } else {
            newContent.push(filterFn(content));
            return newContent;
        }
    }
    
    function filterHTML(content) {
        var arr = [];
        // 过滤掉所有html2markdown不解析的标签
        var re = /^(h[1-9]|hr|br|title|b|strong|i|em|dfn|var|city|ul|ol|dl|li|blockquote|pre|p|del|a|img)/i;
        var parser = new htmlparser.Parser({
            onopentag: function(tagName, attribs) {
                if (!re.test(tagName)) {
                    return;
                }
                if (tagName == 'pre') {
                    tagName = 'code';
                }
                arr.push('<', tagName);
                if (tagName == 'a' || tagName == 'img') {
                    for (var o in attribs) {
                        arr.push(' ', o, '="', escapeHTML(attribs[o]), '"');
                    }
                } 
                arr.push('>');
            },
            ontext: function(text) {
                arr.push(text);
            },
            onclosetag: function(tagName) {
                if (!re.test(tagName)) {
                    return;
                }
                if (tagName == 'img' ||
                    tagName == 'br'||
                    tagName == 'input') {
                    return;
                }
                if (tagName == 'pre') {
                    tagName = 'code';
                }
                arr.push('</', tagName, '>');
            }
        });
        parser.write(content);
        parser.end();
        return arr.join('');
    }

    return {
        init: function(http) {
            this.super('init', http);
            this.assign('exInfo', {});
        },

        indexAction: function() {
            var self = this;
            return Promise.all([
                    self.getTags(),
                    D('Article').getLatest()
                ]).then(function(data) {
                    self.assign('tags', data[0]);
                    self.assign('latest', data[1]);
                    return self.display();
                });
        },

        getTags: function() {
            return S('tags').then(function(tagCache) {
                if (!tagCache || (tagCache.lastModified + tagExpires * 1000) < Date.now()) {
                    return D('Article').getTags().then(function(data) {
                        var tags = {};
                        data.forEach(function(o) {
                            var arr = o.tag.split(',');
                            arr.forEach(function(t) {
                                t = t.trim();
                                if (t) {
                                    if (!tags[t]) {
                                        tags[t] = o.count;
                                    } else {
                                        tags[t] += o.count;
                                    }
                                }
                            });
                        });
                        var tagArr = [];
                        for (var t in tags) {
                            tagArr.push([t, tags[t]]);
                        }
                        tagArr.sort(function(a, b) {
                            return b[1] - a[1];
                        });
                        return S('tags', {
                            lastModified: Date.now(),
                            tags: tagArr
                        }).then(function() {
                            return tagArr;
                        });
                    });
                }
                return tagCache.tags;
            });
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
                return D('Url').where({ 'url': url }).find().then(function(urlData) {
                    var attrs = {};

                    // 如果文章已收录，那么将URL 提示到页面上
                    if (!isEmpty(urlData)) {
                        return D('Article').getArticle(urlData.last_version_aid, true).then(function(article) {
                            if (!isEmpty(article)) {
                                attrs.lastVersionUrl = C('lf_host') + '/detail/' + article.id;
                                attrs.tag = article.tag;
                            }
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
                $('meta').remove();
                $('script').remove();
                $('style').remove();
                $('head').append('<meta charset="utf-8">');
                title = $('title').html();

                var selectors = [];
                var selector = self.get('selector');
                if (selector) {
                    selectors.push(selector);
                }
                selector = getSpecialSelector(url);
                if (selector) {
                    selectors.push(selector);
                }
                selectors = selectors.concat(defaultSelectors);
                content = getContent($, selectors);

                // 过滤掉所有html2markdown不解析的标签
                content = filterHTML(content);
                content = content.replace(/\t/g, '  ');
                content = content ? toMarkdown(content) : '';

                // toMarkdown 组件现在解析<code> 标签不正确，需要重新转义一次
                content = content.replace(/`/g, '\n```\n');

                // 过滤掉非<code>块的行首空格
                content = filterContent(content, null, function(str) {
                    return str.replace(/\n */g, '\n');
                }).join('');

                // 如果图片外部嵌套了链接，防止链接解析出错导致错误的换行
                content = content.replace(/\[\n?(!\[[^\]]*\]\([^\)]+\))\n?\](\([^\)]+\))/g, function(s, s1, s2) {
                    return '\n\n[' + s1 + ']' + s2 + '\n\n';
                });

                // 为图片引入加上换行，防止图片与文字混成一行
                content = content.replace(/\n!\[[^\]]*\]\([^\)]+\)/g, function(s) {
                    return '\n\n' + s + '\n\n';
                });

                // 防止URL或图片路径出现非法URL
                content = content.replace(/\[([^\]]*)\]\(([^\)]+)\)/g, function(s, s1, s2) {
                    var s2m = s2.match(/[^ ]*/);
                    if (s2m) {
                        s2 = s2m[0];
                    }
                    return '[' + s1 + '](' + s2 + ')';
                });

                content = content.replace(/> *\n*```/g, function() {
                    return '> \n\n```';
                });

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
            var tag = self.post('tag');
            var tags = [];
            tag.replace(/\u0020|\uFF0C/g, ',').split(',').forEach(function(t) {
                t = t.trim();
                if (t && tags.indexOf(t) == -1) {
                    tags.push(t);
                }
            });
            var articleData = {
                title: self.post('title'),
                tag: tags.join(','),
                contributor: self.post('contributor'),
                contributor_website: self.post('website'),
                content: self.post('content'),
                url: url
            };
            if (!url || !articleData.title || !articleData.tag || !articleData.content) {
                return self.redirectIndex('不合法的请求参数，标题、标签、内容不能为空！');
            }

            articleData.content = filterContent(articleData.content).join('');
            articleData.marked_content = marked(articleData.content);

            return urlModel.where({ 'url': url }).find().then(function(urlData) {
                if (!isEmpty(urlData)) {
                    articleData.url_id = urlData.id;
                    articleData.version = (urlData.last_version + 1);
                    return articleModel.addArticle(articleData).then(function(aid) {
                        return self.redirectDetail('文章收录成功，当前版本：' + getVersion({ version: articleData.version, create_time: new Date() }), aid);
                    });
                } else {
                    return urlModel.add({
                        'url': url
                    }).then(function(uid) {
                        articleData.url_id = uid;
                        articleData.version = 1;
                        return articleModel.addArticle(articleData).then(function(aid) {
                            return self.redirectDetail('文章收录成功，你是第一个提交此文的人哦！', aid);
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
                var articleModel = D('Article');
                return articleModel.getArticle(id).then(function(article) {
                    if (!isEmpty(article)) {
                        return Promise.all([
                            articleModel.getArticlesByUrlId(article.url_id),
                            articleModel.getLatest()
                        ]).then(function(data) {
                            if (!article.marked_content) {
                                article.markedContent = marked(article.content);
                                articleModel.where({ id: id }).update({
                                    marked_content: article.markedContent
                                }).then(function() {
                                    return self.displayDetail(article, data);
                                });
                            } else {
                                article.markedContent = article.marked_content;
                                return self.displayDetail(article, data);
                            }
                        });
                    } else {
                        return self.redirectIndex('文章还没被收录');
                    }
                });
            }
        },

        displayDetail: function(article, data) {
            var self = this;
            self.assign('exInfo', {
                title: article.title,
                keywords: article.tag,
                description: article.content.substring(0, 100).replace(/\n/g, ''),
            });
            self.assign('article', article);
            self.assign('relatives', data[0]);
            self.assign('latest', data[1]);
            return self.display();
        },

        pageSize: 20,

        listAction: function() {
            var self = this;
            return D('Article').queryArticles(self.get('page'), self.pageSize, self.get('keyword'), self.get('tag')).then(function(articles) {
                self.assign('articles', articles);
                self.assign('size', self.pageSize);
                return self.display();
            });
        },

        pagingAction: function() {
            var self = this;
            return D('Article').queryArticles(self.get('page'), self.pageSize, self.get('keyword'), self.get('tag')).then(function(articles) {
                return self.success(articles);
            });
        },

        showImageAction: function() {
            var imgUrl = this.get('img');
            var urlObj = urlMod.parse(imgUrl);
            urlObj.protocol = urlObj.protocol || 'http:';
            var img = request({
                url: urlMod.format(urlObj),
                headers: GHOST_REQUEST_HEADERS
            });
            this.http.req.pipe(img);
            img.pipe(this.http.res);
        },

        redirectIndex: function(error, p) {
            return this.redirect('/index' + (error ? '?error=' + encodeURIComponent(error) : '') + (p ? '&' + p : ''));
        },

        redirectDetail: function(msg, id) {
            return this.redirect('/detail/' + id + '?msg=' + encodeURIComponent(msg));
        }
    };
});
