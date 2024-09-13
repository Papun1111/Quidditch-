import React from "react";
export default function Education() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12 col-md-6 text-center text-md-start mb-4 mb-md-0">
          <img className="img-fluid" style={{ width: "70%" }} src="media/education.svg" alt="Education" />
        </div>

        <div className="col-12 col-md-6">
          <h1 className="mb-3 fs-2">Free and open market education</h1>
          <p>
            Varsity, the largest online stock market education book in the world covering everything from the basics to advanced trading.
          </p>
          <a className="mx-0 mx-md-5" style={{ textDecoration: "none" }} href="">
            Varsity<i className="fa-solid fa-arrow-right ms-2"></i>
          </a>
          <p className="mt-5">
            TradingQ&A, the most active trading and investment community in India for all your market-related queries.
          </p>
          <a className="mx-0 mx-md-5" style={{ textDecoration: "none" }} href="">
            TradingQ&A<i className="fa-solid fa-arrow-right ms-2"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
