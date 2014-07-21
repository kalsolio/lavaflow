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

global.escapeHTML = function(str) {
    return str.replace(escapeRe, escapeFn);
};

global.escapeHTML1 = function(str) {
    return str.replace(escapeRe, function(s) {
        return {
            "<": "&#60;",
            ">": ">",
            '"': "&#34;",
            "'": "&#39;",
            "&": "&#38;"
        }[s];
    });
};

global.escapeSQL = function(str) {
    return str.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
        switch(s) {
          case '\0':
            return '\\0';
          case '\n':
            return '\\n';
          case '\r':
            return '\\r';
          case '\b':
            return '\\b';
          case '\t':
            return '\\t';
          case '\x1a':
            return '\\Z';
          default:
            return '\\' + s;
        }
    });
}

global.formatDate = function(t) {
    return moment(t).format('YYYY-MM-DD HH:mm');
};

global.getVersion = function(o) {
    return 'v' + o.version + '-' + moment(o.create_time).format('YYYYMMDD');
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

global.getTagColor = function() {
    var color;
    switch(Math.floor(Math.random() * 10)) {
        case 0:
            color = '#777';
            break;
        case 1:
            color = '#428bca';
            break;
        case 2:
            color = '#5cb85c';
            break;
        case 3:
            color = '#5bc0de';
            break;
        case 4:
            color = '#f0ad4e';
            break;
        case 5:
            color = '#d9534f';
            break;
        case 6:
            color = '#a3cf62';
            break;
        case 7:
            color = '#9b95c9';
            break;
        case 8:
            color = '#ea66a6';
            break;
        case 9:
            color = '#33a3dc';
            break;
    }
    return color;
}
