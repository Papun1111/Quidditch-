import React from 'react';

export default function Universe() {
  return (
    <div className="container mt-5">
      <div className="row text-center">
        <h1>The Zerodha Universe</h1>
        <p>
          Extend your trading and investment experience even further with our
          partner platforms
        </p>
        {/* Using Bootstrap's grid system for responsive columns */}
        <div className="col-lg-4 col-md-6 col-12 p-4 mt-5">
          <img src="media/smallcaseLogo.png" className="img-fluid" alt="Smallcase Logo" />
          <p className="text-small text-muted">Thematic investment platform</p>
        </div>
        <div className="col-lg-4 col-md-6 col-12 p-4 mt-5">
          <img src="media/streakLogo.png" className="img-fluid" alt="Streak Logo" />
          <p className="text-small text-muted">Algo & strategy platform</p>
        </div>
        <div className="col-lg-4 col-md-6 col-12 p-4 mt-5">
          <img src="media/sensibullLogo.svg" className="img-fluid" alt="Sensibull Logo" />
          <p className="text-small text-muted">Options trading platform</p>
        </div>
        <div className="col-lg-4 col-md-6 col-12 p-4 mt-5">
          <img src="media/zerodhaFundhouse.png" className="img-fluid" alt="Zerodha Fundhouse Logo" />
          <p className="text-small text-muted">Asset management</p>
        </div>
        <div className="col-lg-4 col-md-6 col-12 p-4 mt-5">
          <img src="media/goldenpiLogo.png" className="img-fluid" alt="GoldenPi Logo" />
          <p className="text-small text-muted">Bonds trading platform</p>
        </div>
        <div className="col-lg-4 col-md-6 col-12 p-4 mt-5">
          <img src="media/dittoLogo.png" className="img-fluid" alt="Ditto Logo" />
          <p className="text-small text-muted">Insurance</p>
        </div>
        {/* Button centered using Bootstrap classes */}
        <div className="col-12">
          <button className="btn btn-primary fs-5 mb-5" style={{ width: '20%' }}>
            Signup Now
          </button>
        </div>
      </div>
    </div>
  );
}
