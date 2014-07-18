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

    cache_type: 'File', // 数据缓存类型
    cache_path: CACHE_PATH + '/file', // 缓存路径设置 (File缓存方式有效)
    cache_timeout: 2 * 3600, // 数据缓存有效期，单位: 秒
    cache_file_suffix: '.json', // File缓存方式下文件后缀名
    cache_gc_hour: [4] // 缓存清除的时间点，数据为小时

};
