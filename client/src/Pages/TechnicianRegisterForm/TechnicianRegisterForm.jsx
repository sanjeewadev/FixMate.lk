import React from "react";

import Navbar from "../../Components/Navbar/Navbar.jsx";
import Footer from "../../Components/Footer/footer.jsx";
import CommonHero from "../../Components/CommonHero/CommonHero.jsx";
import TechnicianRegister from "./Components/TechnicianRegister/TechnicianRegister.jsx";

import "./TechnicianRegisterForm.css";

export default function TechnicianRegisterForm() {
  return (
    <div className="fm-tech-page">
      <Navbar />

      <CommonHero
        id="hero"
        eyebrow="Technician Application"
        title="Join FixMate as a verified"
        highlight="technician."
        subtitle="Apply to receive service opportunities from customers looking for reliable electrical, plumbing, AC, cleaning, repair and maintenance support."
        badges={[
          "Work Opportunities",
          "Verified Profile",
          "Customer Requests",
          "Sri Lanka Service Areas",
        ]}
        stats={[
          { value: "01", label: "Submit application" },
          { value: "02", label: "Profile review" },
          { value: "03", label: "Start receiving jobs" },
        ]}
      />

      <main className="fm-tech-page__main">
        <section className="fm-tech-page__container">
          <aside className="fm-tech-page__infoPanel">
            <span className="fm-tech-page__eyebrow">
              Become a FixMate partner
            </span>

            <h2>Grow your service work with a cleaner booking platform.</h2>

            <p>
              Submit your technician profile and service details. The FixMate
              team will review your application and contact you before approval.
            </p>

            <div className="fm-tech-page__infoGrid">
              <div className="fm-tech-page__infoCard">
                <strong>Verified profile</strong>
                <span>
                  Build trust with customers through a reviewed technician
                  profile.
                </span>
              </div>

              <div className="fm-tech-page__infoCard">
                <strong>Service requests</strong>
                <span>
                  Receive customer requests based on your location and skills.
                </span>
              </div>

              <div className="fm-tech-page__infoCard">
                <strong>Organized jobs</strong>
                <span>
                  Keep service details, updates and customer information easier
                  to manage.
                </span>
              </div>
            </div>

            <div className="fm-tech-page__reviewBox">
              <strong>Before submitting</strong>

              <ul>
                <li>Use your real full name and contact number.</li>
                <li>Choose your strongest specialization.</li>
                <li>Add a clear profile photo if available.</li>
                <li>Write a short note about your experience.</li>
              </ul>
            </div>
          </aside>

          <div className="fm-tech-page__formPanel">
            <TechnicianRegister />
          </div>
        </section>
      </main>

      <Footer variant="dark" />
    </div>
  );
}
