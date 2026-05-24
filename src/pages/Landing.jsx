import React from 'react'
import HeroBanner from '../components/Landing-comp/HeroBanner'
import StatsBanner from '../components/Landing-comp/StatsBanner'
import PaymentApps from '../components/Landing-comp/PaymentApps'
import AgentWorkspace from '../components/Landing-comp/AgentWorkspace'
import MissionVision from '../components/Landing-comp/MissionVision'
import WhyPasalManager from '../components/Landing-comp/WhyPasalManager'
import HowItWorks from '../components/Landing-comp/HowItWorks'
// import Testimonials from '../components/Landing-comp/Testimonials' // Hidden — re-enable later when real reviews available
import FAQ from '../components/Landing-comp/FAQ'
import Footer from '../components/Landing-comp/Footer'
import Header from '../components/Landing-comp/Header'

function Landing() {
  return (
    <div>
        <Header/>
        <HeroBanner/>
        <StatsBanner/>
        <PaymentApps/>
        <MissionVision/>
        <WhyPasalManager/>
        <AgentWorkspace/>
        <HowItWorks/>
        {/* <Testimonials/> Hidden for now — re-enable when real reviews available */}
        <FAQ/>
        <Footer/>
    </div>
  )
}

export default Landing
