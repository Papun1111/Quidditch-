import React from 'react';
import { Link } from 'react-router-dom';
export default function Pricing() {
    return ( <div className='container'>
        <div className="row">
            <div className='col-4'>
                <h1 className='mb-3 fs-2'>Unbeatable pricing</h1>
            <p>we pioneered the concept of discount broking and price transparency in india. Flat fees and no hidden charges</p>
            <Link className="mx-5" style={{textDecoration:"none"}} to="/pricing">See pricing<i class="fa-solid fa-arrow-right"></i></Link>
            </div>
            <div className='col-2'></div>
            <div className='col-6 mb-5'>
                <div className='row text-center'>
                    <div className='col p-4 border'>
<h1 className='mb-3'>$0</h1>
<p>Free equity delivery and <br></br> direct mutual funds</p>
                    </div>
                    <div className='col p-4 border'>
                    <h1>$20</h1>
<p>Intraday amd F&O</p>
                    </div>
                </div>
            </div>
        </div>
    </div> );
}

