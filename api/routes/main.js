//These libraries are for the running of this API.
const express = require("express");
const router = express.Router();
var request = require("request");
var CryptoJS = require("crypto-js");
const {v4: uuidv4} = require("uuid");

//These are the API keys and token for generating an encrypted message
const key = "API Key goes hre";
const secret = "Secret goes here";
const url = "https://prod.emea.api.fiservapps.com/sandbox/ipp/payments-gateway/v2/payments/"

//When ever you communicate with IPG you need to encrypt the body of the message. This function modifies the API call to include the correct message signatures. 
function fiservEncode(method, url, body, callback) {
  var ClientRequestId = uuidv4();
  var time = new Date().getTime();
  var requestBody = JSON.stringify(body);
  if(method === 'GET') {
    requestBody = '';
  }  
  var rawSignature = key + ClientRequestId + time + requestBody;
  var computedHash = CryptoJS.algo.HMAC.create(
    CryptoJS.algo.SHA256,
    secret.toString()
  );
  computedHash.update(rawSignature);
  computedHash = computedHash.finalize();
  var computedHmac = CryptoJS.enc.Base64.stringify(computedHash);

  var options = {
    method: method,
    url,
    headers: {
      "Content-Type": "application/json",
      "Client-Request-Id": ClientRequestId,
      "Api-Key": key,
      Timestamp: time,
      "Message-Signature": computedHmac
    },
    body: JSON.stringify(body),
  };

  request(options, function (error, response) {
    if (error) throw new Error(error);
    callback(options);
  });
}

//Step 2: Create Primary Transaction (Only performs a standard payment that requests 3DSecure!)
router.post("/payments", async (req, res) => {
  //Start by encoding the message.
  fiservEncode(
    "POST",
    url,
    {
      requestType: "PaymentCardSaleTransaction",
      transactionAmount: { total: "13", currency: "GBP" },
      paymentMethod: {
        paymentCard: {
          number: req.body.cardNumber,
          securityCode: req.body.securityCode,
          expiryDate: { month: req.body.expiryMonth, year: req.body.expiryYear },
        },
      },
      authenticationRequest: {
        authenticationType: "Secure3D21AuthenticationRequest",
        termURL: "http://localhost:3124/api/v1/payments/3ds",
        challengeIndicator: "04", // This indicates what type of transaction we would like. 
      },
    },
    (options) => {
      //Submit the API call to Fiserv
      request(options, function (error, paymentResponse) {
        if (error) throw new Error(error);
        let paymentData = JSON.parse(paymentResponse.body);
        return res.status(200).json({
          requestName: "Payment POST - Creating the payment request",
          ...paymentData
        });
      });
    }
  );
});


//Step 4: When submitting a payment that will go via 3DSecure you can supplement the request with additional data that will be used by he issuer. 
//        One way to do this is to insert an iFrame into the web page. The code is sent in the previous request. 
//        We then patch the transaction to tell it that 3DS Method has collected the data.
router.patch("/payments/:transactionId", async (req, res) => {
  fiservEncode(
    "PATCH",
    url + req.params.transactionId,
    {
      authenticationType: "Secure3D21AuthenticationUpdateRequest",
      methodNotificationStatus: "RECEIVED" // This is what we update
    },
    (options) => {
      //Reminder, it's not seeing the request Type
      request(options, function (error, paymentResponse) {
        if (error) throw new Error(error);
        let paymentData = JSON.parse(paymentResponse.body);
        return res.status(200).json({
          requestName: "Payment PATCH - Updating to notify that 3DSData has been received by the 3DSMethod",
          ...paymentData,
        });
      });
    }
  );
});

//Step 6: Send in the cRes data (for 3DSecure)
//The ACS will redirect the user to this endpoint. The endpoint collects the cRes and updates the transacton with the cRes data. 
//The response includes the result of the transaction.
//We then redirect the user back to the website and show them the result of the transaction.
//Go to step 7 on the UI
router.post("/payments/3ds", async (req, res) => {
  fiservEncode(
    "PATCH",
    url + req.query.referencedTransactionId,
    { authenticationType: "Secure3D21AuthenticationUpdateRequest", acsResponse: { cRes:req.body.cres }, },
    (options) => {
      request(options, function (error, paymentResponse) {
        if (error) throw new Error(error);
        let paymentData = JSON.parse(paymentResponse.body);
        res.redirect(`http://localhost:3000?paymentComplete=true&status=${paymentData.transactionStatus}`);
      });
    }
  );
});

//Extra function: Get transaction status, this endpoint just retrieves data from Fiserv
router.get("/payments/:transactionId", async (req, res) => {
  fiservEncode(
    "GET",
    url + req.params.transactionId,
    {},
    (options) => {
      request(options, function (error, paymentResponse) {
        if (error) throw new Error(error);
        let paymentData = JSON.parse(paymentResponse.body);
        return res.status(200).json({
          requestName: "Payment GET - Getting the data on the transaction",
          ...paymentData
        });
      });
    }
  );
});







module.exports = router;
