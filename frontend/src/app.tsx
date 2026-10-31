import { Routes, Route } from "react-router-dom";
import SiteLayout from "@/components/site/Layout";
import Home from "@/pages/Home";
import About, { WhyUsPage } from "@/pages/About";
import Services from "@/pages/Services";
import ServiceDetail, { ServicePage } from "@/pages/ServiceDetail";
import Contact from "@/pages/Contact";
import Quote, { Track } from "@/pages/Quote";
import Legal from "@/pages/Legal";
import Login, { ForgotPassword, Register, ResetPassword } from "@/pages/Auth";
import Portal from "@/pages/Portal";
import Admin from "@/pages/Admin";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/port-clearance" element={<ServicePage key="pc" slug="port-clearance" />} />
        <Route path="/hold-cleaning" element={<ServicePage key="hc" slug="hold-cleaning" />} />
        <Route path="/why-us" element={<WhyUsPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/quote" element={<Quote />} />
        <Route path="/track" element={<Track />} />
        <Route path="/privacy-policy" element={<Legal kind="privacy" />} />
        <Route path="/terms" element={<Legal kind="terms" />} />
        <Route path="*" element={<Home />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/portal" element={<Portal />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
