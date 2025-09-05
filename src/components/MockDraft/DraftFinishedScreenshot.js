import React from 'react';

const DraftFinishedScreenshot = ({ 
  blueTeamName, 
  redTeamName, 
  picks, 
  bans, 
  heroList 
}) => {
  const getHeroData = (heroName) => {
    if (!heroName) return null;
    return heroList.find(hero => hero.name === heroName);
  };

  const getHeroImageUrl = (heroName) => {
    const hero = getHeroData(heroName);
    if (!hero) return null;
    return `${process.env.REACT_APP_API_URL || 'https://api.coachdatastatistics.site'}/api/hero-image/${hero.role?.trim().toLowerCase()}/${encodeURIComponent(hero.image)}`;
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'exp': 'EXPLANER',
      'jungle': 'JUNGLER', 
      'mid': 'MIDLANER',
      'gold': 'GOLDLANER',
      'roam': 'ROAMER'
    };
    return roleMap[role] || role.toUpperCase();
  };

  // Get all picked heroes with their roles
  const bluePicks = [];
  const redPicks = [];
  
  Object.entries(picks).forEach(([key, heroName]) => {
    if (heroName && key.includes('blue')) {
      const role = key.replace('blue_', '').replace('_pick', '');
      bluePicks.push({ name: heroName, role });
    } else if (heroName && key.includes('red')) {
      const role = key.replace('red_', '').replace('_pick', '');
      redPicks.push({ name: heroName, role });
    }
  });

  // Get all banned heroes
  const blueBans = [];
  const redBans = [];
  
  Object.entries(bans).forEach(([key, heroName]) => {
    if (heroName && key.includes('blue')) {
      blueBans.push(heroName);
    } else if (heroName && key.includes('red')) {
      redBans.push(heroName);
    }
  });

  return (
    <div style={{
      width: '1200px',
      height: '800px',
      background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${process.env.PUBLIC_URL}/assets/bg.jpg') center/cover, #181A20`,
      position: 'relative',
      fontFamily: "'Inter', sans-serif",
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Draft Finished Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        zIndex: 10
      }}>
        Draft Finished
      </div>

      {/* Team Blue Section */}
      <div style={{
        position: 'absolute',
        left: '50px',
        top: '80px',
        width: '300px',
        height: '600px'
      }}>
        {/* Team Blue Header */}
        <div style={{
          background: '#3B82F6',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '18px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {blueTeamName || 'Team Blue'}
        </div>

        {/* Blue Bans */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#EF4444' }}>
            Banned Heroes
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {blueBans.map(heroName => (
              <div key={heroName} style={{ position: 'relative', width: '60px', height: '60px' }}>
                <img 
                  src={getHeroImageUrl(heroName)} 
                  alt={heroName} 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #EF4444'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(239, 68, 68, 0.8)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  ×
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blue Picks */}
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#10B981' }}>
            Picked Heroes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {bluePicks.map(({ name, role }) => (
              <div key={`${name}-${role}`} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img 
                  src={getHeroImageUrl(name)} 
                  alt={name} 
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #10B981'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div style={{
                  background: '#FCD34D',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getRoleLabel(role)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Red Section */}
      <div style={{
        position: 'absolute',
        right: '50px',
        top: '80px',
        width: '300px',
        height: '600px'
      }}>
        {/* Team Red Header */}
        <div style={{
          background: '#EF4444',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '18px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {redTeamName || 'Team Red'}
        </div>

        {/* Red Bans */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#EF4444' }}>
            Banned Heroes
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {redBans.map(heroName => (
              <div key={heroName} style={{ position: 'relative', width: '60px', height: '60px' }}>
                <img 
                  src={getHeroImageUrl(heroName)} 
                  alt={heroName} 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #EF4444'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(239, 68, 68, 0.8)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  ×
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Red Picks */}
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#10B981' }}>
            Picked Heroes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {redPicks.map(({ name, role }) => (
              <div key={`${name}-${role}`} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img 
                  src={getHeroImageUrl(name)} 
                  alt={name} 
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #10B981'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div style={{
                  background: '#FCD34D',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getRoleLabel(role)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Selection Grid (Center) */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '80px',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '600px',
        background: 'rgba(35, 35, 42, 0.95)',
        borderRadius: '12px',
        padding: '20px',
        overflowY: 'auto'
      }}>
        {/* Role Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#3B82F6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>All</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>Assassin</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>Fighter</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>Mage</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>Marksman</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>Support</div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}>Tank</div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search hero..." 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #4B5563',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Hero Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
          {heroList.slice(0, 50).map(hero => (
            <div key={hero.name} style={{ textAlign: 'center' }}>
              <img 
                src={getHeroImageUrl(hero.name)} 
                alt={hero.name} 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #4B5563',
                  marginBottom: '5px'
                }}
                onError={(e) => e.target.style.display = 'none'}
              />
              <div style={{
                fontSize: '12px',
                color: 'white',
                textAlign: 'center',
                wordWrap: 'break-word'
              }}>
                {hero.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DraftFinishedScreenshot;
