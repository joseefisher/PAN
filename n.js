const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
// 文件上传中间件
const Multer = require('multer');
const ejs = require('ejs');

// 创建服务器
const server = express();

// 创建注册路由
const loginRouter = express.Router();
const showRouter = express.Router();

// 监听接口
server.listen(9111);
server.use(Multer({ dest: './wp/allFiles' }).any());

// 监听到login,只要注册，都归它
server.use('/login', loginRouter);
server.use('/show', showRouter);



server.use('/show.html', (req, res) => {


    //console.log(req.query.page)
    if (req.query.page == undefined || req.query.page == 0) {
        var page = 0
    } else {
        var page = req.query.page;
    }
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'tzj951016',
        'database': 'wp'
    });
    Pool.getConnection((err, c) => {
        if (err) {
            console.log(err);
            res.send({ 'ok': 0, 'msg': '数据库链接失败' });
            //c.end();
        } else {
            c.query('SELECT * FROM `allFiles`;', (err, data) => {
                if (err) {
                    console.log(err);
                    res.send({ ok: 0, data: '连接失败' });
                } else {
                    data = data.reverse();
                    var newData = data.slice(page * 10, page * 10 + 10);
                    console.log(newData)
                    ejs.renderFile('./wp/show.ejs', { allData: newData, page: page }, function(err, data) {

                        res.send(data);
                        //console.log(data)
                    });
                    //res.send({ok:1,data:data})
                };
                c.release();
            })
        }


    })


});

//download
showRouter.use('/addDownload', (req, res) => {
    console.log(req.query.hash, req.query.user)
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'tzj951016',
        'database': 'wp'
    });
    Pool.getConnection((err, c) => {
        if (err) {
            console.log(err);
            res.send({ 'ok': 0, 'msg': '数据库链接失败' });
            //c.end();
        } else {
            c.query('SELECT download FROM `allFiles` WHERE hashName="' + req.query.hash + '" AND user="' + req.query.user + '";', (err, data) => {
                if (err) {
                    console.log(err);
                    res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                    c.end();
                } else {
                    //[{download:0}]
                    // 
                    var d = Number(data[0].download) + 1;
                    //console.log(d,data)
                    c.query('UPDATE `allFiles` SET download="' + d + '" WHERE hashName="' + req.query.hash + '" AND user="' + req.query.user + '";', (err, data) => {
                        if (err) {
                            console.log(err);
                            res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                            c.release();
                        } else {
                            c.query('UPDATE `' + req.query.user + '` SET download="' + d + '" WHERE hashName="' + req.query.hash + '";', (err, data) => {
                                if (err) {
                                    console.log(err);
                                    res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                                    c.release();
                                } else {
                                    res.send({ 'ok': 1, 'msg': '下载成功' });
                                }
                                c.release();
                            })
                        }
                    })
                }
            })

        }

    })
});


//show页面
showRouter.use('/showPage', (req, res) => {
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'tzj951016',
        'database': 'wp'
    });
    Pool.getConnection((err, c) => {
        if (err) {
            console.log(err);
            res.send({ 'ok': 0, 'msg': '数据库链接失败' });
            //c.end();
        } else {
            c.query('SELECT * FROM `allFiles`;', (err, data) => {
                if (err) {
                    console.log(err);
                    res.send({ ok: 0, data: '连接失败' });
                } else {
                    res.send({ ok: 1, data: data })
                };
                c.release();
            })
        }


    })
});



//上传文件接口

loginRouter.use('/getfiles', (req, res) => {
    console.log(req.files) //{name:filsssss}
        // allFile里存的文件
        //新名：(path 'wp/allFiles/sffggbhhh'  + .docx)
    var newName = req.files[0].path + path.parse(req.files[0].originalname).ext;
    var hashName = req.files[0].filename + path.parse(req.files[0].originalname).ext;
    var thisTime = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    //老名字（文件路径加文件无后缀名），新名字
    fs.rename(req.files[0].path, newName, (err) => {
        if (err) {
            console.log(err);
        } else {
            var Pool = mysql.createPool({
                'host': 'localhost',
                'user': 'root',
                'password': 'tzj951016',
                'database': 'wp'
            });
            Pool.getConnection((err, c) => {
                if (err) {
                    console.log(err);
                    res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                    c.release();
                } else {
                    // 给数据库写东西
                    // 文件名

                    // 这个是给每个用户传的leo
                    c.query('INSERT INTO `' + req.body.Fsnames + '` (`lastName`,`hashName`,`size`,`type`,`download`,`lastTime`) VALUES("' + req.files[0].originalname + '","' + hashName + '","' + req.files[0].size + '","' + path.parse(req.files[0].originalname).ext + '","0","' + thisTime + '");', (err, data) => {
                        if (err) {
                            console.log(err);
                            res.send({ 'ok': 0, 'msg': '存储失败' });
                            c.release();

                        } else {
                            //这是给allFiles传的
                            c.query('INSERT INTO `allFiles` (`lastName`,`hashName`,`size`,`type`,`download`,`lastTime`,`user`) VALUES("' + req.files[0].originalname + '","' + hashName + '","' + req.files[0].size + '","' + path.parse(req.files[0].originalname).ext + '","0","' + thisTime + '","' + req.body.Fsnames + '");', (err, data) => {
                                if (err) {
                                    console.log(err);
                                    res.send({ 'ok': 0, 'msg': '存储失败' });
                                } else {
                                    res.send({ 'ok': 1, 'msg': '上传成功', hash: hashName, timer: thisTime });

                                }
                                c.release();

                            })

                        }
                    })


                }
            })


        }
    })

});



