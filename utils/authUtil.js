const isEmailValidator = ({str}) => { //search email regex js and refer to stackoverflow website.
    const isEmail =  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(str)
    return isEmail;
};

const userDataValidation = ({name, email, username,password}) => {
    return new Promise((resolve,reject) => {
        if(!name || !email || !username || !password) reject("Missing userData");

        if(typeof(name) !== "string") reject("The given name is not a text");
        if(typeof email !== "string") reject("The given email is not a text");
        if(typeof username !== "string") reject("The given username is not a text");
        if(typeof password !== "string") reject("The given password is not a text");

        if(username.length < 3 || username.length > 50)reject('username length must be b/w 3-50 characters long');

        if(!isEmailValidator({str: email}))reject("Format of email is incorrect");
        resolve();
    })
} 
module.exports = {userDataValidation, isEmailValidator};
