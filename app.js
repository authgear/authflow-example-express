const express = require('express');
const axios = require('axios');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));

const config = {
  client: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
    redirect_url: process.env.REDIRECT_URL,
  },
  auth: {
    tokenHost: process.env.AUTHGEAR_ENDPOINT,
    tokenPath: "/oauth2/token",
    authorizePath: "/oauth2/authorize",
  },
};

app.get("/", async (req, res) => {
  if (req.query.code != null) {
    const data = {
      client_id: config.client.id,
      client_secret: config.client.secret,
      code: req.query.code,
      grant_type: "authorization_code",
      response_type: "code",
      redirect_uri: config.client.redirect_url,
      scope: "openid",
    };

    try {
      const getToken = await axios.post(
        `${config.auth.tokenHost}${config.auth.tokenPath}`,
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const accessToken = getToken.data.access_token;

      //Now use access token to get user info.
      const getUserInfo = await axios.get(
        `${config.auth.tokenHost}/oauth2/userinfo`,
        { headers: { Authorization: "Bearer " + accessToken } }
      );
      const userInfo = getUserInfo.data;
      res.send(`
        <div style="max-width: 650px; margin: 16px auto; background-color: #EDEDED; padding: 16px;">
          <p>Welcome ${userInfo.email}</p>
          <p>This demo app shows you how to add user authentication to your Express app using Authgear</p>
          <div>
            <pre>${JSON.stringify(userInfo, null, 2)}</pre>
          </div>
            <p>Checkout <a href="https://docs.authgear.com">docs.authgear.com</a> to learn more about adding Authgear to your apps.</p>
          
        </div>
    `);
    } catch (error) {
      res.send(
        "An error occoured! Login could not complete. Error data: " +
          JSON.stringify(error.response.data)
      );
    }
  } else {
    res.send(`
      <div style="max-width: 650px; margin: 16px auto; background-color: #EDEDED; padding: 16px;">
        <p>Hi there!</p>
        <p>This demo app shows you how to add user authentication to your Express app using Authgear</p>
          <p>Checkout <a href="https://docs.authgear.com">docs.authgear.com</a> to learn more about adding Authgear to your apps.</p>
        <a href="/startLogin">Login</a>
      </div>
    `);
  }
});

app.get("/startLogin", (req, res) => {
  res.redirect(
    `${config.auth.tokenHost}${config.auth.authorizePath}/?client_id=${config.client.id}&redirect_uri=${config.client.redirect_url}&response_type=code&scope=openid`
  );
});

//code for custom UI
const endpoint = process.env.AUTHGEAR_ENDPOINT;

async function userLogin(email, password, url_query) {
  const url = `${endpoint}/api/v1/authentication_flows?${url_query}`;

  const input = {
    type: "login",
    name: "default",
    batch_input: [
      {
        identification: "email",
        login_id: email,
      },
      {
        authentication: "primary_password",
        password: password,
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const startLogin = await axios.post(`${url}`, input, {
      headers: headers,
    });

    return startLogin;
  } catch (error) {
    console.log(error.response.data.error);
    return error.response;
  }
}

//function for first step of signup flow
async function initSignUp(url_query) {
  const url = `${endpoint}/api/v1/authentication_flows?${url_query}`;

  const input = {
    type: "signup",
    name: "default",
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    startSignUp = await axios.post(url, input, {
      headers: headers,
    });

    return startSignUp.data.result.state_token;
  } catch (error) {
    console.log(error.response.data.error);
    return error.response;
  }
}

async function submitSignUpData(email, password, state_token) {
  const url = `${endpoint}/api/v1/authentication_flows/states/input`;

  const input = {
    state_token: state_token,
    batch_input: [
      {
        identification: "email",
        login_id: email,
      },
      {
        authentication: "primary_password",
        new_password: password,
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const sendSignUpData = await axios.post(`${url}`, input, {
      headers: headers,
    });
    return sendSignUpData;
  } catch (error) {
    console.log(error.response);
    return error.response;
  }
}

//helper function for getting URLQuery. See Authflow guide on Authgear documentation site to learn more about URLQuery
function rawURLQuery(url) {
  const index = url.indexOf("?");
  return index >= 0 ? `?${url.substr(index + 1)}` : "";
}

app.get("/login", (req, res) => {
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
                <a href="/signup${URLQuery}">Sign Up</a>
            </div>
            <div>
                <span>Or</span>
                <a href="/otpLogin${URLQuery}">Login with OTP</a>
            </div>
        </div>
    </body>
    </html>
    `);
});

app.post("/login", async (req, res) => {
  try {
    const apiResponse = await userLogin(
      req.body.email,
      req.body.password,
      req.body.url_query
    );
    if (
      apiResponse.status == 200 &&
      apiResponse.data.result.action.data.finish_redirect_uri !== undefined
    ) {
      res.redirect(apiResponse.data.result.action.data.finish_redirect_uri);
    } else {
      //this code will run usually when your authentication flow starts without the URL Query in the initial request.
      res.send(apiResponse.data);
    }
  } catch (error) {
    console.log(error);
    res.send("Error: anthentication failed!");
  }
});

app.get("/signup", async (req, res) => {
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
                    <input type="hidden" name="state_token" value="${await initSignUp(
                      URLQuery
                    )}">
                    <button type="submit" class="btn btn-primary">
                        Submit
                    </button>
                </form>
            <div>
        </body>
        </html>
    
    `);
});

app.post("/signup", async (req, res) => {
  try {
    const apiResponse = await submitSignUpData(
      req.body.email,
      req.body.password,
      req.body.state_token
    );
    if (
      apiResponse.status == 200 &&
      apiResponse.data.result.action.data.finish_redirect_uri !== undefined
    ) {
      res.redirect(apiResponse.data.result.action.data.finish_redirect_uri);
    } else {
      //this code will run usually when your authentication flow starts without the URL Query in the initial request.
      res.send(apiResponse.data);
    }
  } catch (error) {
    console.log(error);
    res.send("Error: anthentication failed!");
  }
});

app.listen(port, () => {
    console.log(`server started on port ${port}!`);
});