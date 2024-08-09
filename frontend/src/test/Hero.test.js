import React from 'react';
import {render,screen} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Hero from '../landing_page/home/Hero';

describe('Hero component',()=>{
    test('renders hero image',()=>{
        render(<Hero></Hero>);
        const heroImage=screen.getByAltText("Hero Image");
        expect(heroImage).toBeInTheDocument();
        expect(heroImage).toHaveAttribute('src','media/homeHero.png');
    })
});