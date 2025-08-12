import React from 'react';

export default function TeamNameInputs({ blueTeamName, setBlueTeamName, redTeamName, setRedTeamName }) {
  return (
    <>
      <input
        id="blue-team-name"
        type="text"
        value={blueTeamName}
        onChange={e => setBlueTeamName(e.target.value)}
        placeholder="Team Blue"
        className="px-3 py-1 rounded bg-blue-700 text-white font-bold text-lg text-left mb-2 pl-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400"
        maxLength={20}
        style={{ zIndex: 2, position: 'relative' }}
      />
    </>
  );
} 