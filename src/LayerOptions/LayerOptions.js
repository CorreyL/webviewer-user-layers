import React, { useEffect, useState } from 'react';

import './LayerOptions.css';

const LayerOptions = (props) => {
  const {
    setCurrentRole,
  } = props;

  const userRoles = [
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  useEffect(() => {
    setCurrentRole(userRoles[0]);
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
    </div>
  );
};

export default LayerOptions;
