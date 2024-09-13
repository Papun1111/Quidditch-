import React from "react";
export default function Hero() {
  return (
    <div className="container p-3 p-md-5 mb-5">
      <div className="row text-center">
        <div className="col-12">
          <img
            className="img-fluid mb-4"
            src="media/homeHero.png"
            alt="Hero Image"
            style={{ maxWidth: "100%" }}
          />
        </div>
        <div className="col-12">
          <h1 className="mt-4">Invest in Everything</h1>
          <p className="mt-3">
            Online platform to invest in stocks, derivatives, mutual funds, and more.
          </p>
          <button
            className="btn btn-primary fs-5 mt-4 mb-5"
            style={{ width: "100%", maxWidth: "300px" }}
          >
            Signup Now
          </button>
        </div>
      </div>
    </div>
  );
}
