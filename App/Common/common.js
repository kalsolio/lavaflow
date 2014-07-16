var moment = require('moment');

var escapeMap = {
    "<": "&#60;",
    ">": "&#62;",
    '"': "&#34;",
    "'": "&#39;",
    "&": "&#38;"
};
var escapeRe = /&(?![\w#]+;)|[<>"']/g;
var escapeFn = function(s) {
    return escapeMap[s];
};

global.escapeHTML = function(content) {
    return content.replace(escapeRe, escapeFn);
};

global.formatDate = function(date) {
    return moment(date).format('YYYY-MM-DD HH:mm');
};

global.getContributor = function(o) {
    if (o.contributor && o.contributor_website) {
        return '<a href="' + global.escapeHTML(o.contributor_website) + '" target="_blank">' + global.escapeHTML(o.contributor) + '</a>';
    } else if (o.contributor && !o.contributor_website) {
        return global.escapeHTML(o.contributor);
    } else {
        return '匿名';
    }
};
