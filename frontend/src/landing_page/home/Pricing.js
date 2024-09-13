import React from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
    return (
        <div className='container mt-5'>
            <div className="row">
                <div className='col-12 col-md-4 mb-4 mb-md-0'>
                    <h1 className='mb-3 fs-2'>Unbeatable pricing</h1>
                    <p>We pioneered the concept of discount broking and price transparency in India. Flat fees and no hidden charges.</p>
                    <Link className="mx-0 mx-md-5" style={{ textDecoration: "none" }} to="/pricing">
                        See pricing <i className="fa-solid fa-arrow-right ms-2"></i>
                    </Link>
                </div>
                <div className='col-12 col-md-2'></div>
                <div className='col-12 col-md-6 mb-5'>
                    <div className='row text-center'>
                        <div className='col-12 col-md-6 p-4 border mb-4 mb-md-0'>
                            <h1 className='mb-3'>$0</h1>
                            <p>Free equity delivery and <br /> direct mutual funds</p>
                        </div>
                        <div className='col-12 col-md-6 p-4 border'>
                            <h1>$20</h1>
                            <p>Intraday and F&O</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
