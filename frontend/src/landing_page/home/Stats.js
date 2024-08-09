import React from "react";
export default function Stats() {
  return (
    <div className="container p-3">
      <div className="row p-5">
        <div className="col-6 p-5">
          <h1 className="fs-2 mb-5">Trust with confidence</h1>
          <h2 className="fs-4">Customer-first always</h2>
          <p className="text-muted">
            That's why 1.3+ crore customers trust Zerodha with $3.5 hundred
            thousands worth of equity investments.
          </p>
          <h2 className="fs-4">No spam of gimmiks</h2>
          <p className="text-muted">
            No gimmick,spam,"gamification",or annoying push notifications.High
            quality apps that you use at your pace,the way you like
          </p>
          <h2 className="fs-4">The Zerodha universe</h2>
          <p className="text-muted">
            Not just an app,but a whole ecosystem.Our investements in 30+
            fintech startups offer you tailored services specific to your needs
          </p>
          <h2 className="fs-4">Do better with money</h2>
          <p className="text-muted">
            With initiatives like Nudge and Kill Switch,we don't just facilitate
            transactions,but aactively help you do better with your money
          </p>
        </div>
        <div className="col-6 p-5">
          <img src="media/ecosystem.png" style={{ width: "90%" }}></img>
        <div className="text-center mb-5">
            <a className="mx-5" style={{textDecoration:"none"}} href="">Explore<i class="fa-solid fa-arrow-right"></i></a>
            <a style={{textDecoration:"none"}} href="">Try Kite demo<i class="fa-solid fa-arrow-right"></i></a>
        </div>
        </div>
      </div>
    </div>
  );
}
