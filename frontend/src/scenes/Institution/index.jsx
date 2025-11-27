/*
Filename: index.jsx
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 20, 2025

The goal of this page is to allow a user to search for researchers based on 
a name, expertise, or institution. 

*/

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Box } from "@mui/material";

import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useParams } from 'react-router-dom';
import {
  GraduationCap,
  School,
  Hospital,
  FlaskConical,
  HeartHandshake,
  Building,
  Stethoscope,
} from "lucide-react";

// todo: there maybe a better way of mapping icons
export const institutionIconMap = {
  "University": GraduationCap,
  "Academic": GraduationCap,
  "Domestic Higher Education": GraduationCap,
  "UNIVERSITY-WIDE": GraduationCap,
  "SCHOOLS OF OSTEOPATHIC MEDICINE": Stethoscope,
  "Hospital": Hospital,
  "Independent Hospitals": Hospital,
  "Research Institute": FlaskConical,
  "Research Institutes": FlaskConical,
  "Non-Profit Organization": HeartHandshake,
  "Other Domestic Non-Profits": HeartHandshake,
  "Domestic For-Profits": Building,
  "Default": School,
};

const Institution = () => {
const theme = useTheme();
const colors = tokens(theme.palette.mode);
const { institutionId } = useParams(); 
const [institutionData, setInstitution] = useState();

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/institution/one/${institutionId}`)
      .then((response) => {
        setInstitution(response.data.data);
        console.log(response.data.data)
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);


  const Icon = institutionIconMap['University'] || institutionIconMap["Default"];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.primary[500],
      }}
    >
        <Box m="20px 20px 0px 20px">
        <Header
          title="Institution"
          subtitle={"View more information about " + institutionData?.institution_name ?? '?'}
        />
      </Box>

 <Icon className="w-5 h-5 text-gray-700" />
{institutionData &&
  Object.entries(institutionData).map(([departmentName, people]) => (
    <div key={departmentName}>
      <h2>{departmentName}</h2>

      {Object.entries(people).map(([personName, person]) => (
        <div key={person.person_id}>
          <h3>{person.person_name}</h3>
          <p>Email: {person.person_email}</p>
          <p>Phone: {person.person_phone}</p>
          <p>Main Field: {person.main_field}</p>

          <p>
            Expertise:{" "}
            {[person.expertise_1, person.expertise_2, person.expertise_3]
              .filter(Boolean)
              .join(", ")}
          </p>

          {person.bio && (
            <details>
              <summary>Bio</summary>
              <p>{person.bio}</p>
            </details>
          )}
        </div>
      ))}
    </div>
  ))}    </div>
  );
};

export default Institution;