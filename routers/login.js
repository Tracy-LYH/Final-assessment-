
/*
 *   login 模块//接口路由
 *   /                            首页
 *   /register                    用户注册
 *   /login                       用户登录
 */

var express = require('express');
var routerLogin = express.Router();

var User = require('../models/User');
var Category = require('../models/Category');//分类模型
var Content = require('../models/Content');

// var responseData = require('../models/ReturnDataFormat');
var data;
//处理通用数据
routerLogin.use(function (req, res, next) {
    data = {
        userInfo: req.userInfo,
        categories: []
    };
    Category.find().then(function (categories) {
        // console.log(categories);
        data.categories = categories;
        // //读取内容的总数
        // return Content.where(whereStr).count();
        next();
    })
});
// 构造返回 json 格式
var responseData;
routerLogin.use(function (req, res, next) {
    responseData = {
        code: 0,
        message: ''
    }
    next();
});


/*
 *  用户注册
 *      1、用户名不能为空   // 不能存在同名（已注册）
 *      2、密码不能为空 // 两次密码需一样
 */

//注册接口
routerLogin.post('/user/register', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;

    //用户名判空
    if (username === '') {
        responseData.code = '1';
        responseData.message = '用户名不能为空';
        res.js//留言评论提交
        routerLogin.post('/comment/post', function (req, res, next) {
            //内容的ID
            var contentID = req.body.contentID;
            //定义评论 数组中字段
            var postData = {
                username: req.userInfo.username || '游客',
                postTime: new Date(),
                comment: req.body.comment
            }
            //查询当前这篇内容的信息
            Content.findOne({
                _id: contentID
            }).then(function (content) {
                content.comments.push(postData);
                return content.save();
            }).then(function (newContent) {
                responseData.message = "评论成功";
                responseData.data = newContent;
                res.json(responseData);
            });
        });
        ;
    }
    //密码检测
    if (password === '' || repassword === '') {
        responseData.code = '2';
        responseData.message = '密码不能为空';
        res.json(responseData);
        return;
    }
    if (password !== repassword) {
        responseData.code = '3';
        responseData.message = '两次密码不一致';
        res.json(responseData);
        return;
    }
    //检测用户名是否已经被注册，如果数据库存在同名数据表示用户名已经被注册
    User.findOne({
        username: username
    }).then(function (userInfo) {
        if (userInfo) {
            responseData.code = '4';
            responseData.message = '用户名已被注册';
            res.json(responseData);
            return;
        }
        else {
            // 无上述情况//则可注册保存用户注册信息到数据库中//返回注册成功
            var userRegisterData = new User({
                username: username,
                password: password,
                isSuperAdmin: false,
                isAdmin: true
            });
            userRegisterData.save();//
            return;
        }
    }).then(function (newUserInfo) {
        console.log(newUserInfo);//
        responseData.code = '0';
        responseData.message = '成功';
        res.json(responseData);
        return;
    });

});
//用户登录
routerLogin.get('/', function (req, res) {
    res.render('main/login');
});

routerLogin.post('/doLogin', function (req, res) {
    console.log(req.body);
    var uName = req.body.name;
    var pWord = req.body.password;
    //console.log(uName);
    //console.log(pWord);
    //空值等检测放在前端处理
    //后台数据验证处理
    User.findOne({
        username: uName,
        password: pWord
    }).then(function (userInfo) {
        console.log('11111 '+ userInfo);
        if (!userInfo) {
            responseData.code = '1';
            responseData.message = '用户名或密码错误';
            res.json(responseData);
            //console.log('说错了');
            return;
        }
        // else {
        //此处登录验证成功，进入用户首页有两种方式：
        //1、前端根据返回的成功数据进行Url重定向实现//这样相当于二次请求服务器 TODO 思考
        //2、后台 用redirect 进行路由重定向
        // res.redirect('/');
        responseData.code = '0';
        responseData.message = '成功';
        //console.log('说没错');
        //添加返回用户cookie数据
        responseData.userInfo = {
            _id: userInfo._id,
            username: userInfo.username
        };
        req.cookies.set('userInfo', JSON.stringify({
            _id: userInfo._id,
            username: userInfo.username
        }));
        //res.redirect('/admin');
        res.json(responseData);
        // console.log('这里打印 登录成功服务端返回给客户端的 返回信息 ' + responseData);
        return;
        // }
    });
});
//退出
routerLogin.get('/user/logout', function (req, res) {
    responseData.code = '0';
    req.cookies.set('userInfo', null);
    res.json(responseData);
    return;
});

module.exports = routerLogin;
