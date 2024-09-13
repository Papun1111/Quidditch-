import React from "react";
export default function LeftSection({
  imageURL,
  productName,
  productDesription,
  tryDemo,
  learnMore,
  googlePlay,
  appStore,
}) {
  return (
    <div className="container mt-5">
      <div className="row align-items-center">
        {/* Image Column */}
        <div className="col-12 col-md-6 text-center mb-4 mb-md-0">
          <img
            src={imageURL}
            className="img-fluid"
            alt="Product"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
       
        {/* Text Column */}
        <div className="col-12 col-md-6 p-5 mt-md-0 text-center text-md-left">
          <h1>{productName}</h1>
          <p>{productDesription}</p>
          <div className="d-flex justify-content-center justify-content-md-start">
            <a href={tryDemo} className="btn btn-primary">
              Try Demo <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
            </a>
            <a href={learnMore} className="btn btn-secondary ml-3">
              Learn More <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
          <div className="mt-3 d-flex justify-content-center justify-content-md-start">
            <a href={googlePlay}>
              <img
                src="media/googlePlayBadge.svg"
                className="img-fluid"
                alt="Google Play"
                style={{ maxWidth: "150px" }}
              />
            </a>
            <a href={appStore} className="ml-3">
              <img
                src="media/appstoreBadge.svg"
                className="img-fluid"
                alt="App Store"
                style={{ maxWidth: "150px" }}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
