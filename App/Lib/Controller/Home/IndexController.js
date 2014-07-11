'use strict';

module.exports = Controller(function() {
    return {
        indexAction: function() {
            this.display();
        },

        captureAction: function() {
            // TODO 抓取页面，将HTML解析成 markdown 格式

            this.display();
        },

        saveAction: function() {

            // 响应JSON

            this.display('detail');
        },

        listAction: function() {

            this.display();
        },

        tagAction: function() {

            this.display();
        },

        searchAction: function() {

            this.display();
        },

        detailAction: function() {

            this.display();
        }
    };
});
