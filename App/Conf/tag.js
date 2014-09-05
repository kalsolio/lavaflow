var ejsBehavior = thinkRequire('thinkjs-behavior-ejs');
module.exports = {
    view_parse: [false, function(http, data) { return ejsBehavior(http).run(data); }]
};
