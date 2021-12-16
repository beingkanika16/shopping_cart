import React, { Component } from "react";
import { connect } from "react-redux";
import { TextField, Divider, Button } from "@material-ui/core";

import LoadingOverlay from "react-loading-overlay";
import {
  sendMobileNumber,
  sendOtp,
  addToCartApi,
  getTruecallerResponse,
} from "../AppApi";
import { ROUTE_REGISTER, ROUTE_CART } from "../Constant";
import "../AppAsset/CSS/Login.css";
import { cartItemCountHandle } from "../AppRedux/Action/CartItemCount";
import Swal from "sweetalert2";
import { storeToken, checkLogin } from "../Util";
import { Redirect } from "react-router-dom";
import { Helmet } from "react-helmet";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mobile: "",
      timer: 59,
      mobileerror: false,
      otp: "",
      otpError: false,
      showOtp: false,
      showMobile: true,
      errorMessage: "",
      load: true,
      stateData: {},
      disableResendButton: true,
      uniqueId: "",
      stopTimer: 0,
    };
  }

  componentDidMount = async () => {
    this.setState({
      load: false,
    });
  };

  // componentDidUpdate() {
  //   if (this.state.timer === 0) {
  //     clearInterval(this.countdown);
  //   }
  // }

  // componentWillUnmount() {
  //   clearInterval(this.countdown);
  // }

  onClickRequestOtp = async () => {
    if (this.validation()) {
      this.setState({ load: true });
      const mobileRes = await sendMobileNumber(this.state.mobile);
      if (mobileRes) {
        this.setState({ showOtp: true, load: false });
        setTimeout(() => {
          this.setState({ disableResendButton: false });
        }, 60000);
        this.countdown = setInterval(this.countDownTimer, 1000);
      } else {
        Swal.fire({
          title: "Some Error Occured, please retry",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
          position: "top",
        });
      }
    }
  };

  onClickResendOtp = async () => {
    if (this.validation()) {
      this.setState({ load: true });
      const mobileRes = await sendMobileNumber(this.state.mobile);
      if (mobileRes) {
        this.setState({ disableResendButton: true });
        this.setState({ load: false });
        setTimeout(() => {
          this.setState({ disableResendButton: false });
        }, 60000);
        this.countdown = setInterval(this.countDownTimer, 1000);
      } else {
        Swal.fire({
          title: "Some Error Occured, please retry",
          showConfirmButton: false,
          timer: 1500,
          toast: true,
          position: "top",
        });
      }
    }
  };

  onClickSubmitOtp = async () => {
    this.setState({ otpError: false, errorMessage: "" });
    if (this.state.otp !== "") {
      const res = await sendOtp(this.state.mobile, this.state.otp);
      if (res) {
        if (
          res &&
          res.data &&
          res.data.data &&
          res.data.data.user &&
          res.data.data.user.name === null
        ) {
          if (
            this.props.location.state &&
            this.props.location.state.itemDetail
          ) {
            this.props.history.push({
              pathname: `/${ROUTE_REGISTER}`,
              state: {
                itemDetail: this.props.location.state.itemDetail,
                token: res.data.data.access_token,
                mobile: this.state.mobile,
              },
            });
          } else if (
            this.props.location.state &&
            this.props.location.state.fromLoginButton
          ) {
            this.props.history.push({
              pathname: `/${ROUTE_REGISTER}`,
              state: {
                fromLoginButton: true,
                token: res.data.data.access_token,
                mobile: this.state.mobile,
              },
            });
          } else {
            this.props.history.push({
              pathname: `/${ROUTE_REGISTER}`,
              state: {
                token: res.data.data.access_token,
                mobile: this.state.mobile,
              },
            });
          }
        } else if (
          res &&
          res.data &&
          res.data.data &&
          res.data.data.user &&
          res.data.data.user.name &&
          res.data.data.user.name !== null
        ) {
          storeToken(res.data.data.access_token);
          if (
            this.props.location.state &&
            this.props.location.state.itemDetail
          ) {
            const addToCartres = await addToCartApi(
              this.props.location.state.itemDetail
            );
            if (addToCartres) {
              Swal.fire({
                title: "Item Added to cart",
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: "top",
              });
              this.props.cartItemCount();
              this.props.history.push(`/${ROUTE_CART}`);
            } else {
              Swal.fire({
                title: "Something Went wrong",
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: "top",
              });
            }
          } else if (
            this.props.location.state &&
            this.props.location.state.fromLoginButton
          ) {
            this.props.cartItemCount();
            this.props.history.go(-1);
          } else {
            this.props.cartItemCount();
            this.props.history.push(`/`);
          }
        }
      }
    } else {
      this.setState({ otpError: true, errorMessage: "This field is required" });
    }
  };

  onClickEditNumberHandle = () => {
    this.setState({ showMobile: true, showOtp: false });
  };

  onChangeHandle = async (e) => {
    const data = {
      ...this.state,
      [e.target.name]: e.target.value,
    };
    this.setState(data);
  };

  validation = () => {
    this.setState({
      mobileerror: false,
      errorMessage: "",
    });

    if (
      this.state.mobile === "" ||
      this.state.mobile.length < 10 ||
      this.state.mobile.length > 10
    ) {
      this.setState({
        mobileerror: true,
        errorMessage:
          this.state.mobile === ""
            ? "This field is required"
            : "Invalid Mobile Number (10 digit number required)",
      });
      return false;
    }
    return true;
  };

  handleTrueCallerResponse = async () => {
    const res = await getTruecallerResponse(this.state.uniqueId);
    this.setState({ stopTimer: this.state.stopTimer + 1 });
    if (res && res.data && res.truecallerStatus) {
      clearInterval(this.truecaller);
      this.setState({ load: false });
      if (
        res &&
        res.data &&
        res.data.user &&
        (res.data.user === null || res.data.user.name === null)
      ) {
        if (this.props.location.state && this.props.location.state.itemDetail) {
          this.props.history.push({
            pathname: `/${ROUTE_REGISTER}`,
            state: {
              itemDetail: this.props.location.state.itemDetail,
              token: res.data.access_token,
              mobile: res.data.user.mobile,
            },
          });
        } else if (
          this.props.location.state &&
          this.props.location.state.fromLoginButton
        ) {
          this.props.history.push({
            pathname: `/${ROUTE_REGISTER}`,
            state: {
              fromLoginButton: true,
              token: res.data.access_token,
              mobile: res.data.user.mobile,
            },
          });
        } else {
          this.props.history.push({
            pathname: `/${ROUTE_REGISTER}`,
            state: {
              token: res.data.access_token,
              mobile: res.data.user.mobile,
            },
          });
        }
      } else if (
        res &&
        res.data &&
        res.data.user &&
        res.data.user !== null &&
        res.data.user.name &&
        res.data.user.name !== null
      ) {
        storeToken(res.data.access_token);
        if (this.props.location.state && this.props.location.state.itemDetail) {
          const addToCartres = await addToCartApi(
            this.props.location.state.itemDetail
          );
          if (addToCartres) {
            Swal.fire({
              title: "Item Added to cart",
              showConfirmButton: false,
              timer: 1500,
              toast: true,
              position: "top",
            });
            this.props.cartItemCount();
            this.props.history.push(`/${ROUTE_CART}`);
          } else {
            Swal.fire({
              title: "Something Went wrong",
              showConfirmButton: false,
              timer: 1500,
              toast: true,
              position: "top",
            });
          }
        } else if (
          this.props.location.state &&
          this.props.location.state.fromLoginButton
        ) {
          this.props.cartItemCount();
          this.props.history.go(-1);
        } else {
          this.props.cartItemCount();
          this.props.history.push(`/`);
        }
      }
    } else if (this.state.stopTimer > 3) {
      clearInterval(this.truecaller);
      this.setState({ load: false });
      Swal.fire({
        title: "Something went wrong",
        showConfirmButton: false,
        timer: 4000,
        toast: true,
        position: "top",
      });
    }
  };

  onClickTrueCallerLogin = () => {
    const UNIQUE_REQUEST_ID = new Date().getTime().toString();
    this.setState({ uniqueId: UNIQUE_REQUEST_ID });
    window.location = `truecallersdk://truesdk/web_verify?type=btmsheet&requestNonce=${UNIQUE_REQUEST_ID}&partnerKey=WADHj518e9b178f474b68870045c219650d50&partnerName=productionBadat&lang=en&loginPrefix=continue&loginSuffix=verifymobile&ctaPrefix=proceedwith&btnShape=rect`;
    setTimeout(() => {
      if (document.hasFocus()) {
        Swal.fire({
          title: "Truecaller not available in your device",
          showConfirmButton: false,
          timer: 4000,
          toast: true,
          position: "top",
        });
      } else {
        this.setState({ load: true });
        this.truecaller = setInterval(this.handleTrueCallerResponse, 6000);
      }
    }, 600);
  };

  countDownTimer = () => {
    if (this.state.disableResendButton && this.state.timer >= 0) {
      this.setState((prevState) => {
        return { timer: prevState.timer - 1 };
      });
    }
    if (this.state.timer === -1) {
      this.setState({ timer: 59 });
      clearInterval(this.countdown);
    }
  };

  render() {
    if (checkLogin()) {
      return <Redirect to="/" />;
    }

    return (
      <>
        <Helmet>
          <title>Badhat</title>
          <meta name="keywords" content="badhat,badat,Badhat.app" />
          <meta
            name="description"
            content="Badhat is a personal app/website for B2B businesses.Retailers easily connect, browse, & ORDER products from wholesalers/Suppliers.Badhat provides seamless connectivity between Suppliers (Manufacturers, Stockists, Dealers, Distributors,Agent, Brands, suppliers) and Buyers (Retailers,kirnana shops, Re-sellers, online sellers etc.)."
          />
          <link
            rel="apple-touch-icon"
            href="https://drive.google.com/file/d/1hZFX14ynp6EuS-Sdtkt0fqbA6FsHl7NU/view"
          />
        </Helmet>
        <LoadingOverlay active={this.state.load} spinner text="Loading...">
          <div className="loginContainer">
            <div className="loginFormContainer">
              <div className="loginFormDiv">
                <div style={{ textAlign: "center" }}>
                  Enter Mobile Number To Login
                </div>
                <div className="loginFormField">
                  <TextField
                    autoFocus={true}
                    fullWidth
                    required
                    defaultValue={this.state.mobile}
                    name="mobile"
                    label="Mobile Number"
                    variant="outlined"
                    type="tel"
                    onChange={this.onChangeHandle}
                    inputProps={{ maxLength: 10 }}
                    helperText={`${this.state.mobile.length}/10`}
                    FormHelperTextProps={{
                      className: "helperTextMobile",
                    }}
                  />
                  {this.state.mobileerror ? (
                    <span
                      style={{
                        color: "red",
                        fontSize: "x-small",
                        fontWeight: "700",
                      }}
                    >
                      {this.state.errorMessage}
                    </span>
                  ) : null}
                </div>
                {this.state.showOtp ? (
                  <div className="loginFormField">
                    <TextField
                      autoFocus={this.state.showOtp}
                      fullWidth
                      required
                      defaultValue={this.state.otp}
                      name="otp"
                      type="tel"
                      label="OTP"
                      variant="outlined"
                      onChange={this.onChangeHandle}
                      inputProps={{ maxLength: 4 }}
                      helperText={`${this.state.otp.length}/4`}
                      FormHelperTextProps={{
                        className: "helperTextOtp",
                      }}
                    />
                    {this.state.otpError ? (
                      <span
                        style={{
                          color: "red",
                          fontSize: "x-small",
                          fontWeight: "700",
                        }}
                      >
                        {this.state.errorMessage}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {!this.state.showOtp ? (
                  <div className="loginFormField">
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        width: "50%",
                        marginLeft: "25%",
                        marginRight: "25%",
                      }}
                      onClick={this.onClickRequestOtp}
                      disabled={this.state.mobile.length === 10 ? false : true}
                    >
                      Request Otp
                    </Button>
                  </div>
                ) : null}
                {this.state.showOtp ? (
                  <div className="loginFormField">
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        width: "50%",
                        marginLeft: "5%",
                        marginRight: "5%",
                      }}
                      onClick={this.onClickResendOtp}
                      disabled={this.state.disableResendButton}
                    >
                      Resend Otp
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      style={{
                        width: "30%",
                        marginLeft: "5%",
                        marginRight: "5%",
                      }}
                      onClick={this.onClickSubmitOtp}
                      disabled={this.state.otp.length === 4 ? false : true}
                    >
                      Submit
                    </Button>
                  </div>
                ) : null}
                {this.state.disableResendButton && this.state.showOtp ? (
                  <div style={{ fontSize: "x-small", fontWeight: "700" }}>
                    Resend OTP : <span>{this.state.timer}</span>
                  </div>
                ) : null}
                <br />
                <Divider />
                <div style={{ textAlign: "center" }}>OR</div>
                <Divider />
                <div className="loginFormField">
                  <Button
                    variant="contained"
                    color="primary"
                    sizw="large"
                    style={{
                      width: "90%",
                      height: "70px",
                      marginLeft: "5%",
                      marginRight: "5%",
                    }}
                    onClick={this.onClickTrueCallerLogin}
                  >
                    Login With Truecaller
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </LoadingOverlay>
      </>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  cartItemCount: () => dispatch(cartItemCountHandle()),
});

export default connect(null, mapDispatchToProps)(Login);
