import React from "react";

export default function Hero() {
  return (
    <section className="container-fluid" id="supportHero">
      <div className="p-5 text-center text-md-left" id="supportWrapper">
        <h4>Support Portal</h4>
        <a href="">Track Tickets</a>
      </div>

      <div className="row p-5 m-3">
        {/* Left Column */}
        <div className="col-12 col-md-6 p-3">
          <h1 className="fs-3">
            Search for an answer or browse help topics to create a ticket
          </h1>
          <input
            className="form-control mt-3"
            placeholder="Eg. how do I activate F&O"
          />
          <div className="mt-3">
            <a href="" className="d-block">Track account opening</a>
            <a href="" className="d-block mt-2">Track segment activation</a>
            <a href="" className="d-block mt-2">Intraday margins</a>
            <a href="" className="d-block mt-2">Kite user manual</a>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-12 col-md-6 p-3">
          <h1 className="fs-3">Featured</h1>
          <ol className="mt-3">
            <li>
              <a href="">Current Takeovers and Delisting - January 2024</a>
            </li>
            <li className="mt-2">
              <a href="">Latest Intraday leverages - MIS & CO</a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
