import React from 'react';
import Brokerage from './Brokerage';
import Hero from './Hero';
import OpenAccount from "../OpenAccount";
export default function PricingPage() {
    return ( 
       <div>
        <Hero></Hero>
        <OpenAccount></OpenAccount>
        <Brokerage></Brokerage>
        </div>
     );
}

