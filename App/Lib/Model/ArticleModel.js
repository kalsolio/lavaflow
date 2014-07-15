'use strict';

module.exports = Model(function() {
    return {
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
        }
    };
});
