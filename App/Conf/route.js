module.exports = [
    [/^index$/i, 'home/index/index'],
    [/^capture$/i, 'home/index/capture'],
    [/^detail\/(\d+)/i, 'home/index/detail?id=:1'],
    [/^saveCapture$/i, 'home/index/saveCapture'],
    [/^list$/i, 'home/index/list'],
    [/^paging$/i, 'home/index/paging'],
    [/^login$/i, 'admin/index/login'],
    [/^admin$/i, 'admin/index/index']
];