//注册
loginRouter.use('/res', (req, res) => {
    //console.log(req.query);
    // 正式写数据库这件事
    // 先查，有的话，用户名被占用;没有，写进去
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'tzj951016',
        'database': 'wp'
    });
    // 是否和数据库成功建立链接
    Pool.getConnection((err, c) => {
        if (err) {
            console.log(err);
            // 失败了和前台说一声
            res.send({ 'ok': 0, 'msg': '数据库链接失败' });
        } else {
            // 成功了就有query了
            c.query('SELECT user FROM `usertab` WHERE user="' + req.query.user + '";', (err, data) => {
                if (err) {
                    console.log(err);
                    res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                    c.release();
                } else {
                    // 链接成功
                    // 判断有没有重复注册，没有的话再写进数据库
                    if (data.length > 0) {
                        res.send({ 'ok': 0, 'msg': '用户名已占用' });
                        c.release();
                    } else {
                        // 
                        c.query('INSERT INTO `usertab` (`user`,`pass`) VALUES("' + req.query.user + '","' + req.query.pass + '");', (err, data) => {
                            if (err) {
                                console.log(err);
                                res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                                c.release();
                            } else {
                                // 制表
                                c.query(`CREATE TABLE ${req.query.user}
										(
										ID int(255) NOT NULL AUTO_INCREMENT,
										LastName varchar(255) NOT NULL,
										hashName varchar(255) NOT NULL,
										lastTime varchar(255) NOT NULL,
										type varchar(255),
										size varchar(255) NOT NULL,
										download varchar(255) NOT NULL,
										PRIMARY KEY (ID)
									)`, (err, data) => {

                                    if (err) {
                                        console.log(err);
                                    } else {
                                        res.send({ 'ok': 1, 'msg': '恭喜您,注册成功' });
                                    };
                                    c.release();


                                })



                            }
                            //c.end();
                        })
                    }
                }
            });
        }
    });
});


//删除文件
loginRouter.use('/removeFile', (req, res) => {
    //console.log(req.query)
    // 删除wp/allfiles下要删除的文件
    fs.unlink('./wp/allFiles/' + req.query.hash, (err) => {
        if (err) {
            console.log(err);
            res.send({ ok: 0, msg: '删除失败了' })
        } else {
            // 走数据库，删除数据库中的文件
            var Pool = mysql.createPool({
                'host': 'localhost',
                'user': 'root',
                'password': 'tzj951016',
                'database': 'wp'
            });
            Pool.getConnection((err, c) => {
                if (err) {
                    console.log(err);
                    res.send({ ok: 0, msg: '删除失败了' });
                    //c.end();
                } else {
                    // 删除leo
                    c.query('DELETE FROM `' + req.query.user + '` WHERE hashName="' + req.query.hash + '";', (err, data) => {
                        if (err) {
                            console.log(err);
                            res.send({ ok: 0, msg: '删除失败了' });
                            c.release();
                        } else {
                            // 删除leo不行，还得allFiles 的内容
                            c.query('DELETE FROM `allFiles` WHERE hashName="' + req.query.hash + '" AND user="' + req.query.user + '";', (err, data) => {

                                if (err) {
                                    console.log(err);
                                    res.send({ ok: 0, msg: '删除失败了' });

                                } else {
                                    res.send({ ok: 1, msg: '删除成功了' });

                                };
                                c.release();
                            })

                        };

                    })
                }

            })

        }
    })
});


//登录
loginRouter.use('/login', (req, res) => {
    //console.log(req.query);
    //console.log(1)
    var Pool = mysql.createPool({
        'host': 'localhost',
        'user': 'root',
        'password': 'tzj951016',
        'database': 'wp'
    });
    Pool.getConnection((err, c) => {
        if (err) {
            console.log(err);
            res.send({ 'ok': 0, 'msg': '数据库链接失败' });
        } else {
            c.query('SELECT user,pass FROM `usertab` WHERE user="' + req.query.user + '" AND pass="' + req.query.pass + '";', (err, data) => {
                if (err) {
                    console.log(err);
                    res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                    c.release();
                } else {
                    //[{user:leo,pass:123}]
                    // 成功了，找到了
                    if (data.length > 0) {
                        //登陆后上传的东西显示到前台
                        c.query('SELECT LastName,hashName,size,lastTime,download FROM `' + req.query.user + '`;', (err, data) => {
                            if (err) {
                                console.log(err);
                                res.send({ 'ok': 0, 'msg': '数据库链接失败' });
                            } else {
                                res.send({ 'ok': 1, 'msg': '登陆成功', 'data': data });
                            }
                            c.release();
                        });




                    } else {
                        // 找到了但用户名密码错误
                        //[]
                        res.send({ 'ok': 0, 'msg': '用户或密码错误' });
                        c.release();
                    }
                    //c.end();
                }
            });
        }
    });
});


// 访问wp文件夹下面的
server.use('/', express.static('./wp'))