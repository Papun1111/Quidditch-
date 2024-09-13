import React from "react";

export default function Team() {
  return (
    <div className="container">
      <div className="row p-3 p-md-5 mt-3 mt-md-5">
        <h1 className="text-center mt-4 mt-md-5 border-top">People</h1>
      </div>
      <div className="row p-3 p-md-5 mt-3 mt-md-5 text-muted">
        <div className="col-12 col-md-6 p-3 p-md-5 fs-6 text-center">
          <img
            style={{ borderRadius: "100%", width: "50%" }}
            src="/media/Ceo.jpg"
            alt="Papun Mohapatra"
            className="img-fluid"
          />
          <h4 className="mt-4 mt-md-5">Papun Mohapatra</h4>
          <h6>Founder, CEO</h6>
        </div>
        <div className="col-12 col-md-6 p-3 p-md-3">
          <p>
            Papun bootstrapped and founded Zerodha in 2010 to overcome the
            hurdles he faced during his decade-long stint as a trader. Today,
            Zerodha has changed the landscape of the Indian broking industry.
          </p>
          <p>
            He is a student at Siksha O Anusandhan, passionate about Web
            Development and Blockchain.
          </p>
          <p>Playing basketball is his zen.</p>
          <p>
            Connect on <a href="#">Homepage</a> / <a href="#">TradingQnA</a> /{" "}
            <a href="#">Twitter</a>
          </p>
        </div>
      </div>
    </div>
  );
}
