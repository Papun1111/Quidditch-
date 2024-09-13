import React from 'react';

export default function Hero() {
  return (
    <div className="container border-bottom mb-5">
      <div className="row text-center mt-3 mt-md-5 p-3 p-md-5">
        <h1 className="fs-3 fs-md-1">Technology</h1>
        <h3 className="text-muted mt-2 mt-md-3 fs-5 fs-md-4">
          Sleek, modern and intuitive trading platforms
        </h3>
        <p className="mt-3 mb-3 mb-md-5">
          Check out our{' '}
          <a href="#" style={{ textDecoration: 'none' }}>
            investment offerings{' '}
            <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
          </a>
        </p>
      </div>
    </div>
  );
}
