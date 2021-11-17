import React, { useEffect, useState } from 'react';

import './LayerOptions.css';

const LayerOptions = (props) => {
  const {
    annotationsLoaded,
    annotationsToSee,
    consolidateAnnotations,
    currentRole,
    setAnnotationsToSee,
    setCurrentRole,
  } = props;

  const userRoles = [
    'Responsible',
    'Mechanical',
    'Civil',
    'Electrical'
  ];

  useEffect(() => {
    setCurrentRole(userRoles[0]);
    setAnnotationsToSee(userRoles);
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
      <div>
        {
          userRoles.map(role => (
            <div key={`see-annotations-for-${role}`}>
              <input
                type="checkbox"
                id={role}
                name="seeAnnotations"
                disabled={!annotationsLoaded}
                value={role}
                checked={annotationsToSee.length && annotationsToSee.includes(role)}
                onChange={(event) => {
                  event.persist();
                  const { checked, value } = event.target;
                  if (checked) {
                    setAnnotationsToSee((annotationsToSee) => [...annotationsToSee, value]);
                  } else {
                    setAnnotationsToSee((annotationsToSee) => annotationsToSee.filter(role => role !== value));
                  }
                }}
              />
              <label htmlFor={role}>{role}</label>
            </div>
          ))
        }
      </div>
      <button
        onClick={consolidateAnnotations}
        disabled={currentRole !== 'Responsible'}
      >
        Consolidate All Unhidden Annotations
      </button>
    </div>
  );
};

export default LayerOptions;
