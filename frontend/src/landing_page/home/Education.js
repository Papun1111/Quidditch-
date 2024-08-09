import React from "react";
export default function Education() {
  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-6">
          <img style={{width:"70%"}} src="media/education.svg"></img>
        </div>

        <div className="col-6">
          <h1 className="mb-3 fs-2">Free and open market education</h1>
          <p class>
            Varsity,the largest online stock market education book in the worlf
            covering everthing from the basics to advanced trading
          </p>
          <a className="mx-5 " style={{ textDecoration: "none" }} href="">
            Versity<i class="fa-solid fa-arrow-right"></i>
          </a>
          <p className="mt-5">
            TradingQ&, the most active trading and investment community in India
            for all your market related queries
          </p>
          <a className="mx-5" style={{ textDecoration: "none" }} href="">
            TradingQ&A<i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
