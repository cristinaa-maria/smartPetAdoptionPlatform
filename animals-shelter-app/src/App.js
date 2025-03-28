import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './components/home'
import Login from './components/login'
import Catalog from './components/catalog'
import './components/styles/App.css'
import { useEffect, useState } from 'react'
import Signup from "./components/signup";
import Homepage from "./components/home";
import AdoptionPage from "./components/adoption"
import AdoptionInfo from "./components/info";
import EditorCatalog from "./components/editor_catalog"
import SignUpPage from "./components/signup";
import AdoptionBooking from "./components/book-adoption";
import FindVetClinics from "./components/find-clinics";
import PostUpdates from "./components/community";
import ShelterMap from "./components/map";
import DistantAdoptionPage from "./components/distantAdoption";
import DonationPage from "./components/donationPage";
import FosteringBooking from "./components/fostering";


function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')

  return (
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route
                path="/"
                element={<Login email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
            />
            <Route path="/login" element={<Login setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
              <Route path="/signup" element={<SignUpPage setLoggedIn={setLoggedIn} setUsername={setUsername} setEmail={setEmail} />} />
              <Route path="/catalog" element={<Catalog></Catalog>} />
              <Route path="/home" element={<Homepage></Homepage>} />
            <Route path="/adoption" element={<AdoptionPage></AdoptionPage>} />
            <Route path="/info" element={<AdoptionInfo></AdoptionInfo>} />
            <Route path="/editor_catalog" element={<EditorCatalog></EditorCatalog>} />
            <Route path="/book-adoption" element={<AdoptionBooking></AdoptionBooking>} />
            <Route path="/find-clinics" element={<FindVetClinics></FindVetClinics>} />
            <Route path="/community" element={<PostUpdates></PostUpdates>} />
            <Route path="/map" element={<ShelterMap></ShelterMap>} />
            <Route path="/distantAdoption" element={<DistantAdoptionPage></DistantAdoptionPage>} />
            <Route path="/donationPage" element={<DonationPage></DonationPage>} />
            <Route path="/fostering" element={<FosteringBooking></FosteringBooking>} />
          </Routes>
        </BrowserRouter>
      </div>
  )
}

export default App