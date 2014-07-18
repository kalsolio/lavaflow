(function(window) {
    var document = window.document;
    var $loading = $('.lf-loading');
    var $list = $('.lf-list');

    function getScrollY() {
        return window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
    }

    ejs.filters.getVersion = function(o) {
        return 'v' + o.version + '-' + moment(o.create_date).format('YYYYMMDD');
    };

    var loading = false;
    var isEnd = false;
    var maxScrollY = 0;
    var page = window.CONF.page;
    var size = window.CONF.size;

    var listRender = ejs.compile('\
            <% for (var i = 0; i < articles.length; i++) { %>\
                <div class="media">\
                    <div class="media-body">\
                        <h4 class="media-heading"><a href="/detail/id/<%= articles[i].id %>"><%= articles[i].title %></a></h4>\
                        <p class="lf-info"><span class="glyphicon glyphicon-tags"></span>\
                            <% for (var j = 0, tags = articles[i].tag.split(","); j < tags.length; j++) { %>\
                                <% if (tags[j]) { %>\
                                    <a href="/list?tag=<%= encodeURIComponent(tags[j]) %>"><span class="label label-default"><%= tags[j] %></span></a>\
                                <% } %>\
                            <% } %> / \
                            版本：<%=: articles[i] | getVersion %>\
                        </p>\
                        <%= articles[i].content.substring(0, 300) %>\
                    </div>\
                </div>\
            <% } %>\
            ');

    $(window).scroll(function() {
        var scrollY = getScrollY();
        if (!isEnd && !loading && scrollY > maxScrollY) {
            loading = true;
            maxScrollY = scrollY;
            $.ajax({
                type: 'GET',
                url: '/paging',
                dataType: 'json',
                data: {
                    keyword: window.CONF.keyword,
                    tag: window.CONF.tag,
                    page: page + 1
                },
                success: function(data) {
                    if (data.errno === 0) {
                        if (data.data.length <= size) {
                            isEnd = true;
                            $loading.hide();
                        }
                        $list.append(listRender({ articles: data.data }));
                        page += 1;
                    }
                },
                complete: function() {
                    loading = false;
                }
            });
        }
    });
}(window));
