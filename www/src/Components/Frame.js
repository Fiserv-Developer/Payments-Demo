import React, { Component } from 'react';
import './Frame.css';

export default class Frame extends Component {
    render() {
        return (
            <div className='frame'>
                    <div className='column1'>
                        <h1>FPV Drone</h1>
                        <img className="image" alt="A FPV Drone" src={('./drone.jpeg')}></img>
                        <h2>£250.00</h2>
                    </div>
                    <div className='column2'>
                    {this.props.children}
                    </div>
            </div>
        )
    }
}
