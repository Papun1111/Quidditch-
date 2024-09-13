import React from "react";

export default function Hero() {
  return (
    <div className="container">
      <div className="row p-3 p-md-5 mt-3 mt-md-5 border-bottom text-center">
        <h1 className="fs-4 fs-md-3">Pricing</h1>
        <h3 className="text-muted mt-2 mt-md-3 fs-6 fs-md-5">
          Free equity investments and flat ₹20 intraday and F&O trades
        </h3>
      </div>
      <div className="row p-3 p-md-5 mt-3 mt-md-5 text-center">
        <div className="col-12 col-md-4 p-3 p-md-4">
          <img
            src="media/pricingEquity.svg"
            className="img-fluid mb-3"
            alt="Equity Delivery"
          />
          <h1 className="fs-5 fs-md-3">Free equity delivery</h1>
          <p className="text-muted fs-6 fs-md-5">
            All equity delivery investments (NSE, BSE), are absolutely free — ₹0
            brokerage.
          </p>
        </div>
        <div className="col-12 col-md-4 p-3 p-md-4">
          <img
            src="media/intradayTrades.svg"
            className="img-fluid mb-3"
            alt="Intraday Trades"
          />
          <h1 className="fs-5 fs-md-3">Intraday and F&O trades</h1>
          <p className="text-muted fs-6 fs-md-5">
            Flat ₹20 or 0.03% (whichever is lower) per executed order on
            intraday trades across equity, currency, and commodity trades.
          </p>
        </div>
        <div className="col-12 col-md-4 p-3 p-md-4">
          <img
            src="media/pricingEquity.svg"
            className="img-fluid mb-3"
            alt="Direct Mutual Funds"
          />
          <h1 className="fs-5 fs-md-3">Free direct MF</h1>
          <p className="text-muted fs-6 fs-md-5">
            All direct mutual fund investments are absolutely free — ₹0
            commissions & DP charges.
          </p>
        </div>
      </div>
    </div>
  );
}
