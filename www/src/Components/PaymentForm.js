import React, { Component } from "react";
import styled from "styled-components";
import { Button, TextField } from "@material-ui/core";
import { css } from "@emotion/core";
import BeatLoader from "react-spinners/ClipLoader";
import Frame from './Frame';

const Row = styled.div`
  display:flex;
  flex-direction:row;
  width:500px;
  justify-content:space-between
`;
const Input = styled(TextField)`
  padding: 10px;
  border-radius: 8px;
  border: solid 1px grey;
  font-size: 16px;
`;
const CardForm = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: column;
`;
const CustomPayButton = styled(Button)`
  width:500px
`;
const CardInputField = styled(Input)`
  width:500px;
`;
const SecurityMonthField = styled(Input)`
  width:48%
`;
const SecurityYearField = styled(Input)`
  width:48%
`;
const SecurityCodeField = styled(Input)`
  align-self:flex-start;
  width:100%
`;

export default class PaymentForm extends Component {
  state = {
    cardNumber: "4099000000001960",
    expiryMonth: "12",
    expiryYear: "22",
    securityCode: "147",
    loading: false,
    iframeCode:"",
    timer:10000,
    subTimer:20000,
    transactionId:"",
    transactionState:"Unknown",
    paymentComplete:false,
    status:'',
  };

  //Step 1, create the payment (/payments)
  submitPayment = () => {
    this.setState({ loading: true, initialPaymentSubmitted:true, });

    var raw = JSON.stringify({
      cardNumber: this.state.cardNumber,
      expiryMonth: this.state.expiryMonth,
      expiryYear: this.state.expiryYear,
      securityCode: this.state.securityCode,
    });


    var requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
      redirect: "follow",
    };

    // (See Step 2 on the API)
    fetch("http://localhost:3124/api/v1/payments", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log("Step 1: Submitted payment", data);

        // In the response we receive the iFrame code. We add this to the web page and then manually call the function to initiate it's data capture.

        //3DS 2.1
        this.setState({iframeCode:data.authenticationResponse.secure3dMethod.methodForm});
        this.setState({ loading: false, transactionId:data.ipgTransactionId});

        //Initiate 3DS Method function...
        document.getElementById("tdsMmethodForm").submit();

        //I operate the countdown
        setInterval(() => { if(this.state.timer > 0) this.setState({timer:this.state.timer-1000}) }, 1000);

        //I kick off the next step once ten seconds have passed.
        setTimeout(() => {
            //See step 3 below
              this.patchTransactionAfter3DSDataIsSent();
        }, 9000);  
      })
  };

  //Step 3 - Once the 3DS Data has been captured by the iFrame we should really check for a webhook from the ACS which tells us it has successfully collected the data. 
  //         However, to save time for this demo I'm not doing that. I'll just assume all has gone well.
  patchTransactionAfter3DSDataIsSent = () => {
    var raw = JSON.stringify({});
    var requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: raw,
    };

    // Step 4 (see API) 
    fetch("http://localhost:3124/api/v1/payments/" + this.state.transactionId, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log("Step 2. Patched transaction after 3DS data collected from 3DSMethod", data)

        //This endpoint will respond with cReq data which is part of the 3DS flow. cReq is a challenge request -> go to step 5
        this.sendInCreqData(data);
      })
  }

  //Step 5 - Now we have the cReq data we are going to POST this to the ACS
  sendInCreqData = (data) => {
    console.log('Step 3: Redirecting and sending in cReqData to ACS', data);
    let cReq = data.authenticationResponse.params.cReq;

    //The cReq data is send to modirums test ACS. The user will redirected to the ACS after invoking the special post function.
    //The post function creates a form containing the data in the correct format to be accepted by the ACS and be submitted by a browser. 
    //Note that we are submitted a post from a browser...usually this would be a get.
    //The user is now redirected..
    //Go to step 6 on the API
    this.post('https://3ds-acs.test.modirum.com/mdpayacs/creq', {
      creq: cReq, 
    });
  }

  //For step 5.
  post(path, params, method='post') {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    const form = document.createElement('form');
    form.method = method;
    form.action = path;
  
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = key;
        hiddenField.value = params[key];
  
        form.appendChild(hiddenField);
      }
    }
    document.body.appendChild(form);
    form.submit();
  }

  //Step 7 - Look for a query parameter ( the user was redirected by the server, from here we display the result of the transaction.);
  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentComplete = urlParams.get('paymentComplete');
    const status = urlParams.get('status');
    this.setState({paymentComplete:paymentComplete, status });
  }


  //Extra function for seeing the current transaction state.
  getTxState = () => {
    fetch("http://localhost:3124/api/v1/payments/" + this.state.transactionId)
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
        this.setState({transactionState:data.transactionState})
    })
  }

  render() {
    
    //Handle loading screen
    if (this.state.loading) {
      return (
        <Frame>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column'}}>
        <BeatLoader size={150} color={"black"} loading={true} />
        <h2>Loading...</h2>
        </div>
        </Frame>
        )
    }

    //Handle transaction result (Step 7)
    if(this.state.paymentComplete === "true") {
        return (
          <Frame>
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column', height:'100vh'}}>
              <h1>Payment successful</h1>
              <Button varient="contained" color="primary" onClick={() => window.open('http://localhost:3000', '_self')}>Try again</Button>
          </div></Frame>)
        return ( <Frame><div style={{display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column', height:'100vh'}}>
            <h1>Payment failed</h1>
            <Button varient="contained" color="primary" onClick={() => window.open('http://localhost:3000', '_self')}>Try again</Button>
        </div></Frame>)
    }


    //Step 2 - Payment submitted after details are collected. We insert the 3DSMethod iframe and then wait 10 seconds.
    if(this.state.initialPaymentSubmitted) {
        return (
          <Frame>
            <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div className="App" style={{maxWidth:'800px'}}>
                  <header className="App-header" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                    {/* <p>We just hit the /payments endpoint to create a payment. For this example the challengeIndicator is set to 04 in order to force 3DS21. </p>
                    <p>As part of this we also set the termURL. This is the URL that the ACS (Access Control Server) will redirect to one the user completes 3DS.</p>
                    <p>Optional: An iFrame has been inserted into this page with data sent from Fiserv. This iFrame sends data to the ACS and would help with fraud prevention.</p>
                    <p>We're going to wait for 10 seconds to let the ACS deal with the data from the iframe. </p>
                    <p>From sending the transaction to redirecting to the ACS there is a max time limit of 30 seconds before the transaction is voided.</p> */}
                    {!this.state.buttonEnabled && <BeatLoader size={150} color={"black"} loading={true} />}
                    {!this.state.buttonEnabled && <h4>{(Math.floor(this.state.timer/1000)).toFixed(0)} seconds remain</h4>}
                    {this.state.iframeCode.length > 1 && <div dangerouslySetInnerHTML={ {__html:this.state.iframeCode} } />}
                </header>
                </div>
            </div>
          </Frame>
        )
    }


    //Step 1 (Payment credential collection form)
    return (
      <div>
        <Frame>
          <header className="App-header">
            <CardForm>
              <CardInputField type="text" value={this.state.cardNumber} onChange={(e) => this.setState({ cardNumber: e.target.value })} label="Card Number" variant="outlined" />
              <br />
              <Row>
              <SecurityMonthField type="text" value={this.state.expiryMonth} onChange={(e) => this.setState({ expiryMonth: e.target.value })} label="Expiry Month" variant="outlined" />
              <br />
              <SecurityYearField type="text" value={this.state.expiryYear} onChange={(e) => this.setState({ expiryYear: e.target.value })} label="Expiry Year" variant="outlined" />
              </Row>
              <br />
              <SecurityCodeField type="text" value={this.state.securityCode} onChange={(e) => this.setState({ securityCode: e.target.value }) } label="Security Code" variant="outlined" /> </CardForm>
              <br />
              <CustomPayButton variant="contained" color="primary" onClick={() => this.submitPayment()} >Pay</CustomPayButton>
          </header>
        </Frame>

      </div>
    );
  }
}
