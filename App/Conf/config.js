module.exports = {
    //配置项: 配置值
    port: 8469, //监听的端口
    app_group_list: ['Home', 'Admin'], //分组列表

    db_type: 'mysql', // 数据库类型
    db_host: '127.0.0.1', // 服务器地址
    db_port: '3306', // 端口
    db_name: 'lavaflow', // 数据库名
    db_user: 'root', // 用户名
    db_pwd: 'admin', // 密码
    db_prefix: 'lf_', // 数据库表前缀

    //缓存配置
    db_cache_on: true, // 是否启用查询缓存，如果关闭那么cache方法则无效
    db_cache_type: '', // 缓存类型，默认为内存缓存
    db_cache_path: CACHE_PATH + '/db', //缓存路径，File类型下有效
    db_cache_timeout: 3600, // 缓存时间，默认为1个小时

    session_name: 'thinkjs', // session对应的cookie名称
    session_type: 'File', // session存储类型, 空为内存，还可以为Db
    session_path: CACHE_PATH + '/session', // File类型下文件存储位置，默认为系统的tmp目录
    session_options: {}, // session对应的cookie选项
    session_sign: '', // session对应的cookie使用签名，如果使用签名，这里填对应的签名字符串
    session_timeout: 24 * 3600, // session失效时间，单位：秒

    cache_type: 'File', // 数据缓存类型
    cache_path: CACHE_PATH + '/cache', // 缓存路径设置 (File缓存方式有效)
    cache_timeout: 2 * 3600, // 数据缓存有效期，单位: 秒
    cache_file_suffix: '.json', // File缓存方式下文件后缀名
    cache_gc_hour: [4], // 缓存清除的时间点，数据为小时

    load_ext_config: ['admin'],

    error_tpl_path: VIEW_PATH + '/error.html', // 错误页模版

    lf_host: 'http://lavaflow.75team.com'

};
