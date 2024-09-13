import React from "react";
export default function Awards() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12 col-md-6 p-3 p-md-5">
          <img
            src="media/largestBroker.svg"
            alt="LargestBRoker"
            className="img-fluid"
          />
        </div>
        <div className="col-12 col-md-6 p-3 p-md-5 mt-3 mt-md-0">
          <h1>Largest Broker in the Country</h1>
          <p className="mb-4">
            2+ million Zerodha clients contribute to over 15% of all volumes in
            India daily by trading and investing in:
          </p>
          <div className="row">
            <div className="col-6">
              <ul>
                <li>
                  <p>Futures and Options</p>
                </li>
                <li>
                  <p>Commodity derivatives</p>
                </li>
                <li>
                  <p>Currency derivatives</p>
                </li>
              </ul>
            </div>
            <div className="col-6">
              <ul>
                <li>
                  <p>Stocks & IPOs</p>
                </li>
                <li>
                  <p>Direct mutual funds</p>
                </li>
                <li>
                  <p>Bonds and Government securities</p>
                </li>
              </ul>
            </div>
          </div>
          <img
            src="media/pressLogos.png"
            className="img-fluid mt-4"
            style={{ width: "90%" }}
            alt="Press Logos"
          />
        </div>
      </div>
    </div>
  );
}
