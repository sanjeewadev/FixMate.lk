import React from "react";
import imesh from "../../assets/TeamMembers/imesh.jpg"
import vihas from "../../assets/TeamMembers/vihas.jpg"
import tharindu from "../../assets/TeamMembers/tharindu.jpg"
import "./TeamCards.css";


const teamMembers = [
  {
    name: "Imesh Fernando",
    title: "CEO",
    image: imesh,
  },
  {
    name: "Vihas Perera",
    title: "CTO",
    image: vihas,
  },
  {
    name: "Tharindu Gamage",
    title: "Head of Operations",
    image: tharindu,
  },
];

const TeamCards = () => {
  return (
    <div className="team-container">
      {teamMembers.map((member, index) => (
        <div key={index} className="team-card">
          <img src={member.image} alt={member.name} />
          <h3>{member.name}</h3>
          <p>{member.title}</p>
        </div>
      ))}
    </div>
  );
};

export default TeamCards;
