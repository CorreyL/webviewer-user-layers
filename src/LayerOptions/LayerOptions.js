import React, { useEffect, useState } from 'react';

import './LayerOptions.css';

const LayerOptions = (props) => {
  const allRoles = 'allRoles';
  const {
    setAnnotationsToSee,
    setCurrentRole,
  } = props;

  const userRoles = [
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  useEffect(() => {
    setCurrentRole(userRoles[0]);
    setAnnotationsToSee(allRoles);
  }, []);

  return (
    <div>
      <label htmlFor="role">The Current User's Role Is</label>
      <select
        name="role"
        id="role"
        onChange={(event) => {
          setCurrentRole(event.target.value);
        }}
      >
        {
          userRoles.map(role => (
            <option
              value={role}
              key={`userRoleOption_${role}`}
            >
              {role}
            </option>
          ))
        }
      </select>
      <h2>See Annotations For</h2>
      <div
        onChange={(event => {
          setAnnotationsToSee(event.target.value);
        })}
      >
        <input type="radio" id="allRoles" name="seeAnnotations" value={allRoles} defaultChecked/>
        <label htmlFor="allRoles">All Roles</label>
        {
          userRoles.map(role => (
            <div key={`see-annotations-for-${role}`}>
              <input type="radio" id={role} name="seeAnnotations" value={role}/>
              <label htmlFor={role}>{role}</label>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default LayerOptions;
