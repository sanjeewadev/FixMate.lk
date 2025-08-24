import React from "react";
import imesh from "../../assets/TeamMembers/imesh.jpg";
import vihas from "../../assets/TeamMembers/vihas.jpg";
import tharindu from "../../assets/TeamMembers/tharindu.jpg";
import "./TeamCards.css";

const teamMembers = [
  { name: "Imesh Fernando", title: "CEO", image: imesh },
  { name: "Vihas Perera", title: "CTO", image: vihas },
  { name: "Tharindu Gamage", title: "Head of Operations", image: tharindu },
];

export default function TeamCards() {
  return (
    <section className="team-section" aria-labelledby="team-heading">
      <div className="team-inner">
        <h2 id="team-heading" className="team-heading">
          Meet the Team
        </h2>

        <div className="team-container">
          {teamMembers.map((member, i) => (
            <article key={i} className="team-card" tabIndex={0}>
              <div className="avatar-wrap" aria-hidden="true">
                <span className="avatar-ring">
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.title}`}
                    className="avatar-img"
                    loading="lazy"
                  />
                </span>
              </div>

              <h3 className="member-name">{member.name}</h3>
              <p className="member-title">{member.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}