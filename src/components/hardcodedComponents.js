import React from "react";
import gh from "../img/gh.png"
import twitter from "../img/twitter.png"
import styled from "styled-components"
import rotateDevice from "../img/rotate-device.png"
import { IntroText } from "./styledComponents"

const Intro = () => (
    <IntroText>
      <p>
        How many COVID-19 tests have U.S. states and territories administered?
        These answers are surprisingly hard to find, as the CDC does not
        currently report the number of people tested or test results.
      </p>
      <p>
        These data are sourced from state public health authorities
        by <a href="https://covidtracking.com/">The COVID Tracking Project</a>.
        The site notes that <a href="https://covidtracking.com/about-tracker/">
        not all states report numbers consistently</a>.
      </p>
      <p>
        Because there are so many missing data, especially from states early in
        the outbreak, I am casting <code>null</code> values to 0 here.
      </p>
    </IntroText>
)

const Header = () => (
    <header className="App-header">
      <h1>COVID-19 Testing Progress</h1>
      <p>U.S. States and Territories</p>
      <span>
        <a href="https://github.com/kairstenfay/us-covid-19-testing">
          <img className="logo" id="gh" src={gh} alt="GitHub" /> GitHub
        </a>
        <a href="https://twitter.com/databae_">
          <img className="logo" id="twitter" src={twitter} alt="Twitter" /> Twitter
        </a>
      </span>
    </header>
)

const RotateDevice = () => (
  <p id="rotate-device">
    Please rotate your device
    <img src={rotateDevice} alt="rotate mobile device" />
  </p>
)

export { Intro, Header, RotateDevice }
