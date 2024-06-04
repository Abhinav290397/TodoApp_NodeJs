const isAuth = (req,res,next) => {    //next is a callback function. that is passing in app.get as (req,res) => {return res.render("dashboard Page")}
    if(req.session.isAuth){
        next();
    }
    else{
        return res.send({
            status: 401,
            message: "Session expired,Pls login again."
        });
    }
}
module.exports = isAuth;