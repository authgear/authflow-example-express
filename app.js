const express = require('express');
const axios = require('axios');

const app = express();
const session = require('express-session');
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'twin elephant', cookie: { maxAge: 300000 } }));

//login function
const endpoint = "https://cube-crisp-110.authgear-staging.com";

async function userLogin(email, password, url_query) {
    const url = `${endpoint}/api/v1/authentication_flows?${url_query}`;

    const input = {
        "type": "login",
        "name": "default",
        "batch_input":
            [
                {
                    "identification": "email",
                    "login_id": email
                },
                {
                    "authentication": "primary_password",
                    "password": password
                }
            ]
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        const startLogin = await axios.post(`${url}`, input, {
            headers: headers
        });

        console.log(JSON.stringify(startLogin.data));
        return startLogin;
    }
    catch (error) {
        console.log(error.response.data.error);
        return error.response;

    }
}

//function for first step of signup flow
async function initSignUp(url_query) {
    const url = `${endpoint}/api/v1/authentication_flows?${url_query}`;

    const input = {
        "type": "signup",
        "name": "default"
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        startSignUp = await axios.post(url, input, {
            headers: headers
        });

        return startSignUp.data.result.state_token;
    }
    catch (error) {
        console.log(error.response.data.error);
        return error.response;
    }
}

async function submitSignUpData(email, password, state_token) {
    const url = `${endpoint}/api/v1/authentication_flows/states/input`;

    const input = {
        "state_token": state_token,
        "batch_input":
            [
                {
                    "identification": "email",
                    "login_id": email
                },
                {
                    "authentication": "primary_password",
                    "new_password": password
                }
            ]
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        const sendSignUpData = await axios.post(`${url}`, input, {
            headers: headers
        });
        return sendSignUpData;
    }
    catch (error) {
        console.log(error.response);
        return error.response;
    }
}

async function initOTPLogin(url_query) {
    const url = `${endpoint}/api/v1/authentication_flows?${url_query}`;

    const input = {
        "type": "login",
        "name": "default"
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        startSignUp = await axios.post(url, input, {
            headers: headers
        });

        return startSignUp.data.result.state_token;
    }
    catch (error) {
        console.log(error.response.data.error);
        return error.response;
    }
}

async function sendOTP(email, state_token) {
    const url = `${endpoint}/api/v1/authentication_flows/states/input`;

    const input = {
        "state_token": state_token,
        "batch_input":
            [
                {
                    "identification": "email",
                    "login_id": email
                },
                {
                    "authentication": "primary_oob_otp_email",
                    "index": 0, //index is the position of primary_oob_otp_email in the authentication methods list for your authflow api.
                    "channel": "email"
                }
            ]
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        const requestOtp = await axios.post(`${url}`, input, {
            headers: headers
        });
        return requestOtp;
    }
    catch (error) {
        console.log(error.response);
        return error.response;
    }
}

async function verifyOtp(code, state_token) {
    const url = `${endpoint}/api/v1/authentication_flows/states/input`;

    const input = {
        "state_token": state_token,
        "input": {
            "code": code
        }
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        const requestVerifyOtp = await axios.post(`${url}`, input, {
            headers: headers
        });
        return requestVerifyOtp;
    }
    catch (error) {
        console.log(error.response);
        return error.response;
    }
}

async function resendOtp(state_token) {
    const url = `${endpoint}/api/v1/authentication_flows/states/input`;

    const input = {
        "state_token": state_token,
        "input": {
            "resend": true
        }
    };

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try {
        const requestNewOtp = await axios.post(`${url}`, input, {
            headers: headers
        });
        return requestNewOtp;
    }
    catch (error) {
        console.log(error.response);
        return error.response;
    }
}

function rawURLQuery(url) {
    const index = url.indexOf('?');
    return (index === 0) ? url.substr(index + 1) : "";
}

app.get('/', (req, res) => {
    res.send(`
    <p>learn more about how to use this project on docs.authgear.com</p>
    `);
});

app.get('/login', (req, res) => {
    //get URL query
    const URLQuery = rawURLQuery(req.url);
    res.send(`
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css"
            integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <title>Login</title>
    </head>

    <body>
        <div class="container pt-4">
            <form class="" action="./login" method="POST" enctype="application/x-www-form-urlencoded">
                <div class="">
                    <label class="">
                        Email
                    </label>
                    <input name="email" id="email" type="email" class="form-control mb-2" placeholder="Enter your email" />
                </div>
                <div>
                    <label>
                        Password
                    </label>
                    <input name="password" id="password" type="password" class="form-control mb-2" placeholder="Enter your password" />
                </div>
                <input type="hidden" name="url_query" value="${URLQuery}">
                <button type="submit" class="btn btn-primary">
                    Submit
                </button>
            </form>
            <div>
                <span>Or</span>
                <a href="/signup?${URLQuery}">Sign Up</a>
            </div>
            <div>
                <span>Or</span>
                <a href="/otpLogin?${URLQuery}">Login with OTP</a>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.post('/login', async (req, res) => {
    console.log(req.body);
    try {
        const apiResponse = await userLogin(req.body.email, req.body.password, req.body.url_query);
        if (apiResponse.status == 200 && apiResponse.data.result.action.data.finish_redirect_uri !== undefined) {
            res.redirect(apiResponse.data.result.action.data.finish_redirect_uri);
        } else {
            //this code will run usually when your authentication flow starts without the URL Query in the initial request.
            res.send(apiResponse.data);
        }
    }
    catch (error) {
        console.log(error);
        res.send("Error: anthentication failed!");
    }
});

app.get('/signup', async (req, res) => {
    const URLQuery = rawURLQuery(req.url);
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css"
                integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
            <title>Register</title>
        </head>
        
        <body>
            <div class="container pt-4">
                <form class="" action="./signup" method="POST" enctype="application/x-www-form-urlencoded">
                    <div class="form-group">
                        <label class="">
                            Email
                        </label>
                        <input name="email" type="email" class="form-control mb-2" placeholder="Enter your email" />
                    </div>
                    <div class="form-group">
                        <label>
                            Password
                        </label>
                        <input name="password" type="password" class="form-control mb-2" placeholder="Enter your password" />
                    </div>
                    <div class="form-group">
                        <label>
                            Repeat Password
                        </label>
                        <input name="password2" type="password" class="form-control mb-2" placeholder="Enter your password" />
                    </div>
                    <input type="hidden" name="state_token" value="${await initSignUp(URLQuery)}">
                    <button type="submit" class="btn btn-primary">
                        Submit
                    </button>
                </form>
            <div>
        </body>
        </html>
    
    `);
});

app.post('/signup', async (req, res) => {
    try {
        const apiResponse = await submitSignUpData(req.body.email, req.body.password, req.body.state_token);
        if (apiResponse.status == 200 && apiResponse.data.result.action.data.finish_redirect_uri !== undefined) {
            res.redirect(apiResponse.data.result.action.data.finish_redirect_uri);
        } else {
            //this code will run usually when your authentication flow starts without the URL Query in the initial request.
            res.send(apiResponse.data);
        }
    }
    catch (error) {
        console.log(error)
        res.send("Error: anthentication failed!");
    }
});

app.get('/otpLogin', async (req, res) => {
    const URLQuery = rawURLQuery(req.url);
    res.send(`
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css"
            integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <title>Login</title>
    </head>

    <body>
        <div class="container pt-4">
        <p>To use OTP login, enable passwordless login in Authgear portal (Authentication > Login Methods)</p>
            <form class="" action="./otpLogin" method="POST" enctype="application/x-www-form-urlencoded">
                <div class="">
                    <label class="">
                        Email
                    </label>
                    <input name="email" id="email" type="email" class="form-control mb-2" placeholder="Enter your email" />
                </div>
                <input type="hidden" name="state_token" value="${await initOTPLogin(URLQuery)}">
                <button type="submit" class="btn btn-primary">
                    Login
                </button>
            </form>
        </div>
    </body>
    </html>
    `);
});

app.post('/otpLogin', async (req, res) => {
    try {
        const apiResponse = await sendOTP(req.body.email, req.body.state_token);
        if (apiResponse.status == 200) {
            req.session.otp_response = apiResponse.data.result.action.data;
            req.session.otp_response.state_token = apiResponse.data.result.state_token;
            res.redirect("/verifyOtp");
        } else {
            //this code will run usually when your authentication flow starts without the URL Query in the initial request.
            res.send(apiResponse.data);
        }
    }
    catch (error) {
        console.log(error)
        res.send("Error: anthentication failed!");
    }
});

app.get('/verifyOtp', async (req, res) => {
    if (req.session.otp_response === undefined) {
        res.send("An error occurred! Please restart the authentication process.")
    } else {
        const otpResponseData = req.session.otp_response;
        res.send(`
    <!DOCTYPE html>
    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css"
            integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <title>Login</title>
    </head>

    <body>
        <div class="container pt-4">
            <form class="" action="./verifyOtp" method="POST" enctype="application/x-www-form-urlencoded">
                <div class="">
                <p>Email: ${otpResponseData.masked_claim_value}</p>
                    <label class="">
                        Code
                    </label>
                    <input name="code" id="code" type="text" class="form-control mb-2" placeholder="Enter the OTP code (000000 for this test) sent to your email " />
                </div>
                <input type="hidden" name="state_token" value="${otpResponseData.state_token}">
                <button type="submit" class="btn btn-primary">
                    Verify
                </button>

                <div>
                    <a href="/resendOtp">Resend OTP</a>
                    <span> (wait untill ${otpResponseData.can_resend_at})</span>
                </div>
            </form>
        </div>
    </body>
    </html>
    `);
    }

});

app.post('/verifyOtp', async (req, res) => {
    try {
        const apiResponse = await verifyOtp(req.body.code, req.body.state_token);
        if (apiResponse.status == 200) {
            res.send("Login Successful!");
        } else {
            //this code will run usually when your authentication flow starts without the URL Query in the initial request.
            res.send(apiResponse.data);
        }
    }
    catch (error) {
        console.log(error)
        res.send("Error: anthentication failed!");
    }
});

app.get('/resendOtp', async (req, res) => {
    try {
        const apiResponse = await resendOtp(req.session.otp_response.state_token);
        if (apiResponse.status == 200) {
            res.redirect("/verifyOtp");
        } else {
            //this code will run usually when your authentication flow starts without the URL Query in the initial request.
            res.send(apiResponse.data);
        }
    }
    catch (error) {
        console.log(error)
        res.send("Error: anthentication failed!");
    }
});

app.listen(port, () => {
    console.log(`server started on port ${port}!`);
});